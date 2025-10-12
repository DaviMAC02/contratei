"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [orgId, setOrgId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contractId = params.id as string;

  const orgsQuery = trpc.org.list.useQuery();
  const contractQuery = trpc.contract.get.useQuery(
    { orgId, id: contractId },
    { enabled: !!orgId }
  );
  const membersQuery = trpc.org.listMembers.useQuery(
    { orgId },
    { enabled: !!orgId }
  );

  useEffect(() => {
    if (orgsQuery.data && orgsQuery.data.length > 0) {
      setOrgId(orgsQuery.data[0].id);
    }
  }, [orgsQuery.data]);

  const updateMutation = trpc.contract.update.useMutation({
    onSuccess: () => {
      router.push(`/contracts/${contractId}`);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      await updateMutation.mutateAsync({
        orgId,
        id: contractId,
        title: formData.get("title") as string,
        supplierName: formData.get("supplierName") as string,
        supplierContact:
          (formData.get("supplierContact") as string) || undefined,
        ownerUserId: formData.get("ownerUserId") as string,
        endDate: formData.get("endDate")
          ? new Date(formData.get("endDate") as string)
          : undefined,
        autoRenew: formData.get("autoRenew") === "true",
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
      console.error("Error updating contract:", error);
      setIsSubmitting(false);
    }
  };

  if (!orgId || contractQuery.isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!contractQuery.data) {
    return <div className="p-8">Contrato não encontrado.</div>;
  }

  const contract = contractQuery.data;
  const members = membersQuery.data || [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/contracts/${contractId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>{t("contracts.edit")}</CardTitle>
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
                  defaultValue={contract.title}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="supplierName">Fornecedor *</Label>
                  <Input
                    id="supplierName"
                    name="supplierName"
                    required
                    defaultValue={contract.supplierName}
                  />
                </div>
                <div>
                  <Label htmlFor="supplierContact">Contato</Label>
                  <Input
                    id="supplierContact"
                    name="supplierContact"
                    defaultValue={contract.supplierContact || ""}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="ownerUserId">Responsável *</Label>
                <Select
                  id="ownerUserId"
                  name="ownerUserId"
                  required
                  defaultValue={contract.ownerUserId}
                >
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
              <div>
                <Label htmlFor="endDate">Data de Término</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  defaultValue={
                    contract.endDate
                      ? new Date(contract.endDate).toISOString().split("T")[0]
                      : ""
                  }
                />
              </div>

              <div>
                <Label htmlFor="autoRenew">Renovação Automática</Label>
                <Select
                  id="autoRenew"
                  name="autoRenew"
                  defaultValue={contract.autoRenew ? "true" : "false"}
                >
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
                  defaultValue={Number(contract.valueAmount)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="adjustmentType">Tipo de Reajuste</Label>
                  <Select
                    id="adjustmentType"
                    name="adjustmentType"
                    defaultValue={contract.adjustmentType}
                  >
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
                    defaultValue={
                      contract.adjustmentValue
                        ? Number(contract.adjustmentValue)
                        : ""
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="costCenter">Centro de Custo</Label>
                <Input
                  id="costCenter"
                  name="costCenter"
                  defaultValue={contract.costCenter || ""}
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
                  defaultValue={contract.tags.join(", ")}
                />
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  defaultValue={contract.notes || ""}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4 justify-end">
              <Link href={`/contracts/${contractId}`}>
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
