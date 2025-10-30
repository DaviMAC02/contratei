"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { updateContract } from "@/app/(dashboard)/contracts/[id]/edit/actions";
import {
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "@/lib/use-translation";
import {
  ArrowLeft,
  FileText,
  Calendar,
  DollarSign,
  Tag,
  Check,
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

// Section Header Component
const SectionHeader = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: any;
  title: string;
  subtitle?: string;
}) => (
  <Box sx={{ mb: 2.5, display: "flex", alignItems: "center", gap: 2 }}>
    <Box
      sx={{
        width: 44,
        height: 44,
        borderRadius: 1.5,
        bgcolor: "#e8f4f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Icon className="h-5 w-5" style={{ color: "#1d2b48" }} />
    </Box>
    <Box>
      <Typography
        variant="h6"
        sx={{ fontWeight: 600, color: "#111827", fontSize: "1rem" }}
      >
        {title}
      </Typography>
      {subtitle && (
        <Typography
          variant="body2"
          sx={{ color: "#6b7280", fontSize: "0.875rem" }}
        >
          {subtitle}
        </Typography>
      )}
    </Box>
  </Box>
);

interface EditContractClientProps {
  initialContract: any;
  initialMembers: any;
  initialOrgs: any[];
  initialOrgId: string;
}

export default function EditContractClient({
  initialContract,
  initialMembers,
  initialOrgs,
  initialOrgId,
}: EditContractClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorToast, setErrorToast] = useState<string | null>(null);

  const contract = initialContract;
  const members = Array.isArray(initialMembers)
    ? initialMembers
    : initialMembers?.members || [];
  const contractId = contract.id;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    try {
      await updateContract({
        contractId,
        title: formData.get("title") as string,
        contractType: formData.get("contractType") as string,
        counterpartyName: formData.get("counterpartyName") as string,
        counterpartyContact:
          (formData.get("counterpartyContact") as string) || undefined,
        ownerUserId: formData.get("ownerUserId") as string,
        endDate: (formData.get("endDate") as string) || undefined,
        autoRenew: formData.get("autoRenew") === "on",
        adjustmentType: formData.get("adjustmentType") as string,
        adjustmentValue: formData.get("adjustmentValue")
          ? Number(formData.get("adjustmentValue"))
          : undefined,
        costCenter: (formData.get("costCenter") as string) || undefined,
        tags: (formData.get("tags") as string) || undefined,
        notes: (formData.get("notes") as string) || undefined,
        nextRenewalDate: (formData.get("nextRenewalDate") as string) || undefined,
        periodicityDays: formData.get("periodicityDays")
          ? Number(formData.get("periodicityDays"))
          : undefined,
      });

      router.push(`/contracts/${contractId}`);
      router.refresh();
    } catch (error) {
      console.error("Error updating contract:", error);
      setErrorToast("Erro ao atualizar contrato. Por favor, tente novamente.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header with back link */}
      <Box className="mb-6">
        <Link
          href={`/contracts/${contractId}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
      </Box>

      {/* Page Header */}
      <Box className="mb-8">
        <Typography variant="h4" className="font-semibold text-gray-900 mb-1">
          Editar Contrato
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          Atualize as informações de <strong>{contract.title}</strong>
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Basic Information Card */}
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={FileText}
                title="Informações Básicas"
                subtitle="Dados essenciais do contrato"
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  id="title"
                  name="title"
                  label="Título do Contrato"
                  required
                  fullWidth
                  defaultValue={contract.title}
                  size="small"
                />

                <FormControl fullWidth size="small" required>
                  <InputLabel id="contractType-label">
                    Tipo de Contrato
                  </InputLabel>
                  <Select
                    labelId="contractType-label"
                    id="contractType"
                    name="contractType"
                    label="Tipo de Contrato"
                    defaultValue={contract.contractType}
                  >
                    <MenuItem value="OUTBOUND">
                      Contratando Serviço - Cliente
                    </MenuItem>
                    <MenuItem value="INBOUND">
                      Prestando Serviço - Fornecedor
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  id="counterpartyName"
                  name="counterpartyName"
                  label="Contraparte"
                  required
                  fullWidth
                  size="small"
                  defaultValue={contract.counterpartyName}
                />

                <TextField
                  id="counterpartyContact"
                  name="counterpartyContact"
                  label="Contato"
                  fullWidth
                  size="small"
                  defaultValue={contract.counterpartyContact || ""}
                />

                <FormControl fullWidth size="small" required>
                  <InputLabel id="ownerUserId-label">Responsável</InputLabel>
                  <Select
                    labelId="ownerUserId-label"
                    id="ownerUserId"
                    name="ownerUserId"
                    label="Responsável"
                    defaultValue={contract.ownerUserId}
                  >
                    {members.map((member: any) => (
                      <MenuItem key={member.userId} value={member.userId}>
                        {member.user.name || member.user.email}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </CardContent>
          </StyledCard>

          {/* Dates and Renewal Card */}
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={Calendar}
                title="Datas e Renovação"
                subtitle="Gerencie prazos e renovações"
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  id="endDate"
                  name="endDate"
                  label="Data de Término"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  defaultValue={
                    contract.endDate
                      ? new Date(contract.endDate).toISOString().split("T")[0]
                      : ""
                  }
                />

                <TextField
                  id="nextRenewalDate"
                  name="nextRenewalDate"
                  label="Próxima Renovação"
                  type="date"
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  defaultValue={
                    contract.nextRenewalDate
                      ? new Date(contract.nextRenewalDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  helperText="Se vazio, será calculada automaticamente"
                />

                <TextField
                  id="periodicityDays"
                  name="periodicityDays"
                  label="Periodicidade (dias)"
                  type="number"
                  inputProps={{ min: 1 }}
                  fullWidth
                  size="small"
                  defaultValue={contract.periodicityDays || ""}
                  helperText="Intervalo utilizado para renovação automática"
                />

                <Box
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        id="autoRenew"
                        name="autoRenew"
                        defaultChecked={contract.autoRenew}
                        sx={{
                          "& .MuiSwitch-switchBase.Mui-checked": {
                            color: "#1d2b48",
                          },
                          "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
                            {
                              backgroundColor: "#1d2b48",
                            },
                        }}
                      />
                    }
                    label={
                      <Box>
                        <Typography
                          sx={{
                            fontWeight: 500,
                            color: "#111827",
                            fontSize: "0.875rem",
                          }}
                        >
                          Renovação Automática
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#6b7280" }}>
                          Renovar automaticamente no vencimento
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              </Box>
            </CardContent>
          </StyledCard>

          {/* Financial Information Card */}
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={DollarSign}
                title="Informações Financeiras"
                subtitle="Valores e reajustes"
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  id="valueAmount"
                  name="valueAmount"
                  label="Valor"
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  required
                  fullWidth
                  size="small"
                  defaultValue={Number(contract.valueAmount)}
                />

                <FormControl fullWidth size="small">
                  <InputLabel id="adjustmentType-label">
                    Tipo de Reajuste
                  </InputLabel>
                  <Select
                    labelId="adjustmentType-label"
                    id="adjustmentType"
                    name="adjustmentType"
                    label="Tipo de Reajuste"
                    defaultValue={contract.adjustmentType}
                  >
                    <MenuItem value="NONE">Nenhum</MenuItem>
                    <MenuItem value="FIXED_PERCENT">Percentual Fixo</MenuItem>
                    <MenuItem value="INDEX_IPCA">IPCA</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  id="adjustmentValue"
                  name="adjustmentValue"
                  label="Valor do Reajuste (%)"
                  type="number"
                  inputProps={{ step: "0.01", min: "0" }}
                  fullWidth
                  size="small"
                  defaultValue={
                    contract.adjustmentValue
                      ? Number(contract.adjustmentValue)
                      : ""
                  }
                />

                <TextField
                  id="costCenter"
                  name="costCenter"
                  label="Centro de Custo"
                  fullWidth
                  size="small"
                  defaultValue={contract.costCenter || ""}
                />
              </Box>
            </CardContent>
          </StyledCard>

          {/* Additional Information Card */}
          <StyledCard>
            <CardContent sx={{ p: 3 }}>
              <SectionHeader
                icon={Tag}
                title="Informações Adicionais"
                subtitle="Tags e observações"
              />
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <TextField
                  id="tags"
                  name="tags"
                  label="Tags (separadas por vírgula)"
                  fullWidth
                  size="small"
                  defaultValue={contract.tags.join(", ")}
                  helperText="Ex: urgente, fiscal, TI"
                />

                <TextField
                  id="notes"
                  name="notes"
                  label="Observações"
                  multiline
                  rows={4}
                  fullWidth
                  size="small"
                  defaultValue={contract.notes || ""}
                />
              </Box>
            </CardContent>
          </StyledCard>
        </div>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
          <Button
            component={Link}
            href={`/contracts/${contractId}`}
            variant="outlined"
            size="medium"
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
            {t("form.cancel")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="medium"
            disabled={isSubmitting}
            startIcon={
              isSubmitting ? (
                <CircularProgress size={16} sx={{ color: "white" }} />
              ) : (
                <Check className="h-4 w-4" />
              )
            }
            sx={{
              textTransform: "none",
              fontWeight: 500,
              bgcolor: "#1d2b48",
              px: 3,
              "&:hover": {
                bgcolor: "#141f35",
              },
              "&:disabled": {
                bgcolor: "#9ca3af",
              },
            }}
          >
            {isSubmitting ? "Salvando..." : t("form.save")}
          </Button>
        </Box>
      </form>

      {/* Error Chip */}
      {errorToast && (
        <Box sx={{ position: "fixed", top: 16, right: 16 }}>
          <Chip
            label={errorToast}
            color="error"
            onDelete={() => setErrorToast(null)}
            sx={{ fontWeight: 600 }}
          />
        </Box>
      )}
    </div>
  );
}
