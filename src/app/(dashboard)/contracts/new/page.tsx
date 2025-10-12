"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { useTranslation } from "@/lib/use-translation";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { trackContractCreated } from "@/components/providers/posthog-provider";
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Typography,
  StepConnector,
  stepConnectorClasses,
  TextField,
  Button,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormHelperText,
  CardHeader,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { Dayjs } from "dayjs";
import "dayjs/locale/pt-br";

dayjs.locale("pt-br");

const steps = [
  "Informações Básicas",
  "Datas e Renovação",
  "Valores e Reajustes",
  "Detalhes Adicionais",
];

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 16,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: "#1d2b48",
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundColor: "#1d2b48",
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 2,
    border: 0,
    backgroundColor: "#e0e0e0",
    borderRadius: 1,
  },
}));

export default function NewContractPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const [orgId, setOrgId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<any>({
    contractType: "OUTBOUND",
    periodicity: "MONTHLY",
    autoRenew: false,
    adjustmentType: "NONE",
  });

  // Ref para controlar se o submit foi explicitamente solicitado
  const canSubmitRef = useRef(false);

  const orgsQuery = trpc.org.list.useQuery();
  const orgQuery = trpc.org.get.useQuery({ orgId }, { enabled: !!orgId });
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

  const createMutation = trpc.contract.create.useMutation({
    onSuccess: () => {
      router.push(`/contracts`);
    },
    onError: (error) => {
      console.error("Error creating contract:", error);
      setIsSubmitting(false);
    },
  });

  const handleNext = () => {
    setIsSubmitting(false); // Garante que isSubmitting está false ao mudar de step
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setIsSubmitting(false); // Garante que isSubmitting está false ao voltar
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleStepData = (stepData: any) => {
    setFormData({ ...formData, ...stepData });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Só permite submit se foi explicitamente solicitado
    if (!canSubmitRef.current) {
      return;
    }

    // Reset da flag
    canSubmitRef.current = false;

    // Só permite submit se estiver no último step
    if (activeStep !== steps.length - 1) {
      return;
    }

    // Previne múltiplos submits
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const contractData = {
      orgId,
      ...formData,
      startDate: new Date(formData.startDate),
      endDate: formData.endDate ? new Date(formData.endDate) : undefined,
      valueAmount: Number(formData.valueAmount),
      customDays: formData.customDays ? Number(formData.customDays) : undefined,
      adjustmentValue: formData.adjustmentValue
        ? Number(formData.adjustmentValue)
        : undefined,
      tags:
        formData.tags
          ?.split(",")
          .map((t: string) => t.trim())
          .filter(Boolean) || [],
    };

    try {
      await createMutation.mutateAsync(contractData);

      // Track contract creation
      if (orgQuery.data) {
        trackContractCreated(
          contractData.valueAmount,
          contractData.autoRenew,
          contractData.adjustmentType !== "NONE",
          orgQuery.data.plan
        );
      }
    } catch (error) {
      console.error("Error creating contract:", error);
      setIsSubmitting(false);
    }
  };

  if (!orgId) {
    return <div className="p-8">Loading...</div>;
  }

  const members = membersQuery.data || [];

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Título do Contrato"
              value={formData.title || ""}
              onChange={(e) => handleStepData({ title: e.target.value })}
              required
              fullWidth
              placeholder="Ex: Contrato de Marketing Digital"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
            />

            <FormControl fullWidth required>
              <InputLabel>Tipo de Contrato</InputLabel>
              <Select
                value={formData.contractType || "OUTBOUND"}
                onChange={(e) =>
                  handleStepData({ contractType: e.target.value })
                }
                label="Tipo de Contrato"
                sx={{ borderRadius: "8px" }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      mt: 1,
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      borderRadius: "8px",
                    },
                  },
                }}
              >
                <MenuItem value="OUTBOUND">
                  Contratando Serviço - Eu sou o cliente (pagando)
                </MenuItem>
                <MenuItem value="INBOUND">
                  Prestando Serviço - Eu sou o fornecedor (recebendo)
                </MenuItem>
              </Select>
              <FormHelperText>
                Escolha "Contratando" se você está pagando pelo serviço ou
                "Prestando" se você está recebendo
              </FormHelperText>
            </FormControl>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Box>
                <TextField
                  label="Contraparte"
                  value={formData.counterpartyName || ""}
                  onChange={(e) =>
                    handleStepData({ counterpartyName: e.target.value })
                  }
                  required
                  fullWidth
                  placeholder="Nome da empresa"
                  helperText="Fornecedor (se saída) ou Cliente (se entrada)"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                    },
                  }}
                />
              </Box>
              <Box>
                <TextField
                  label="Contato"
                  value={formData.counterpartyContact || ""}
                  onChange={(e) =>
                    handleStepData({ counterpartyContact: e.target.value })
                  }
                  fullWidth
                  placeholder="Email ou telefone"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                    },
                  }}
                />
              </Box>
            </Box>

            <FormControl fullWidth required>
              <InputLabel>Responsável</InputLabel>
              <Select
                value={formData.ownerUserId || ""}
                onChange={(e) =>
                  handleStepData({ ownerUserId: e.target.value })
                }
                label="Responsável"
                sx={{ borderRadius: "8px" }}
                MenuProps={{
                  PaperProps: {
                    sx: {
                      maxHeight: 300,
                      mt: 1,
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      borderRadius: "8px",
                    },
                  },
                }}
              >
                <MenuItem value="">Selecione...</MenuItem>
                {members.map((member) => (
                  <MenuItem key={member.userId} value={member.userId}>
                    {member.user.name || member.user.email}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <LocalizationProvider
            dateAdapter={AdapterDayjs}
            adapterLocale="pt-br"
          >
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Data de Início *
                  </Typography>
                  <DatePicker
                    value={
                      formData.startDate ? dayjs(formData.startDate) : null
                    }
                    onChange={(newValue: Dayjs | null) => {
                      handleStepData({
                        startDate: newValue
                          ? newValue.format("YYYY-MM-DD")
                          : "",
                      });
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true,
                        size: "small",
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            "& fieldset": {
                              borderColor: "#e5e7eb",
                            },
                            "&:hover fieldset": {
                              borderColor: "#1d2b48",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#1d2b48",
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                    Data de Término
                  </Typography>
                  <DatePicker
                    value={formData.endDate ? dayjs(formData.endDate) : null}
                    onChange={(newValue: Dayjs | null) => {
                      handleStepData({
                        endDate: newValue ? newValue.format("YYYY-MM-DD") : "",
                      });
                    }}
                    minDate={
                      formData.startDate ? dayjs(formData.startDate) : undefined
                    }
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        size: "small",
                        sx: {
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "8px",
                            "& fieldset": {
                              borderColor: "#e5e7eb",
                            },
                            "&:hover fieldset": {
                              borderColor: "#1d2b48",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: "#1d2b48",
                            },
                          },
                        },
                      },
                    }}
                  />
                </Box>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                  gap: 2,
                }}
              >
                <FormControl fullWidth required>
                  <InputLabel>Periodicidade</InputLabel>
                  <Select
                    value={formData.periodicity || "MONTHLY"}
                    onChange={(e) =>
                      handleStepData({ periodicity: e.target.value })
                    }
                    label="Periodicidade"
                    sx={{ borderRadius: "8px" }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          mt: 1,
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          borderRadius: "8px",
                        },
                      },
                    }}
                  >
                    <MenuItem value="MONTHLY">Mensal</MenuItem>
                    <MenuItem value="YEARLY">Anual</MenuItem>
                    <MenuItem value="CUSTOM_DAYS">Dias Personalizados</MenuItem>
                  </Select>
                </FormControl>
                <TextField
                  label="Dias (se personalizado)"
                  type="number"
                  inputProps={{ min: 1 }}
                  value={formData.customDays || ""}
                  onChange={(e) =>
                    handleStepData({ customDays: e.target.value })
                  }
                  fullWidth
                  placeholder="30"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                    },
                  }}
                />
              </Box>

              <FormControl fullWidth>
                <InputLabel>Renovação Automática</InputLabel>
                <Select
                  value={formData.autoRenew?.toString() || "false"}
                  onChange={(e) =>
                    handleStepData({ autoRenew: e.target.value === "true" })
                  }
                  label="Renovação Automática"
                  sx={{ borderRadius: "8px" }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        maxHeight: 300,
                        mt: 1,
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        borderRadius: "8px",
                      },
                    },
                  }}
                >
                  <MenuItem value="true">Sim</MenuItem>
                  <MenuItem value="false">Não</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </LocalizationProvider>
        );

      case 2:
        // Função para formatar centavos em reais (display)
        const formatCentsToDisplay = (
          cents: number | string | undefined
        ): string => {
          if (!cents && cents !== 0) return "";
          const numericCents =
            typeof cents === "string" ? parseInt(cents, 10) : cents;
          if (isNaN(numericCents)) return "";
          const reais = numericCents / 100;
          return reais.toFixed(2).replace(".", ",");
        };

        // Função para lidar com input e converter para centavos
        const handleValueInput = (input: string) => {
          // Remove tudo que não é dígito
          const digits = input.replace(/\D/g, "");

          if (digits === "") {
            handleStepData({ valueAmount: undefined });
            return;
          }

          // Converte para centavos (o valor digitado já é em centavos)
          const cents = parseInt(digits, 10);
          handleStepData({ valueAmount: cents });
        };

        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Valor (R$)"
              value={formatCentsToDisplay(formData.valueAmount)}
              onChange={(e) => handleValueInput(e.target.value)}
              required
              fullWidth
              placeholder="0,00"
              helperText="Digite o valor em reais"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 2,
              }}
            >
              <Box>
                <FormControl fullWidth>
                  <InputLabel>Reajuste Automático</InputLabel>
                  <Select
                    value={formData.adjustmentType || "NONE"}
                    onChange={(e) =>
                      handleStepData({ adjustmentType: e.target.value })
                    }
                    label="Reajuste Automático"
                    sx={{ borderRadius: "8px" }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          maxHeight: 300,
                          mt: 1,
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          borderRadius: "8px",
                        },
                      },
                    }}
                  >
                    <MenuItem value="NONE">Desativado</MenuItem>
                    <MenuItem value="FIXED_PERCENT">Ativado (Anual)</MenuItem>
                  </Select>
                  <FormHelperText>
                    Reajuste será aplicado automaticamente a cada 12 meses
                  </FormHelperText>
                </FormControl>
              </Box>
              <Box>
                <TextField
                  label="Taxa de Reajuste Anual (%)"
                  type="number"
                  inputProps={{ step: 0.01, min: 0, max: 100 }}
                  value={formData.adjustmentValue || ""}
                  onChange={(e) =>
                    handleStepData({ adjustmentValue: e.target.value })
                  }
                  fullWidth
                  placeholder="Ex: 5.0 (IPCA) ou 10.0"
                  helperText="Digite a taxa que será aplicada anualmente"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "8px",
                    },
                  }}
                />
              </Box>
            </Box>

            <TextField
              label="Centro de Custo"
              value={formData.costCenter || ""}
              onChange={(e) => handleStepData({ costCenter: e.target.value })}
              fullWidth
              placeholder="Ex: Marketing"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
            />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Tags (separadas por vírgula)"
              value={formData.tags || ""}
              onChange={(e) => handleStepData({ tags: e.target.value })}
              fullWidth
              placeholder="software, cloud, essencial"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
            />

            <TextField
              label="Observações"
              multiline
              rows={4}
              value={formData.notes || ""}
              onChange={(e) => handleStepData({ notes: e.target.value })}
              fullWidth
              placeholder="Notas adicionais sobre o contrato..."
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "8px",
                },
              }}
            />
          </Box>
        );

      default:
        return null;
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return (
          formData.title && formData.counterpartyName && formData.ownerUserId
        );
      case 1:
        return formData.startDate && formData.periodicity;
      case 2:
        // Valida se valueAmount existe e é um número válido (incluindo 0)
        return (
          typeof formData.valueAmount === "number" &&
          !isNaN(formData.valueAmount)
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  if (!orgId) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 3 }}>
        <Link href="/contracts" passHref legacyBehavior>
          <Button
            variant="text"
            size="small"
            startIcon={<ArrowLeft className="h-4 w-4" />}
            sx={{ color: "#6b7280" }}
          >
            Voltar
          </Button>
        </Link>
      </Box>

      <Card
        sx={{
          maxWidth: "896px",
          mx: "auto",
          borderRadius: "12px",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <CardHeader
          title={
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "1.25rem", md: "1.5rem" },
              }}
            >
              {t("contracts.new")}
            </Typography>
          }
          sx={{ pb: 2 }}
        />
        <CardContent>
          {/* Stepper */}
          <Box sx={{ width: "100%", mb: 4 }}>
            <Stepper
              activeStep={activeStep}
              connector={<ColorlibConnector />}
              orientation="horizontal"
            >
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel
                    StepIconProps={{
                      sx: {
                        fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                        "&.Mui-completed": {
                          color: "#1d2b48",
                        },
                        "&.Mui-active": {
                          color: "#1d2b48",
                        },
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: {
                          xs: "0.75rem",
                          sm: "0.875rem",
                          md: "0.9375rem",
                        },
                        fontWeight: activeStep === index ? 600 : 400,
                        color: activeStep === index ? "#1d2b48" : undefined,
                        mt: 0.5,
                        display: { xs: "none", sm: "block" },
                      }}
                    >
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>

          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              // Previne submit com Enter em qualquer step que não seja o último
              if (e.key === "Enter") {
                e.preventDefault();
                // Se estiver no último step e o campo não for textarea, permite submit
                const target = e.target as HTMLElement;
                if (
                  activeStep === steps.length - 1 &&
                  target.tagName !== "TEXTAREA"
                ) {
                  canSubmitRef.current = true;
                  handleSubmit(e as any);
                }
              }
            }}
          >
            {/* Render current step content */}
            <Box sx={{ mb: 3 }}>{renderStepContent(activeStep)}</Box>

            {/* Navigation Buttons */}
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: { xs: 1.5, sm: 2 },
                justifyContent: "space-between",
                mt: 4,
                pt: 3,
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <Box>
                {activeStep > 0 && (
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleBack}
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      borderRadius: "8px",
                      textTransform: "none",
                      borderColor: "#e5e7eb",
                      color: "#374151",
                      "&:hover": {
                        borderColor: "#d1d5db",
                        backgroundColor: "#f9fafb",
                      },
                    }}
                  >
                    Voltar
                  </Button>
                )}
              </Box>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: { xs: 1.5, sm: 2 },
                }}
              >
                <Link href="/contracts" passHref legacyBehavior>
                  <Button
                    variant="outlined"
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      borderRadius: "8px",
                      textTransform: "none",
                      borderColor: "#e5e7eb",
                      color: "#374151",
                      "&:hover": {
                        borderColor: "#d1d5db",
                        backgroundColor: "#f9fafb",
                      },
                    }}
                  >
                    {t("form.cancel")}
                  </Button>
                </Link>
                {activeStep < steps.length - 1 ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepValid(activeStep)}
                    variant="contained"
                    endIcon={<ArrowRight className="h-4 w-4" />}
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      backgroundColor: "#1d2b48",
                      borderRadius: "8px",
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "#162039",
                      },
                      "&:disabled": {
                        backgroundColor: "#9ca3af",
                      },
                    }}
                  >
                    Próximo
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      canSubmitRef.current = true;
                      // Trigger form submit programmatically
                      const form = document.querySelector("form");
                      if (form) {
                        form.requestSubmit();
                      }
                    }}
                    disabled={isSubmitting || !isStepValid(activeStep)}
                    variant="contained"
                    startIcon={
                      isSubmitting ? (
                        <CircularProgress size={16} sx={{ color: "white" }} />
                      ) : (
                        <Check className="h-4 w-4" />
                      )
                    }
                    sx={{
                      width: { xs: "100%", sm: "auto" },
                      backgroundColor: "#1d2b48",
                      borderRadius: "8px",
                      textTransform: "none",
                      "&:hover": {
                        backgroundColor: "#162039",
                      },
                      "&:disabled": {
                        backgroundColor: "#9ca3af",
                      },
                    }}
                  >
                    {isSubmitting ? "Salvando..." : "Criar Contrato"}
                  </Button>
                )}
              </Box>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
