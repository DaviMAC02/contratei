"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/use-translation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewContractPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [orgId, setOrgId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const orgsQuery = trpc.org.list.useQuery();
  const membersQuery = trpc.org.listMembers.useQuery(
    { orgId },
    { enabled: !!orgId }
  );

  useEffect(() => {
    if (orgsQuery.data && orgsQuery.data.length > 0) {
      setOrgId(orgsQuery.data[0].id);
    }
  }, [orgsQuery.data]);

  const createMutation = trpc.contract.create.useMutation({
    onSuccess: () => {
      router.push("/contracts");
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      await createMutation.mutateAsync({
        orgId,
        title: formData.get("title") as string,
        supplierName: formData.get("supplierName") as string,
        supplierContact:
          (formData.get("supplierContact") as string) || undefined,
        ownerUserId: formData.get("ownerUserId") as string,
        startDate: new Date(formData.get("startDate") as string),
        endDate: formData.get("endDate")
          ? new Date(formData.get("endDate") as string)
          : undefined,
        periodicity: formData.get("periodicity") as any,
        customDays: formData.get("customDays")
          ? Number(formData.get("customDays"))
          : undefined,
        autoRenew: formData.get("autoRenew") === "true",
        valueAmount: Number(formData.get("valueAmount")),
        adjustmentType: formData.get("adjustmentType") as any,
        adjustmentValue: formData.get("adjustmentValue")
          ? Number(formData.get("adjustmentValue"))
          : undefined,
        costCenter: (formData.get("costCenter") as string) || undefined,
        tags:
          (formData.get("tags") as string)
            ?.split(",")
            .map((t) => t.trim())
            .filter(Boolean) || [],
        notes: (formData.get("notes") as string) || undefined,
      });
    } catch (error) {
      console.error("Error creating contract:", error);
      setIsSubmitting(false);
    }
  };

  if (!orgId) {
    return <div className="p-8">Loading...</div>;
  }

  const members = membersQuery.data || [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href="/contracts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>{t("contracts.new")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título do Contrato *</Label>
                <Input
                  id="title"
                  name="title"
                  required
                  placeholder="Ex: Contrato de Marketing Digital"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplierName">Fornecedor *</Label>
                  <Input
                    id="supplierName"
                    name="supplierName"
                    required
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <Label htmlFor="supplierContact">Contato</Label>
                  <Input
                    id="supplierContact"
                    name="supplierContact"
                    placeholder="Email ou telefone"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ownerUserId">Responsável *</Label>
                <Select id="ownerUserId" name="ownerUserId" required>
                  <option value="">Selecione...</option>
                  {members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.user.name || member.user.email}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {/* Dates */}
            <div className="space-y-4">
              <h3 className="font-medium">Datas e Renovação</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Data de Início *</Label>
                  <Input id="startDate" name="startDate" type="date" required />
                </div>
                <div>
                  <Label htmlFor="endDate">Data de Término</Label>
                  <Input id="endDate" name="endDate" type="date" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periodicity">Periodicidade *</Label>
                  <Select id="periodicity" name="periodicity" required>
                    <option value="MONTHLY">Mensal</option>
                    <option value="YEARLY">Anual</option>
                    <option value="CUSTOM_DAYS">Dias Personalizados</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customDays">Dias (se personalizado)</Label>
                  <Input
                    id="customDays"
                    name="customDays"
                    type="number"
                    min="1"
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="autoRenew">Renovação Automática</Label>
                <Select id="autoRenew" name="autoRenew">
                  <option value="true">Sim</option>
                  <option value="false">Não</option>
                </Select>
              </div>
            </div>

            {/* Financial */}
            <div className="space-y-4">
              <h3 className="font-medium">Informações Financeiras</h3>
              <div>
                <Label htmlFor="valueAmount">Valor *</Label>
                <Input
                  id="valueAmount"
                  name="valueAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adjustmentType">Tipo de Reajuste</Label>
                  <Select id="adjustmentType" name="adjustmentType">
                    <option value="NONE">Nenhum</option>
                    <option value="FIXED_PERCENT">Percentual Fixo</option>
                    <option value="INDEX_IPCA">IPCA</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="adjustmentValue">Valor do Reajuste (%)</Label>
                  <Input
                    id="adjustmentValue"
                    name="adjustmentValue"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="5.0"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="costCenter">Centro de Custo</Label>
                <Input
                  id="costCenter"
                  name="costCenter"
                  placeholder="Ex: Marketing"
                />
              </div>
            </div>

            {/* Additional */}
            <div className="space-y-4">
              <h3 className="font-medium">Informações Adicionais</h3>
              <div>
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  name="tags"
                  placeholder="software, cloud, essencial"
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Notas adicionais sobre o contrato..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Link href="/contracts">
                <Button type="button" variant="outline">
                  {t("form.cancel")}
                </Button>
              </Link>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : t("form.save")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
