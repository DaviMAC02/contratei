"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Pagination,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "@/lib/use-translation";
import { UserPlus, Mail, Trash2, Shield, RefreshCw } from "lucide-react";
import { DebouncedInput } from "@/components/shared/debounced-input";
import { OrgRole } from "@prisma/client";
import { useSelectedOrg } from "@/hooks/use-selected-org";

// Styled components
const StatsCard = styled(MuiCard)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  backgroundColor: "#ffffff",
  cursor: "pointer",
}));

type TeamClientProps = {
  initialMembers: any[];
  initialNextCursor?: string;
  initialSearch?: string;
  initialRoleFilter?: string;
};

export default function TeamClient({
  initialMembers,
  initialNextCursor,
  initialSearch = "",
  initialRoleFilter = "",
}: TeamClientProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedOrgId: orgId } = useSelectedOrg();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MANAGER" | "VIEWER">(
    "VIEWER"
  );
  const [search, setSearch] = useState(initialSearch);
  const [roleFilter, setRoleFilter] = useState<OrgRole | "">(
    (initialRoleFilter as OrgRole | "") || ""
  );

  // Use server data initially
  const [members, setMembers] = useState(initialMembers);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);

  const inviteMutation = trpc.org.inviteUser.useMutation({
    onSuccess: () => {
      setShowInviteModal(false);
      setInviteEmail("");
      // Refresh by navigating to same page
      router.refresh();
    },
  });

  const hasNextPage = !!nextCursor;

  const handleSearchChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("search", value);
    } else {
      params.delete("search");
    }
    params.delete("cursor"); // Reset pagination
    router.push(`?${params.toString()}`);
  };

  const handleRoleFilterChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("role", value);
    } else {
      params.delete("role");
    }
    params.delete("cursor"); // Reset pagination
    router.push(`?${params.toString()}`);
  };

  const handleNextPage = () => {
    if (hasNextPage && nextCursor) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("cursor", nextCursor);
      router.push(`?${params.toString()}`);
    }
  };

  const handlePreviousPage = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("cursor");
    router.push(`?${params.toString()}`);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgId) return;

    try {
      await inviteMutation.mutateAsync({
        orgId,
        email: inviteEmail,
        role: inviteRole,
      });
      // Success is already handled by the mutation's onSuccess callback
    } catch (error: any) {
      // The error message from the backend will be displayed automatically by tRPC
      console.error("Erro ao enviar convite:", error.message);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    // TODO: Implement changeUserRole mutation
    console.log("Change role not implemented yet", { userId, newRole });
  };

  const [removeUserId, setRemoveUserId] = useState<string | null>(null);
  const handleRemove = async (userId: string) => {
    setRemoveUserId(userId);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <Box className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Typography
              variant="h4"
              className="font-semibold text-gray-900 mb-1"
            >
              {t("nav.team")}
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Gerencie os membros da sua organização
            </Typography>
          </div>
          <Button
            variant="contained"
            size="small"
            startIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setShowInviteModal(true)}
            sx={{
              bgcolor: "#1d2b48",
              width: { xs: "100%", sm: "auto" },
              "&:hover": {
                bgcolor: "#b3efe5",
                color: "#1d2b48",
                border: "1px solid rgba(0, 0, 0, 0.2)",
              },
            }}
          >
            Convidar Membro
          </Button>
        </div>
      </Box>

      {/* Filters */}
      <MuiCard
        sx={{
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          mb: 3,
        }}
      >
        <MuiCardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <DebouncedInput
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar membros..."
            />
            <TextField
              select
              value={roleFilter}
              onChange={(e) => handleRoleFilterChange(e.target.value)}
              size="medium"
              sx={{
                width: { xs: "100%", sm: 192 },
                "& .MuiOutlinedInput-root": {
                  height: 42,
                },
              }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Todos os papéis</option>
              <option value="OWNER">Proprietário</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="VIEWER">Viewer</option>
            </TextField>
          </div>
        </MuiCardContent>
      </MuiCard>

      {/* Results Info */}
      <Box className="mb-4">
        <Typography variant="body2" className="text-gray-600">
          Mostrando {members.length} membro{members.length !== 1 ? "s" : ""}
        </Typography>
      </Box>

      {/* Desktop Table */}
      <MuiCard
        sx={{
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          overflow: "hidden",
        }}
        className="hidden md:block"
      >
        <TableContainer>
          <Table
            sx={{
              "& .MuiTableCell-root": {
                borderBottom: "1px solid #d1d5db",
                px: 3,
              },
              "& .MuiTableHead-root .MuiTableCell-root": {
                fontWeight: 600,
                px: 4,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center">Nome</TableCell>
                <TableCell align="center">Email</TableCell>
                <TableCell align="center">Papel</TableCell>
                <TableCell align="center">Adicionado em</TableCell>
                <TableCell align="center">Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <p className="text-gray-500 mb-4">
                      Nenhum membro encontrado.
                    </p>
                    <Button
                      variant="outlined"
                      onClick={() => setShowInviteModal(true)}
                      sx={{
                        borderColor: "#1d2b48",
                        color: "#1d2b48",
                        "&:hover": {
                          bgcolor: "#b3efe5",
                          borderColor: "rgba(0, 0, 0, 0.2)",
                          color: "#1d2b48",
                          border: "1px solid rgba(0, 0, 0, 0.2)",
                        },
                      }}
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Convidar primeiro membro
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell align="center">
                      <div className="flex items-center gap-2 justify-center">
                        {member.user.name || "Sem nome"}
                        {member.role === "OWNER" && (
                          <Shield className="h-4 w-4 text-yellow-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell align="center">{member.user.email}</TableCell>
                    <TableCell align="center">
                      {member.role === "OWNER" ? (
                        <Chip
                          label="Proprietário"
                          size="small"
                          variant="outlined"
                          sx={{
                            fontWeight: 500,
                            fontSize: "0.75rem",
                            height: 22,
                            bgcolor: "#e8f4f2",
                            color: "#1d2b48",
                            borderColor: "#1d2b48",
                          }}
                        />
                      ) : (
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                          <Select
                            value={member.role}
                            onChange={(e) =>
                              handleChangeRole(member.userId, e.target.value)
                            }
                            variant="outlined"
                            sx={{
                              height: 28,
                              fontSize: "0.75rem",
                              "& .MuiSelect-select": {
                                padding: "4px 8px",
                                paddingRight: "24px !important",
                              },
                              "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#d1d5db",
                              },
                              "&:hover .MuiOutlinedInput-notchedOutline": {
                                borderColor: "#9ca3af",
                              },
                              "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                {
                                  borderColor: "#1d2b48",
                                  borderWidth: 1,
                                },
                            }}
                          >
                            <MenuItem value="ADMIN">Admin</MenuItem>
                            <MenuItem value="MANAGER">Manager</MenuItem>
                            <MenuItem value="VIEWER">Viewer</MenuItem>
                          </Select>
                        </FormControl>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell align="center">
                      {member.role !== "OWNER" && (
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => handleRemove(member.userId)}
                          disableRipple
                          disableElevation
                          sx={{
                            color: "#ef4444",
                            cursor: "pointer",
                            boxShadow: "none !important",
                            "&:hover": {
                              backgroundColor: "transparent !important",
                              color: "#ef4444 !important",
                              boxShadow: "none !important",
                            },
                            "&:active": {
                              backgroundColor: "transparent !important",
                              color: "#ef4444 !important",
                              boxShadow: "none !important",
                            },
                            "&:focus": {
                              backgroundColor: "transparent !important",
                              color: "#ef4444 !important",
                              boxShadow: "none !important",
                            },
                          }}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </MuiCard>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {members.length === 0 ? (
          <MuiCard
            sx={{
              borderRadius: 1,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <MuiCardContent className="p-6 text-center">
              <p className="text-gray-500 mb-4">Nenhum membro encontrado.</p>
              <Button
                variant="outlined"
                onClick={() => setShowInviteModal(true)}
                sx={{
                  borderColor: "#1d2b48",
                  color: "#1d2b48",
                  "&:hover": {
                    bgcolor: "#b3efe5",
                    borderColor: "rgba(0, 0, 0, 0.2)",
                    color: "#1d2b48",
                    border: "1px solid rgba(0, 0, 0, 0.2)",
                  },
                }}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Convidar primeiro membro
              </Button>
            </MuiCardContent>
          </MuiCard>
        ) : (
          members.map((member) => (
            <StatsCard key={member.id}>
              <MuiCardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Typography variant="body1" fontWeight={600}>
                        {member.user.name || "Sem nome"}
                      </Typography>
                      {member.role === "OWNER" && (
                        <Shield className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                    <Typography variant="body2" className="text-gray-600 mb-2">
                      {member.user.email}
                    </Typography>

                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 uppercase tracking-wide"
                        >
                          Papel
                        </Typography>
                        <div className="mt-1">
                          {member.role === "OWNER" ? (
                            <Chip
                              label="Proprietário"
                              size="small"
                              variant="outlined"
                              sx={{
                                fontWeight: 500,
                                fontSize: "0.75rem",
                                height: 22,
                                bgcolor: "#e8f4f2",
                                color: "#1d2b48",
                                borderColor: "#1d2b48",
                              }}
                            />
                          ) : (
                            <FormControl size="small" sx={{ minWidth: 100 }}>
                              <Select
                                value={member.role}
                                onChange={(e) =>
                                  handleChangeRole(
                                    member.userId,
                                    e.target.value
                                  )
                                }
                                variant="outlined"
                                sx={{
                                  height: 28,
                                  fontSize: "0.75rem",
                                  "& .MuiSelect-select": {
                                    padding: "4px 8px",
                                    paddingRight: "24px !important",
                                  },
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#d1d5db",
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#9ca3af",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "#1d2b48",
                                      borderWidth: 1,
                                    },
                                }}
                              >
                                <MenuItem value="ADMIN">Admin</MenuItem>
                                <MenuItem value="MANAGER">Manager</MenuItem>
                                <MenuItem value="VIEWER">Viewer</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        </div>
                      </div>

                      <div>
                        <Typography
                          variant="caption"
                          className="text-gray-500 uppercase tracking-wide"
                        >
                          Adicionado em
                        </Typography>
                        <Typography
                          variant="body2"
                          className="font-medium mt-1"
                        >
                          {new Date(member.createdAt).toLocaleDateString()}
                        </Typography>
                      </div>
                    </div>

                    {member.role !== "OWNER" && (
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        onClick={() => handleRemove(member.userId)}
                        disableRipple
                        disableElevation
                        sx={{
                          borderColor: "#ef4444",
                          color: "#ef4444",
                          cursor: "pointer",
                          boxShadow: "none !important",
                          "&:hover": {
                            backgroundColor: "transparent !important",
                            borderColor: "#ef4444 !important",
                            color: "#ef4444 !important",
                            boxShadow: "none !important",
                          },
                          "&:active": {
                            backgroundColor: "transparent !important",
                            borderColor: "#ef4444 !important",
                            color: "#ef4444 !important",
                            boxShadow: "none !important",
                          },
                          "&:focus": {
                            backgroundColor: "transparent !important",
                            borderColor: "#ef4444 !important",
                            color: "#ef4444 !important",
                            boxShadow: "none !important",
                          },
                        }}
                      >
                        <Trash2 className="h-5 w-5 mr-2" />
                        Remover
                      </Button>
                    )}
                  </div>
                </div>
              </MuiCardContent>
            </StatsCard>
          ))
        )}
      </div>

      {/* Pagination */}
      {members.length > 0 && (
        <Box className="mt-6 flex justify-center gap-2">
          <Button
            variant="outlined"
            onClick={handlePreviousPage}
            disabled={!searchParams.get("cursor")}
            sx={{
              borderColor: "#1d2b48",
              color: "#1d2b48",
              "&:hover": {
                bgcolor: "#b3efe5",
                borderColor: "rgba(0, 0, 0, 0.2)",
              },
              "&:disabled": {
                borderColor: "#e5e7eb",
                color: "#9ca3af",
              },
            }}
          >
            Anterior
          </Button>
          <Button
            variant="outlined"
            onClick={handleNextPage}
            disabled={!hasNextPage}
            sx={{
              borderColor: "#1d2b48",
              color: "#1d2b48",
              "&:hover": {
                bgcolor: "#b3efe5",
                borderColor: "rgba(0, 0, 0, 0.2)",
              },
              "&:disabled": {
                borderColor: "#e5e7eb",
                color: "#9ca3af",
              },
            }}
          >
            Próxima
          </Button>
        </Box>
      )}

      {/* Invite Modal */}
      <Dialog
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle sx={{ pb: 2 }}>
          <Typography variant="h6" fontWeight={600}>
            Convidar Novo Membro
          </Typography>
        </DialogTitle>
        <form onSubmit={handleInvite}>
          <DialogContent sx={{ pt: 0 }}>
            <Box className="space-y-4 pt-2">
              <TextField
                label="Email"
                type="email"
                required
                fullWidth
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 1,
                  },
                }}
              />

              <FormControl fullWidth required>
                <InputLabel>Papel</InputLabel>
                <Select
                  value={inviteRole}
                  label="Papel"
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  sx={{
                    borderRadius: 1,
                  }}
                >
                  <MenuItem value="ADMIN">Admin - Acesso completo</MenuItem>
                  <MenuItem value="MANAGER">
                    Manager - Gerenciar contratos
                  </MenuItem>
                  <MenuItem value="VIEWER">Viewer - Apenas visualizar</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 2 }}>
            <Button
              onClick={() => setShowInviteModal(false)}
              variant="outlined"
              sx={{
                textTransform: "none",
                borderColor: "#1d2b48",
                color: "#1d2b48",
                "&:hover": {
                  bgcolor: "#b3efe5",
                  borderColor: "rgba(0, 0, 0, 0.2)",
                  color: "#1d2b48",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                },
              }}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={inviteMutation.isPending}
              startIcon={
                inviteMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )
              }
              sx={{
                bgcolor: "#1d2b48",
                "&:hover": {
                  bgcolor: "#b3efe5",
                  color: "#1d2b48",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                },
                textTransform: "none",
                "&:disabled": {
                  backgroundColor: "#9ca3af",
                },
              }}
            >
              {inviteMutation.isPending ? "Enviando..." : "Enviar Convite"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Remove Member Modal */}
      <Dialog
        open={!!removeUserId}
        onClose={() => setRemoveUserId(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Remover membro</DialogTitle>
        <DialogContent>
          Tem certeza que deseja remover este usuário da organização?
        </DialogContent>
        <DialogActions>
          <Button variant="text" onClick={() => setRemoveUserId(null)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              console.log("Remove user not implemented yet", { userId: removeUserId });
              setRemoveUserId(null);
              router.refresh();
            }}
          >
            Remover
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
