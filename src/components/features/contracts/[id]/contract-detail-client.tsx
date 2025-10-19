"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  renewContract,
  deleteContract,
  uploadFile,
  downloadFile,
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
  CircularProgress,
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
  const [isUploading, setIsUploading] = useState(false);
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(
    null
  );
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [files, setFiles] = useState(initialFiles);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const contract = initialContract;
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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setErrorToast("Arquivo muito grande. Tamanho máximo: 10MB");
      return;
    }

    setIsUploading(true);
    setErrorToast(null);
    setSuccessToast(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("contractId", contractId);
      formData.append("fileType", "ATTACHMENT");

      const result = await uploadFile(formData);

      if (result.success && result.file) {
        // Add the new file to the state immediately
        const newFile = {
          id: result.file.id,
          fileName: result.file.fileName,
          fileType: result.file.fileType,
          sizeBytes: result.file.sizeBytes,
          uploadedAt: new Date(result.file.uploadedAt),
          checksum: result.file.checksum,
        };
        setFiles((prevFiles) => [newFile, ...prevFiles]);

        setSuccessToast("Arquivo enviado com sucesso!");

        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);

      // Extract error message
      let errorMessage = "Erro ao fazer upload do arquivo. Tente novamente.";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      setErrorToast(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    setDownloadingFileId(fileId);

    try {
      const fileData = await downloadFile(fileId);

      // Convert base64 to blob
      const byteCharacters = atob(fileData.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileData.mimeType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessToast("Download concluído!");
    } catch (error: any) {
      console.error("Erro ao fazer download:", error);
      setErrorToast(error.message || "Erro ao fazer download do arquivo.");
    } finally {
      setDownloadingFileId(null);
    }
  };

  return (
    <Box
      sx={{
        bgcolor: "#f9fafb",
        minHeight: "100vh",
        p: { xs: 2, sm: 3, md: 4 },
      }}
    >
      {/* Back Button */}
      <Box sx={{ mb: 3 }}>
        <Link
          href="/contracts"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#6b7280",
            textDecoration: "none",
            fontSize: "0.875rem",
            fontWeight: 500,
            transition: "color 0.2s",
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16 }} />
          Voltar
        </Link>
      </Box>

      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        {/* Title and Badges */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1 }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: "#111827",
              fontSize: { xs: "1.5rem", sm: "2rem" },
            }}
          >
            {contract.title}
          </Typography>
          <Chip
            label={t(
              `status.${getStatusTranslationKey(contract.status)}` as any
            )}
            size="small"
            sx={{
              bgcolor:
                contract.status === "ACTIVE"
                  ? "#fef3c7"
                  : contract.status === "DUE_SOON"
                  ? "#fef3c7"
                  : contract.status === "EXPIRED"
                  ? "#fee2e2"
                  : "#f3f4f6",
              color:
                contract.status === "ACTIVE"
                  ? "#92400e"
                  : contract.status === "DUE_SOON"
                  ? "#92400e"
                  : contract.status === "EXPIRED"
                  ? "#991b1b"
                  : "#374151",
              fontWeight: 500,
              border: "none",
              fontSize: "0.75rem",
            }}
          />
          <Chip
            label={
              contract.contractType === "INBOUND"
                ? "Contratando Serviço"
                : "Prestando Serviço"
            }
            size="small"
            sx={{
              bgcolor: "#f3f4f6",
              color: "#374151",
              fontWeight: 500,
              border: "none",
              fontSize: "0.75rem",
            }}
          />
        </Box>

        {/* Subtitle */}
        <Typography variant="body1" sx={{ color: "#6b7280", mb: 3 }}>
          {contract.counterpartyName}
        </Typography>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            onClick={handleRenew}
            disabled={isRenewing}
            startIcon={<RefreshCw style={{ width: 18, height: 18 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              color: "#1f2937",
              borderColor: "#d1d5db",
              px: 2.5,
              py: 1,
              "&:hover": {
                borderColor: "#9ca3af",
                bgcolor: "#f9fafb",
              },
            }}
          >
            Renovar
          </Button>
          <Link href={`/contracts/${contractId}/edit`}>
            <Button
              variant="outlined"
              startIcon={<Edit style={{ width: 18, height: 18 }} />}
              sx={{
                textTransform: "none",
                fontWeight: 500,
                color: "#1f2937",
                borderColor: "#d1d5db",
                px: 2.5,
                py: 1,
                "&:hover": {
                  borderColor: "#9ca3af",
                  bgcolor: "#f9fafb",
                },
              }}
            >
              Editar Contrato
            </Button>
          </Link>
          <Button
            variant="outlined"
            onClick={handleDelete}
            disabled={isDeleting}
            startIcon={<Trash2 style={{ width: 18, height: 18 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 500,
              color: "#ef4444",
              borderColor: "#ef4444",
              bgcolor: "#ffffff",
              px: 2.5,
              py: 1,
              "&:hover": {
                bgcolor: "#fef2f2",
                borderColor: "#dc2626",
                color: "#dc2626",
              },
              "&:disabled": {
                borderColor: "#d1d5db",
                color: "#9ca3af",
                bgcolor: "#ffffff",
              },
            }}
          >
            Excluir Contrato
          </Button>
        </Box>
      </Box>

      {/* Info Cards Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 3,
          mb: 3,
        }}
      >
        {/* Contract Details */}
        <StyledCard>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 3,
                color: "#111827",
                fontSize: "1.125rem",
              }}
            >
              Detalhes do Contrato
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Responsável:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: "#111827", textAlign: "right" }}
                >
                  {contract.owner.name}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Valor:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: "#111827", textAlign: "right" }}
                >
                  {formatCurrency(
                    Number(contract.valueAmount),
                    contract.currency as any,
                    org?.locale
                  )}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Data de Início:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: "#111827", textAlign: "right" }}
                >
                  {formatDate(contract.startDate, org?.locale)}
                </Typography>
              </Box>
              {contract.endDate && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Data de Término:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "#111827",
                      textAlign: "right",
                    }}
                  >
                    {formatDate(contract.endDate, org?.locale)}
                  </Typography>
                </Box>
              )}
              {contract.nextRenewalDate && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Próxima Renovação:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "#111827",
                      textAlign: "right",
                    }}
                  >
                    {formatDate(contract.nextRenewalDate, org?.locale)}
                  </Typography>
                </Box>
              )}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Periodicidade:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: "#111827", textAlign: "right" }}
                >
                  {t(
                    `periodicity.${contract.periodicity.toLowerCase()}` as any
                  )}
                </Typography>
              </Box>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Renovação Automática:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: "#111827", textAlign: "right" }}
                >
                  {contract.autoRenew ? "Sim" : "Não"}
                </Typography>
              </Box>
              {contract.costCenter && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Centro de Custo:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "#111827",
                      textAlign: "right",
                    }}
                  >
                    {contract.costCenter}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </StyledCard>

        {/* Supplier Info */}
        <StyledCard>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 3,
                color: "#111827",
                fontSize: "1.125rem",
              }}
            >
              Informações da Contraparte
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Nome:
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 500, color: "#111827", textAlign: "right" }}
                >
                  {contract.counterpartyName}
                </Typography>
              </Box>
              {contract.counterpartyContact && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Contato:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      color: "#111827",
                      textAlign: "right",
                    }}
                  >
                    {contract.counterpartyContact}
                  </Typography>
                </Box>
              )}
              {contract.notes && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
                    Observações:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "#111827",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                    }}
                  >
                    {contract.notes}
                  </Typography>
                </Box>
              )}
            </Box>
          </CardContent>
        </StyledCard>
      </Box>

      {/* Files */}
      <StyledCard sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: "#111827", fontSize: "1.125rem" }}
            >
              Arquivos
            </Typography>
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                style={{ display: "none" }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png"
              />
              <Button
                variant="outlined"
                onClick={handleUploadClick}
                disabled={isUploading}
                startIcon={
                  isUploading ? (
                    <CircularProgress size={18} />
                  ) : (
                    <Upload style={{ width: 18, height: 18 }} />
                  )
                }
                sx={{
                  textTransform: "none",
                  fontWeight: 500,
                  color: "#1f2937",
                  borderColor: "#d1d5db",
                  px: 2,
                  py: 0.75,
                  "&:hover": {
                    borderColor: "#9ca3af",
                    bgcolor: "#f9fafb",
                  },
                  "&:disabled": {
                    borderColor: "#e5e7eb",
                    color: "#9ca3af",
                  },
                }}
              >
                {isUploading ? "Enviando..." : "Upload Arquivo"}
              </Button>
            </Box>
          </Box>
          {files.length === 0 ? (
            <Box
              sx={{
                textAlign: "center",
                py: 6,
                color: "#9ca3af",
              }}
            >
              <FileText
                style={{
                  width: 48,
                  height: 48,
                  margin: "0 auto 12px",
                  opacity: 0.5,
                }}
              />
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                Nenhum arquivo anexado
              </Typography>
            </Box>
          ) : (
            <Table sx={{ "& .MuiTableCell-root": { borderColor: "#f3f4f6" } }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Nome do Arquivo
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Tipo
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Tamanho
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Upload em
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {files.map((file) => (
                  <TableRow
                    key={file.id}
                    sx={{ "&:hover": { bgcolor: "#f9fafb" } }}
                  >
                    <TableCell sx={{ fontWeight: 500, color: "#111827" }}>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1.5 }}
                      >
                        <FileText
                          style={{ width: 18, height: 18, color: "#6b7280" }}
                        />
                        {file.fileName}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={file.fileType}
                        size="small"
                        sx={{
                          bgcolor: "#f3f4f6",
                          color: "#374151",
                          fontWeight: 500,
                          border: "none",
                          fontSize: "0.75rem",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280" }}>
                      {(file.sizeBytes / 1024).toFixed(0)} KB
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280" }}>
                      {formatDate(file.uploadedAt, org?.locale)}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        onClick={() => handleDownload(file.id, file.fileName)}
                        disabled={downloadingFileId === file.id}
                        sx={{
                          color: "#6b7280",
                          "&:hover": { bgcolor: "#f3f4f6" },
                          "&:disabled": {
                            color: "#9ca3af",
                          },
                        }}
                      >
                        {downloadingFileId === file.id ? (
                          <CircularProgress
                            size={18}
                            sx={{ color: "#6b7280" }}
                          />
                        ) : (
                          <Download style={{ width: 18, height: 18 }} />
                        )}
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
        <StyledCard sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 3,
                color: "#111827",
                fontSize: "1.125rem",
              }}
            >
              Histórico de Reajustes
            </Typography>
            <Table sx={{ "& .MuiTableCell-root": { borderColor: "#f3f4f6" } }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Data
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Valor Anterior
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Novo Valor
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Percentual
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Motivo
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contract.adjustments.map((adj: any) => (
                  <TableRow
                    key={adj.id}
                    sx={{ "&:hover": { bgcolor: "#f9fafb" } }}
                  >
                    <TableCell sx={{ color: "#6b7280" }}>
                      {formatDate(adj.adjustmentDate, org?.locale)}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#111827" }}>
                      {formatCurrency(
                        Number(adj.oldValue),
                        contract.currency as any,
                        org?.locale
                      )}
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#111827" }}>
                      {formatCurrency(
                        Number(adj.newValue),
                        contract.currency as any,
                        org?.locale
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${Number(adj.percentage)}%`}
                        size="small"
                        sx={{
                          bgcolor: "#fef3c7",
                          color: "#92400e",
                          fontWeight: 500,
                          border: "none",
                          fontSize: "0.75rem",
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280" }}>
                      {adj.reason || "-"}
                    </TableCell>
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
          <CardContent sx={{ p: 3 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                mb: 3,
                color: "#111827",
                fontSize: "1.125rem",
              }}
            >
              Histórico de Renovações
            </Typography>
            <Table sx={{ "& .MuiTableCell-root": { borderColor: "#f3f4f6" } }}>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Data de Renovação
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Término Anterior
                  </TableCell>
                  <TableCell
                    sx={{
                      fontWeight: 600,
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      bgcolor: "#f9fafb",
                    }}
                  >
                    Novo Término
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {contract.renewalHistory.map((renewal: any) => (
                  <TableRow
                    key={renewal.id}
                    sx={{ "&:hover": { bgcolor: "#f9fafb" } }}
                  >
                    <TableCell sx={{ fontWeight: 500, color: "#111827" }}>
                      {formatDate(renewal.renewalDate, org?.locale)}
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280" }}>
                      {formatDate(renewal.previousEndDate, org?.locale)}
                    </TableCell>
                    <TableCell sx={{ color: "#6b7280" }}>
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

      {/* Success Toast */}
      <Snackbar
        open={!!successToast}
        autoHideDuration={4000}
        onClose={() => setSuccessToast(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessToast(null)}
          severity="success"
          sx={{
            width: "100%",
            bgcolor: "#10b981",
            color: "white",
            fontSize: "1rem",
            "& .MuiAlert-icon": {
              color: "white",
            },
          }}
        >
          {successToast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
