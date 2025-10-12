"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Building,
  FileText,
  Bell,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orgData, setOrgData] = useState({
    name: "",
    country: "BR" as "BR" | "US",
  });
  const [contractData, setContractData] = useState({
    title: "",
    supplierName: "",
    startDate: "",
    valueAmount: "",
    periodicity: "MONTHLY" as const,
  });
  const [alertSettings, setAlertSettings] = useState({
    alert90: true,
    alert60: true,
    alert30: true,
  });
  const [inviteEmails, setInviteEmails] = useState([""]);

  const createOrgMutation = trpc.org.create.useMutation();
  const createContractMutation = trpc.contract.create.useMutation();
  const inviteUserMutation = trpc.org.inviteUser.useMutation();

  const handleCreateOrg = async () => {
    const org = await createOrgMutation.mutateAsync(orgData);
    setStep(2);
    return org.id;
  };

  const handleCreateContract = async (orgId: string) => {
    if (contractData.title && contractData.supplierName) {
      await createContractMutation.mutateAsync({
        orgId,
        title: contractData.title,
        supplierName: contractData.supplierName,
        ownerUserId: "", // Will be set on server
        startDate: new Date(contractData.startDate),
        valueAmount: Number(contractData.valueAmount),
        periodicity: contractData.periodicity,
        autoRenew: true,
      });
    }
    setStep(3);
  };

  const handleFinish = async (orgId: string) => {
    // Send invites
    for (const email of inviteEmails.filter(Boolean)) {
      await inviteUserMutation.mutateAsync({
        orgId,
        email,
        role: "VIEWER",
      });
    }

    router.push("/dashboard");
  };

  const totalSteps = 4;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">Bem-vindo!</CardTitle>
            <span className="text-sm text-muted-foreground">
              Passo {step} de {totalSteps}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </CardHeader>

        <CardContent className="pt-6">
          {/* Step 1: Create Organization */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Crie sua Organização
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure as informações básicas da sua empresa
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="orgName">Nome da Organização *</Label>
                  <Input
                    id="orgName"
                    placeholder="Minha Empresa LTDA"
                    value={orgData.name}
                    onChange={(e) =>
                      setOrgData({ ...orgData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="country">País / Região *</Label>
                  <Select
                    id="country"
                    value={orgData.country}
                    onChange={(e) =>
                      setOrgData({
                        ...orgData,
                        country: e.target.value as "BR" | "US",
                      })
                    }
                  >
                    <option value="BR">🇧🇷 Brasil (BRL - Português)</option>
                    <option value="US">
                      🇺🇸 Estados Unidos (USD - English)
                    </option>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define a moeda e idioma da sua organização
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateOrg}
                  disabled={!orgData.name || createOrgMutation.isPending}
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Create First Contract */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Crie seu Primeiro Contrato
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Opcional - você pode pular e adicionar depois
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Título do Contrato</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Contrato de Marketing Digital"
                    value={contractData.title}
                    onChange={(e) =>
                      setContractData({
                        ...contractData,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">Fornecedor</Label>
                  <Input
                    id="supplier"
                    placeholder="Nome da empresa fornecedora"
                    value={contractData.supplierName}
                    onChange={(e) =>
                      setContractData({
                        ...contractData,
                        supplierName: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Data de Início</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={contractData.startDate}
                      onChange={(e) =>
                        setContractData({
                          ...contractData,
                          startDate: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="value">Valor</Label>
                    <Input
                      id="value"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={contractData.valueAmount}
                      onChange={(e) =>
                        setContractData({
                          ...contractData,
                          valueAmount: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="periodicity">Periodicidade</Label>
                  <Select
                    id="periodicity"
                    value={contractData.periodicity}
                    onChange={(e) =>
                      setContractData({
                        ...contractData,
                        periodicity: e.target.value as any,
                      })
                    }
                  >
                    <option value="MONTHLY">Mensal</option>
                    <option value="YEARLY">Anual</option>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  Pular
                </Button>
                <Button
                  onClick={() =>
                    handleCreateContract(createOrgMutation.data!.id)
                  }
                  disabled={createContractMutation.isPending}
                >
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Alert Settings */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Bell className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    Configure os Alertas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Seja notificado antes dos contratos vencerem
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="bg-muted/50">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">90 dias antes</p>
                          <p className="text-sm text-muted-foreground">
                            Alerta antecipado
                          </p>
                        </div>
                        <Button
                          variant={
                            alertSettings.alert90 ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setAlertSettings({
                              ...alertSettings,
                              alert90: !alertSettings.alert90,
                            })
                          }
                        >
                          {alertSettings.alert90 ? "Ativado" : "Desativado"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">60 dias antes</p>
                          <p className="text-sm text-muted-foreground">
                            Planejamento médio prazo
                          </p>
                        </div>
                        <Button
                          variant={
                            alertSettings.alert60 ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setAlertSettings({
                              ...alertSettings,
                              alert60: !alertSettings.alert60,
                            })
                          }
                        >
                          {alertSettings.alert60 ? "Ativado" : "Desativado"}
                        </Button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">30 dias antes</p>
                          <p className="text-sm text-muted-foreground">
                            Alerta final
                          </p>
                        </div>
                        <Button
                          variant={
                            alertSettings.alert30 ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setAlertSettings({
                              ...alertSettings,
                              alert30: !alertSettings.alert30,
                            })
                          }
                        >
                          {alertSettings.alert30 ? "Ativado" : "Desativado"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button onClick={() => setStep(4)}>
                  Continuar
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Invite Team */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Convide sua Equipe</h3>
                  <p className="text-sm text-muted-foreground">
                    Opcional - você pode adicionar membros depois
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {inviteEmails.map((email, index) => (
                  <div key={index}>
                    <Label htmlFor={`email-${index}`}>
                      Email do Membro {index + 1}
                    </Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      placeholder="colega@empresa.com"
                      value={email}
                      onChange={(e) => {
                        const newEmails = [...inviteEmails];
                        newEmails[index] = e.target.value;
                        setInviteEmails(newEmails);
                      }}
                    />
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={() => setInviteEmails([...inviteEmails, ""])}
                  className="w-full"
                >
                  + Adicionar Outro Email
                </Button>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Button>
                <Button
                  onClick={() => handleFinish(createOrgMutation.data!.id)}
                  disabled={inviteUserMutation.isPending}
                >
                  <Check className="mr-2 h-4 w-4" />
                  {inviteUserMutation.isPending
                    ? "Finalizando..."
                    : "Finalizar"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
