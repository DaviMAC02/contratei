"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select } from "@/components/ui/select";
import { useTranslation } from "@/lib/use-translation";
import { UserPlus, Mail, Trash2, Shield } from "lucide-react";
import { DashboardPageWrapper } from "@/components/layout/dashboard-page-wrapper";

export default function TeamPage() {
  return (
    <DashboardPageWrapper>
      {({ orgId }) => <TeamContent orgId={orgId} />}
    </DashboardPageWrapper>
  );
}

function TeamContent({ orgId }: { orgId: string }) {
  const { t } = useTranslation();
  const router = useRouter();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MANAGER" | "VIEWER">(
    "VIEWER"
  );

  const membersQuery = trpc.org.listMembers.useQuery(
    { orgId: orgId || "" },
    { enabled: !!orgId }
  );

  const inviteMutation = trpc.org.inviteUser.useMutation({
    onSuccess: () => {
      setShowInviteModal(false);
      setInviteEmail("");
      membersQuery.refetch();
    },
  });

  // TODO: Implement these mutations in the org router
  // const changeRoleMutation = trpc.org.changeUserRole.useMutation({
  //   onSuccess: () => {
  //     membersQuery.refetch();
  //   },
  // });

  // const removeMutation = trpc.org.removeUser.useMutation({
  //   onSuccess: () => {
  //     membersQuery.refetch();
  //   },
  // });

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;
    await inviteMutation.mutateAsync({
      orgId,
      email: inviteEmail,
      role: inviteRole,
    });
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    // TODO: Implement changeUserRole mutation
    console.log("Change role not implemented yet", { userId, newRole });
  };

  const handleRemove = async (userId: string) => {
    // TODO: Implement removeUser mutation
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      console.log("Remove user not implemented yet", { userId });
    }
  };

  const members = membersQuery.data || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("nav.team")}</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os membros da sua organização
          </p>
        </div>
        <Button onClick={() => setShowInviteModal(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Convidar Membro
        </Button>
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Membros da Equipe</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Papel</TableHead>
                <TableHead>Adicionado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {member.user.name || "Sem nome"}
                      {member.role === "OWNER" && (
                        <Shield className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{member.user.email}</TableCell>
                  <TableCell>
                    {member.role === "OWNER" ? (
                      <Badge variant="default">
                        {t(`role.${member.role.toLowerCase()}` as any)}
                      </Badge>
                    ) : (
                      <Select
                        value={member.role}
                        onChange={(e) =>
                          handleChangeRole(member.userId, e.target.value)
                        }
                        className="w-32"
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="VIEWER">Viewer</option>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(member.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {member.role !== "OWNER" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(member.userId)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Convidar Novo Membro</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="usuario@empresa.com"
                  />
                </div>

                <div>
                  <Label htmlFor="role">Papel *</Label>
                  <Select
                    id="role"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                  >
                    <option value="ADMIN">Admin - Acesso completo</option>
                    <option value="MANAGER">
                      Manager - Gerenciar contratos
                    </option>
                    <option value="VIEWER">Viewer - Apenas visualizar</option>
                  </Select>
                </div>

                <div className="flex gap-4 justify-end pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowInviteModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    {inviteMutation.isPending ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Mail className="h-4 w-4 mr-2" />
                        Enviar Convite
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
