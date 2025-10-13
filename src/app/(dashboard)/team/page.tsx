"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { skipToken } from "@tanstack/react-query";
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
import { DashboardPageWrapper } from "@/components/layout/dashboard-page-wrapper";
import { DebouncedInput } from "@/components/shared/debounced-input";
import { OrgRole } from "@prisma/client";

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

export default function TeamPage() {
  return (
    <DashboardPageWrapper>
      {({ orgId }) => <TeamContent orgId={orgId} />}
    </DashboardPageWrapper>
  );
}

function TeamContentSkeleton() {
  return (
    <>
      {/* Desktop Table Skeleton */}
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
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={100}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
                <TableCell align="center">
                  <Skeleton
                    variant="rectangular"
                    width={60}
                    height={20}
                    sx={{ borderRadius: 1, margin: "0 auto" }}
                  />
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell align="center">
                    <div className="flex items-center gap-2 justify-center">
                      <Skeleton
                        variant="rectangular"
                        width={120}
                        height={20}
                        sx={{ borderRadius: 1 }}
                      />
                    </div>
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rectangular"
                      width={180}
                      height={20}
                      sx={{ borderRadius: 1, margin: "0 auto" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={28}
                      sx={{ borderRadius: 1, margin: "0 auto" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="rectangular"
                      width={100}
                      height={20}
                      sx={{ borderRadius: 1, margin: "0 auto" }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Skeleton
                      variant="circular"
                      width={32}
                      height={32}
                      sx={{ margin: "0 auto" }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </MuiCard>

      {/* Mobile Cards Skeleton */}
      <div className="md:hidden space-y-4">
        {[...Array(3)].map((_, i) => (
          <MuiCard
            key={i}
            sx={{
              borderRadius: 1,
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            }}
          >
            <MuiCardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <Skeleton
                    variant="rectangular"
                    width={150}
                    height={20}
                    sx={{ mb: 1, borderRadius: 1 }}
                  />
                  <Skeleton
                    variant="rectangular"
                    width={200}
                    height={16}
                    sx={{ mb: 2, borderRadius: 1 }}
                  />

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <Skeleton
                        variant="rectangular"
                        width={40}
                        height={12}
                        sx={{ mb: 1, borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={80}
                        height={28}
                        sx={{ borderRadius: 1 }}
                      />
                    </div>
                    <div>
                      <Skeleton
                        variant="rectangular"
                        width={80}
                        height={12}
                        sx={{ mb: 1, borderRadius: 1 }}
                      />
                      <Skeleton
                        variant="rectangular"
                        width={100}
                        height={16}
                        sx={{ borderRadius: 1 }}
                      />
                    </div>
                  </div>

                  <Skeleton
                    variant="rectangular"
                    width="100%"
                    height={32}
                    sx={{ borderRadius: 1 }}
                  />
                </div>
              </div>
            </MuiCardContent>
          </MuiCard>
        ))}
      </div>
    </>
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
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<OrgRole | "">("");
  const [currentPage, setCurrentPage] = useState(1);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const itemsPerPage = 10;

  const membersQuery = trpc.org.listMembers.useQuery(
    orgId && orgId.trim()
      ? {
          orgId,
          search: search || undefined,
          role: roleFilter || undefined,
          limit: itemsPerPage,
          cursor: cursors[currentPage - 1],
        }
      : skipToken
  );

  const inviteMutation = trpc.org.inviteUser.useMutation({
    onSuccess: () => {
      setShowInviteModal(false);
      setInviteEmail("");
      membersQuery.refetch();
    },
  });

  const members = membersQuery.data?.members || [];
  const nextCursor = membersQuery.data?.nextCursor;
  const hasNextPage = !!nextCursor;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
    setCursors([undefined]);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value as OrgRole | "");
    setCurrentPage(1);
    setCursors([undefined]);
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);

      if (cursors.length < newPage) {
        setCursors([...cursors, nextCursor]);
      }
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
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

  const handleRemove = async (userId: string) => {
    // TODO: Implement removeUser mutation
    if (confirm("Tem certeza que deseja remover este usuário?")) {
      console.log("Remove user not implemented yet", { userId });
    }
  };

  if (membersQuery.isLoading) {
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

        {/* Results Info Skeleton */}
        <Box className="mb-4">
          <Skeleton
            variant="rectangular"
            width={200}
            height={16}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Table/Cards Skeleton */}
        <TeamContentSkeleton />
      </div>
    );
  }

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
      {!membersQuery.isLoading && (
        <Box className="mb-4">
          <Typography variant="body2" className="text-gray-600">
            Mostrando {members.length} membro{members.length !== 1 ? "s" : ""}{" "}
            da página {currentPage}
          </Typography>
        </Box>
      )}

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
      {!membersQuery.isLoading && members.length > 0 && (
        <Box className="mt-6 flex justify-center">
          <Pagination
            count={hasNextPage ? currentPage + 1 : currentPage}
            page={currentPage}
            onChange={(_, page) => {
              if (page > currentPage) {
                handleNextPage();
              } else if (page < currentPage) {
                handlePreviousPage();
              }
            }}
            color="primary"
            sx={{
              "& .MuiPaginationItem-root": {
                color: "#1d2b48",
                "&.Mui-selected": {
                  bgcolor: "#1d2b48",
                  color: "#fff",
                  "&:hover": {
                    bgcolor: "#2d3b58",
                  },
                },
                "&:hover": {
                  bgcolor: "#b3efe5",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                },
              },
            }}
          />
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
    </div>
  );
}
