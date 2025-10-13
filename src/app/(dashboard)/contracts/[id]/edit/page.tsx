"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import {
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  IconButton,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useTranslation } from "@/lib/use-translation";
import { ArrowLeft } from "lucide-react";
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

export default function EditContractPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [orgId, setOrgId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contractId = params.id as string;

  const orgsQuery = trpc.org.list.useQuery();
  const contractQuery = trpc.contract.get.useQuery(
    { orgId, id: contractId },
    { enabled: !!orgId && !!contractId }
  );
  const membersQuery = trpc.org.listMembers.useQuery(
    { orgId },
    { enabled: !!orgId }
  );

  useEffect(() => {
    // First try to get orgId from URL
    const orgIdFromUrl = searchParams.get("orgId");
    if (orgIdFromUrl) {
      setOrgId(orgIdFromUrl);
    } else if (orgsQuery.data && orgsQuery.data.length > 0) {
      // Fallback to first org if no orgId in URL
      setOrgId(orgsQuery.data[0].id);
    }
  }, [searchParams, orgsQuery.data]);

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
        contractType:
          (formData.get("contractType") as "INBOUND" | "OUTBOUND") || undefined,
        counterpartyName: formData.get("counterpartyName") as string,
        counterpartyContact:
          (formData.get("counterpartyContact") as string) || undefined,
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
  const members = Array.isArray(membersQuery.data)
    ? membersQuery.data
    : membersQuery.data?.members || [];

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link href={`/contracts/${contractId}`}>
          <IconButton
            size="small"
            sx={{
              color: "#1d2b48",
              gap: 1,
              fontSize: "0.875rem",
              fontWeight: 500,
              textTransform: "none",
            }}
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
            Voltar
          </IconButton>
        </Link>
      </div>

      <StyledCard sx={{ maxWidth: 768 }}>
        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h5"
            sx={{ fontWeight: 600, mb: 3, color: "#1d2b48" }}
          >
            {t("contracts.edit")}
          </Typography>
          <form onSubmit={handleSubmit}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Basic Info */}
              <TextField
                id="title"
                name="title"
                label="Título do Contrato *"
                required
                fullWidth
                defaultValue={contract.title}
                size="small"
              />

              <FormControl fullWidth size="small" required>
                <InputLabel id="contractType-label">
                  Tipo de Contrato *
                </InputLabel>
                <Select
                  labelId="contractType-label"
                  id="contractType"
                  name="contractType"
                  label="Tipo de Contrato *"
                  defaultValue={contract.contractType}
                >
                  <MenuItem value="OUTBOUND">
                    📤 Contratando Serviço - Cliente (pagando)
                  </MenuItem>
                  <MenuItem value="INBOUND">
                    📥 Prestando Serviço - Fornecedor (recebendo)
                  </MenuItem>
                </Select>
              </FormControl>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                }}
              >
                <TextField
                  id="counterpartyName"
                  name="counterpartyName"
                  label="Contraparte *"
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
              </Box>

              <FormControl fullWidth size="small" required>
                <InputLabel id="ownerUserId-label">Responsável *</InputLabel>
                <Select
                  labelId="ownerUserId-label"
                  id="ownerUserId"
                  name="ownerUserId"
                  label="Responsável *"
                  defaultValue={contract.ownerUserId}
                >
                  {members.map((member: any) => (
                    <MenuItem key={member.userId} value={member.userId}>
                      {member.user.name || member.user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              {/* Dates */}
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, color: "#1d2b48" }}
              >
                Datas e Renovação
              </Typography>

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

              <FormControlLabel
                control={
                  <Switch
                    id="autoRenew"
                    name="autoRenew"
                    defaultChecked={contract.autoRenew}
                  />
                }
                label="Renovação Automática"
              />

              <Divider sx={{ my: 2 }} />

              {/* Financial */}
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, color: "#1d2b48" }}
              >
                Informações Financeiras
              </Typography>

              <TextField
                id="valueAmount"
                name="valueAmount"
                label="Valor *"
                type="number"
                inputProps={{ step: "0.01", min: "0" }}
                required
                fullWidth
                size="small"
                defaultValue={Number(contract.valueAmount)}
              />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 2,
                }}
              >
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
              </Box>

              <TextField
                id="costCenter"
                name="costCenter"
                label="Centro de Custo"
                fullWidth
                size="small"
                defaultValue={contract.costCenter || ""}
              />

              <Divider sx={{ my: 2 }} />

              {/* Additional */}
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, mb: 2, color: "#1d2b48" }}
              >
                Informações Adicionais
              </Typography>

              <TextField
                id="tags"
                name="tags"
                label="Tags (separadas por vírgula)"
                fullWidth
                size="small"
                defaultValue={contract.tags.join(", ")}
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

              {/* Actions */}
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "flex-end",
                  mt: 3,
                }}
              >
                <Link href={`/contracts/${contractId}`}>
                  <Button
                    type="button"
                    variant="outlined"
                    size="small"
                    sx={{
                      textTransform: "none",
                      fontWeight: 500,
                      color: "#1d2b48",
                      borderColor: "#e5e7eb",
                    }}
                  >
                    {t("form.cancel")}
                  </Button>
                </Link>
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  disabled={isSubmitting}
                  sx={{
                    textTransform: "none",
                    fontWeight: 500,
                    bgcolor: "#1d2b48",
                    "&:hover": {
                      bgcolor: "#141f35",
                    },
                  }}
                >
                  {isSubmitting ? "Salvando..." : t("form.save")}
                </Button>
              </Box>
            </Box>
          </form>
        </CardContent>
      </StyledCard>
    </div>
  );
}
