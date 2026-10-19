"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/use-translation";
import { ArrowLeft, ArrowRight, Check, Upload, X } from "lucide-react";
import Link from "next/link";
import { createContractWithFiles } from "@/app/(dashboard)/contracts/new/actions";
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
  Chip,
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

interface NewContractClientProps {
  initialOrgs: any[];
  initialOrg: any;
  initialMembers: any;
  initialOrgId: string;
}

export default function NewContractClient({
  initialOrgs,
  initialOrg,
  initialMembers,
  initialOrgId,
}: NewContractClientProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<any>({
    contractType: "OUTBOUND",
    autoRenew: false,
    adjustmentType: "NONE",
  });

  // Ref para controlar se o submit foi explicitamente solicitado
  const canSubmitRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const orgId = initialOrgId;
  const members = initialMembers?.members || [];

  const handleNext = () => {
    setIsSubmitting(false);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setIsSubmitting(false);
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

    try {
      // Create FormData with contract data and files
      const submitFormData = new FormData();

      // Add contract data
      submitFormData.append("orgId", orgId);
      submitFormData.append("title", formData.title);
      submitFormData.append("contractType", formData.contractType);
      submitFormData.append("counterpartyName", formData.counterpartyName);
      if (formData.counterpartyContact) {
        submitFormData.append(
          "counterpartyContact",
          formData.counterpartyContact
        );
      }
      submitFormData.append("ownerUserId", formData.ownerUserId);
      submitFormData.append("startDate", formData.startDate);
      if (formData.endDate) {
        submitFormData.append("endDate", formData.endDate);
      }
      submitFormData.append("autoRenew", formData.autoRenew.toString());
      submitFormData.append("valueAmount", formData.valueAmount.toString());
      submitFormData.append("adjustmentType", formData.adjustmentType);
      if (formData.adjustmentValue) {
        submitFormData.append(
          "adjustmentValue",
          formData.adjustmentValue.toString()
        );
      }
      if (formData.costCenter) {
        submitFormData.append("costCenter", formData.costCenter);
      }
      if (formData.tags) {
        submitFormData.append("tags", formData.tags);
      }
      if (formData.notes) {
        submitFormData.append("notes", formData.notes);
      }

      // Add files
      selectedFiles.forEach((file) => {
        submitFormData.append("files", file);
      });

      await createContractWithFiles(submitFormData);

      router.push("/contracts");
      router.refresh();
    } catch (error) {
      console.error("Error creating contract:", error);
      setErrorToast("Erro ao criar contrato. Por favor, tente novamente.");
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles([...selectedFiles, ...newFiles]);
      // Reset input value to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  if (!orgId) {
    return <div className="p-8">Loading...</div>;
  }

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
                {members.map((member: any) => (
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

              {/* Periodicidade removida: usamos Data de término + Renovação automática */}

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

            {/* File Upload Section */}
            <Box>
              <Typography
                variant="body2"
                sx={{ mb: 1, fontWeight: 500, color: "#374151" }}
              >
                Arquivos (opcional)
              </Typography>
              <Box
                sx={{
                  border: "2px dashed #d1d5db",
                  borderRadius: "8px",
                  p: 3,
                  textAlign: "center",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "#1d2b48",
                    backgroundColor: "#f9fafb",
                  },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <Typography variant="body2" sx={{ color: "#6b7280" }}>
                  Clique para selecionar arquivos
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: "#9ca3af", display: "block", mt: 0.5 }}
                >
                  Você pode adicionar múltiplos arquivos
                </Typography>
              </Box>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography
                    variant="body2"
                    sx={{ mb: 1, fontWeight: 500, color: "#374151" }}
                  >
                    Arquivos selecionados ({selectedFiles.length})
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    {selectedFiles.map((file, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          p: 2,
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          backgroundColor: "#f9fafb",
                        }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: "#1f2937",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {file.name}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: "#6b7280" }}
                          >
                            {formatFileSize(file.size)}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile(index);
                          }}
                          sx={{
                            minWidth: "auto",
                            p: 0.5,
                            color: "#ef4444",
                            "&:hover": {
                              backgroundColor: "#fee2e2",
                            },
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Box>
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
        return !!formData.startDate;
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
    </Box>
  );
}
