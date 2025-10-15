"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  renewContract,
  deleteContract,
} from "@/app/(dashboard)/contracts/[id]/actions";
import {
  Button,
  Chip,
  Card,
  CardContent,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Divider,
  Snackbar,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "@/lib/use-translation";
import {
  formatCurrency,
  formatDate,
  getStatusTranslationKey,
} from "@/lib/utils";
import {
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw,
  TrendingUp,
  FileText,
  Upload,
  Download,
} from "lucide-react";
import Link from "next/link";

// Styled Card matching dashboard styles
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  transition: "all 0.2s ease",
  backgroundColor: "#ffffff",
  "&:hover": {
    boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
    borderColor: "#d1d5db",
  },
}));

interface ContractDetailClientProps {
  initialContract: any;
  initialFiles: any[];
  initialOrgs: any[];
  initialOrgId: string;
}

export default function ContractDetailClient({
  initialContract,
  initialFiles,
  initialOrgs,
  initialOrgId,
}: ContractDetailClientProps) {
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [isRenewing, setIsRenewing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const contract = initialContract;
  const files = initialFiles;
  const org = initialOrgs?.[0];
  const contractId = contract.id;

  const handleRenew = async () => {
    if (confirm("Deseja renovar este contrato?")) {
      setIsRenewing(true);
      try {
        await renewContract(contractId);
        router.refresh();
      } catch (error) {
        console.error("Erro ao renovar contrato:", error);
        setErrorToast("Erro ao renovar contrato. Por favor, tente novamente.");
      } finally {
        setIsRenewing(false);
      }
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
      )
    ) {
      setIsDeleting(true);
      try {
        await deleteContract(contractId);
        router.push("/contracts");
        router.refresh();
      } catch (error) {
        console.error("Erro ao excluir contrato:", error);
        setErrorToast("Erro ao excluir contrato. Por favor, tente novamente.");
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <Box className="mb-6">
        <Link
          href="/contracts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </Box>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {contract.title}
            </h1>
            <Chip
              label={t(
                `status.${getStatusTranslationKey(contract.status)}` as any
              )}
              variant="outlined"
              size="small"
              sx={{
                borderColor:
                  contract.status === "ACTIVE"
                    ? "#10b981"
                    : contract.status === "DUE_SOON"
                    ? "#f59e0b"
                    : contract.status === "EXPIRED"
                    ? "#ef4444"
                    : "#e5e7eb",
                color:
                  contract.status === "ACTIVE"
                    ? "#10b981"
                    : contract.status === "DUE_SOON"
                    ? "#f59e0b"
                    : contract.status === "EXPIRED"
                    ? "#ef4444"
                    : "#6b7280",
                fontWeight: 500,
              }}
            />
            <Chip
              label={
                contract.contractType === "INBOUND"
                  ? "Prestando Serviço"
                  : "Contratando Serviço"
              }
              variant="outlined"
              size="small"
              sx={{
                ml: 1,
                borderColor: "#e5e7eb",
                color: "#6b7280",
              }}
            />
          </div>
          <p className="text-muted-foreground">{contract.counterpartyName}</p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outlined"
            size="small"
            onClick={handleRenew}
            disabled={isRenewing}
            startIcon={<RefreshCw style={{ width: 16, height: 16 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              color: "#374151",
              borderColor: "#e5e7eb",
              "&:hover": {
                borderColor: "#d1d5db",
                bgcolor: "#f9fafb",
              },
            }}
          >
            {t("contracts.renew")}
          </Button>
          <Link href={`/contracts/${contractId}/edit`}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Edit style={{ width: 16, height: 16 }} />}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                color: "#374151",
                borderColor: "#e5e7eb",
                "&:hover": {
                  borderColor: "#d1d5db",
                  bgcolor: "#f9fafb",
                },
              }}
            >
              {t("contracts.edit")}
            </Button>
          </Link>
          <Button
            variant="contained"
            size="small"
            onClick={handleDelete}
            disabled={isDeleting}
            startIcon={<Trash2 style={{ width: 16, height: 16 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              bgcolor: "#ef4444",
              "&:hover": {
                bgcolor: "#dc2626",
              },
              "&:disabled": {
                bgcolor: "#9ca3af",
              },
            }}
          >
            {t("contracts.delete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Contract Details */}
        <StyledCard>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, color: "#1d2b48" }}
            >
              Detalhes do Contrato
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Responsável:</span>
                <span className="font-medium">{contract.owner.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-medium">
                  {formatCurrency(
                    Number(contract.valueAmount),
                    contract.currency as any,
                    org?.locale
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de Início:</span>
                <span>{formatDate(contract.startDate, org?.locale)}</span>
              </div>
              {contract.endDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Data de Término:
                  </span>
                  <span>{formatDate(contract.endDate, org?.locale)}</span>
                </div>
              )}
              {contract.nextRenewalDate && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Próxima Renovação:
                  </span>
                  <span>
                    {formatDate(contract.nextRenewalDate, org?.locale)}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Periodicidade:</span>
                <span>
                  {t(
                    `periodicity.${contract.periodicity.toLowerCase()}` as any
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Renovação Automática:
                </span>
                <span>{contract.autoRenew ? "Sim" : "Não"}</span>
              </div>
              {contract.costCenter && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Centro de Custo:
                  </span>
                  <span>{contract.costCenter}</span>
                </div>
              )}
              {contract.tags.length > 0 && (
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Tags:
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {contract.tags.map((tag: string) => (
                      <Chip
                        key={tag}
                        label={tag}
                        variant="outlined"
                        size="small"
                      />
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
          </CardContent>
        </StyledCard>

        {/* Supplier Info */}
        <StyledCard>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, color: "#1d2b48" }}
            >
              Informações do Fornecedor
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{contract.counterpartyName}</span>
              </div>
              {contract.counterpartyContact && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contato:</span>
                  <span>{contract.counterpartyContact}</span>
                </div>
              )}
              {contract.notes && (
                <Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    Observações:
                  </Typography>
                  <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                    {contract.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </StyledCard>
      </div>

      {/* Files */}
      <StyledCard sx={{ mb: 4 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#1d2b48" }}>
              {t("contracts.files")}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              startIcon={<Upload style={{ width: 16, height: 16 }} />}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                color: "#1d2b48",
                borderColor: "#e5e7eb",
              }}
            >
              Upload Arquivo
            </Button>
          </Box>
          {files.length === 0 ? (
            <Typography
              sx={{ textAlign: "center", color: "text.secondary", py: 4 }}
            >
              Nenhum arquivo anexado
            </Typography>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Nome do Arquivo</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Tamanho</TableCell>
                  <TableCell>Upload em</TableCell>
                  <TableCell align="right">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell sx={{ fontWeight: 500 }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <FileText
                          style={{ width: 16, height: 16, color: "#6b7280" }}
                        />
                        {file.fileName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={file.fileType}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {(file.sizeBytes / 1024).toFixed(0)} KB
                    </TableCell>
                    <TableCell>
                      {formatDate(file.uploadedAt, org?.locale)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small">
                        <Download style={{ width: 16, height: 16 }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </StyledCard>

      {/* Adjustments History */}
      {contract.adjustments.length > 0 && (
        <StyledCard sx={{ mb: 4 }}>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, color: "#1d2b48" }}
            >
              {t("contracts.adjustments")}
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Valor Anterior</TableCell>
                  <TableCell>Novo Valor</TableCell>
                  <TableCell>Percentual</TableCell>
                  <TableCell>Motivo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contract.adjustments.map((adj: any) => (
                  <TableRow key={adj.id}>
                    <TableCell>
                      {formatDate(adj.adjustmentDate, org?.locale)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        Number(adj.oldValue),
                        contract.currency as any,
                        org?.locale
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        Number(adj.newValue),
                        contract.currency as any,
                        org?.locale
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${Number(adj.percentage)}%`}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{adj.reason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </StyledCard>
      )}

      {/* Renewal History */}
      {contract.renewalHistory.length > 0 && (
        <StyledCard>
          <CardContent>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, mb: 2, color: "#1d2b48" }}
            >
              {t("contracts.history")}
            </Typography>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data de Renovação</TableCell>
                  <TableCell>Término Anterior</TableCell>
                  <TableCell>Novo Término</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contract.renewalHistory.map((renewal: any) => (
                  <TableRow key={renewal.id}>
                    <TableCell>
                      {formatDate(renewal.renewalDate, org?.locale)}
                    </TableCell>
                    <TableCell>
                      {formatDate(renewal.previousEndDate, org?.locale)}
                    </TableCell>
                    <TableCell>
                      {formatDate(renewal.newEndDate, org?.locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </StyledCard>
      )}

      {/* Error Toast */}
      <Snackbar
        open={!!errorToast}
        autoHideDuration={6000}
        onClose={() => setErrorToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setErrorToast(null)}
          severity="error"
          sx={{
            width: "100%",
            bgcolor: "#ef4444",
            color: "white",
            fontSize: "1rem",
            "& .MuiAlert-icon": {
              color: "white",
            },
          }}
        >
          {errorToast}
        </Alert>
      </Snackbar>
    </div>
  );
}
