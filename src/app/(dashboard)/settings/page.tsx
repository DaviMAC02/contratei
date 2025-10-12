"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/use-translation";
import { Save, Bell, Globe, Building } from "lucide-react";
import { useSession } from "next-auth/react";
import { DashboardPageWrapper } from "@/components/layout/dashboard-page-wrapper";

export default function SettingsPage() {
  return (
    <DashboardPageWrapper>
      {({ orgId, org }) => <SettingsContent orgId={orgId} org={org} />}
    </DashboardPageWrapper>
  );
}

function SettingsContent({ orgId, org }: { orgId: string; org: any }) {
  const { t } = useTranslation();
  const { data: session } = useSession();

  const updateOrgMutation = trpc.org.update.useMutation({
    onSuccess: () => {
      alert("Configurações salvas com sucesso!");
    },
  });

  const handleUpdateOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orgId) return;
    const formData = new FormData(e.currentTarget);

    await updateOrgMutation.mutateAsync({
      orgId,
      name: formData.get("name") as string,
      // TODO: Add more updatable fields as needed
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("nav.settings")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure sua organização e preferências
        </p>
      </div>

      <div className="grid gap-6 max-w-3xl">
        {/* Organization Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Organização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateOrg} className="space-y-4">
              <div>
                <Label htmlFor="name">Nome da Organização *</Label>
                <Input
                  id="name"
                  name="name"
                  required
                  defaultValue={org?.name}
                />
              </div>

              <div>
                <Label htmlFor="country">País / Região *</Label>
                <Select
                  id="country"
                  name="country"
                  required
                  defaultValue={org?.country}
                >
                  <option value="BR">Brasil (BRL)</option>
                  <option value="US">Estados Unidos (USD)</option>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  Define a moeda e idioma padrão da organização
                </p>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={updateOrgMutation.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  {updateOrgMutation.isPending
                    ? "Salvando..."
                    : "Salvar Alterações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Perfil do Usuário</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input value={session?.user?.name || ""} disabled />
            </div>

            <div>
              <Label>Email</Label>
              <Input value={session?.user?.email || ""} disabled />
            </div>

            <p className="text-sm text-muted-foreground">
              Para alterar seu nome ou email, entre em contato com o suporte.
            </p>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="alert90">Alertas 90 dias antes</Label>
              <Select id="alert90" defaultValue="true">
                <option value="true">Ativado</option>
                <option value="false">Desativado</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="alert60">Alertas 60 dias antes</Label>
              <Select id="alert60" defaultValue="true">
                <option value="true">Ativado</option>
                <option value="false">Desativado</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="alert30">Alertas 30 dias antes</Label>
              <Select id="alert30" defaultValue="true">
                <option value="true">Ativado</option>
                <option value="false">Desativado</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">Fuso Horário</Label>
              <Select id="timezone" defaultValue="America/Sao_Paulo">
                <option value="America/Sao_Paulo">Brasília (GMT-3)</option>
                <option value="America/New_York">Nova York (GMT-5)</option>
                <option value="Europe/London">Londres (GMT+0)</option>
                <option value="Asia/Tokyo">Tóquio (GMT+9)</option>
              </Select>
            </div>

            <Button variant="outline">
              <Save className="h-4 w-4 mr-2" />
              Salvar Preferências
            </Button>
          </CardContent>
        </Card>

        {/* Localization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Idioma</Label>
              <Input
                value={
                  org?.locale === "pt-BR"
                    ? "Português (Brasil)"
                    : "English (US)"
                }
                disabled
              />
              <p className="text-sm text-muted-foreground mt-1">
                O idioma é definido automaticamente pelo país da organização
              </p>
            </div>

            <div>
              <Label>Moeda</Label>
              <Input value={org?.currency || "BRL"} disabled />
              <p className="text-sm text-muted-foreground mt-1">
                A moeda é definida automaticamente pelo país da organização
              </p>
            </div>

            <div>
              <Label>Formato de Data</Label>
              <Input
                value={org?.locale === "pt-BR" ? "DD/MM/YYYY" : "MM/DD/YYYY"}
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Zona de Perigo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Excluir Organização</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Esta ação não pode ser desfeita. Todos os contratos, arquivos e
                dados serão permanentemente excluídos.
              </p>
              <Button variant="destructive">Excluir Organização</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
