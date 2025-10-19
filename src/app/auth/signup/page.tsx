"use client";

import { signIn } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  Mail,
  UserPlus,
  Building2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Paper,
  Select,
  MenuItem,
  FormControl,
  Alert,
} from "@mui/material";
import { trpc } from "@/lib/trpc-client";
import { lookupCep, CepAddress } from "@/lib/cep";
import {
  validateCPF,
  validateCNPJ,
  formatCPF,
  formatCNPJ,
  formatCEP,
} from "@/lib/document-validation";

export default function SignUpPage() {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  // Personal info (Step 1)
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState<"PF" | "PJ">("PF");
  const [name, setName] = useState(""); // Nome Completo for PF

  // Organization info (Step 2)
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("BR");
  // Identification
  const [cpf, setCpf] = useState("");
  const [legalName, setLegalName] = useState(""); // Razão Social for PJ
  const [tradeName, setTradeName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [ie, setIe] = useState("");

  // Address (Step 3)
  const [cep, setCep] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [stateUf, setStateUf] = useState("");
  const [isCepLoading, setIsCepLoading] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Validation state
  const [cpfError, setCpfError] = useState("");
  const [cnpjError, setCnpjError] = useState("");

  const signupMutation = trpc.auth.signupWithOrg.useMutation();

  // Step navigation
  const canProceedStep1 = email && (orgType === "PF" ? name : legalName);
  const canProceedStep2 =
    orgName &&
    country &&
    (orgType === "PF" ? cpf && !cpfError : cnpj && !cnpjError);

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setIsTransitioning(true);
      setError("");
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setIsTransitioning(true);
      setError("");
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleEmailSignUp = async () => {
    setError("");
    setIsLoading(true);

    try {
      const result = await signupMutation.mutateAsync({
        email,
        name: orgType === "PF" ? name : legalName, // Use Nome Completo for PF, Razão Social for PJ
        orgName,
        country,
        // New org fields
        orgType,
        cpf: orgType === "PF" ? cpf || undefined : undefined,
        legalName: orgType === "PJ" ? legalName || undefined : undefined,
        tradeName: orgType === "PJ" ? tradeName || undefined : undefined,
        cnpj: orgType === "PJ" ? cnpj || undefined : undefined,
        ie: orgType === "PJ" ? ie || undefined : undefined,
        address:
          cep || street || number || neighborhood || city || stateUf
            ? {
                cep: cep || undefined,
                street: street || undefined,
                number: number || undefined,
                complement: complement || undefined,
                neighborhood: neighborhood || undefined,
                city: city || undefined,
                state: stateUf || undefined,
              }
            : undefined,
      });

      if (result.success) {
        setShowSuccess(true);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);

      // Extract user-friendly error message
      let errorMessage = "Erro ao criar conta. Tente novamente.";

      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }

      setError(errorMessage);
      setIsLoading(false);
    }
  };

  const handleContinueToLogin = async () => {
    setIsLoading(true);

    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        setIsLoading(false);
        setError("Erro ao enviar email. Tente novamente.");
      } else {
        setEmailSent(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error sending magic link:", error);
      setIsLoading(false);
      setError("Erro ao enviar email. Tente novamente.");
    }
  };

  // Success State
  if (showSuccess) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f9fafb",
          p: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            width: "100%",
            maxWidth: 500,
            borderRadius: 3,
            border: "1px solid #e5e7eb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
          }}
        >
          <Box sx={{ p: 5 }}>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                textAlign: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  height: 80,
                  width: 80,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  bgcolor: "#10b981",
                  color: "white",
                  animation: "scaleIn 0.5s ease-out",
                  "@keyframes scaleIn": {
                    "0%": {
                      transform: "scale(0)",
                      opacity: 0,
                    },
                    "50%": {
                      transform: "scale(1.1)",
                    },
                    "100%": {
                      transform: "scale(1)",
                      opacity: 1,
                    },
                  },
                }}
              >
                <CheckCircle size={48} />
              </Box>

              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 600,
                    mb: 1,
                    color: "#111827",
                  }}
                >
                  Conta criada com sucesso!
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: "#6b7280",
                    mb: 2,
                    fontWeight: 400,
                  }}
                >
                  Bem-vindo ao Contratei
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "#6b7280",
                    maxWidth: 400,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  Sua conta e organização <strong>{orgName}</strong> foram
                  criadas. Clique no botão abaixo para receber o link de acesso
                  no seu email.
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                onClick={handleContinueToLogin}
                disabled={isLoading || emailSent}
                endIcon={
                  isLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : !emailSent ? (
                    <ArrowRight size={20} />
                  ) : undefined
                }
                sx={{
                  mt: 2,
                  px: 4,
                  py: 1.5,
                  bgcolor: emailSent ? "#10b981" : "#1d2b48",
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  boxShadow: emailSent
                    ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                    : "none",
                  "&:hover": {
                    bgcolor: emailSent ? "#10b981" : "#152038",
                    boxShadow: emailSent
                      ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                      : "none",
                  },
                  "&:disabled": {
                    bgcolor: emailSent ? "#10b981" : "#9ca3af",
                    color: "white",
                    opacity: 1,
                    cursor: emailSent ? "not-allowed" : "not-allowed",
                    boxShadow: emailSent
                      ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                      : "none",
                  },
                }}
              >
                {isLoading
                  ? "Enviando..."
                  : emailSent
                  ? "✓ Link Enviado"
                  : "Receber Link de Acesso"}
              </Button>

              <Typography
                variant="body2"
                sx={{
                  color: "#9ca3af",
                  fontSize: "0.875rem",
                  mt: 1,
                }}
              >
                {emailSent ? (
                  <>
                    Link enviado para <strong>{email}</strong>. Verifique sua
                    caixa de entrada!
                  </>
                ) : (
                  <>
                    Um email será enviado para <strong>{email}</strong>
                  </>
                )}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#f9fafb",
        py: 3,
        px: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 600,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ py: 2, px: 4, pb: 3 }}>
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 1.5 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
              <Image
                src="/logo.svg"
                alt="Contratei"
                width={90}
                height={30}
                priority
              />
            </Box>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: "#111827",
                mb: 0.25,
                fontSize: "1.35rem",
              }}
            >
              Criar Conta
            </Typography>
            <Typography
              variant="body2"
              sx={{ color: "#6b7280", fontSize: "0.875rem" }}
            >
              Passo {currentStep} de {totalSteps}
            </Typography>
          </Box>

          {/* Step Indicators - Horizontal Stepper with Labels */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              mb: 3,
              position: "relative",
              px: 2,
            }}
          >
            {[
              { num: 1, label: "Informações Básicas" },
              { num: 2, label: "Dados da Organização" },
              { num: 3, label: "Endereço (Opcional)" },
            ].map((step, index) => (
              <Box
                key={step.num}
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  position: "relative",
                  flex: 1,
                  maxWidth: index === 1 ? "200px" : "180px",
                }}
              >
                {/* Circle with Number and Check */}
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor:
                      currentStep > step.num
                        ? "#1d2b48"
                        : currentStep === step.num
                        ? "#1d2b48"
                        : "#9ca3af",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "1rem",
                    transition: "all 0.3s ease",
                    zIndex: 2,
                    mb: 1.5,
                    position: "relative",
                  }}
                >
                  {currentStep > step.num ? (
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3334 4L6.00002 11.3333L2.66669 8"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    step.num
                  )}
                </Box>

                {/* Label */}
                <Typography
                  variant="body2"
                  sx={{
                    color: currentStep >= step.num ? "#1f2937" : "#9ca3af",
                    fontWeight: currentStep === step.num ? 600 : 500,
                    fontSize: "0.875rem",
                    textAlign: "center",
                    lineHeight: 1.3,
                    transition: "all 0.3s ease",
                  }}
                >
                  {step.label}
                </Typography>

                {/* Connecting Line */}
                {index < 2 && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: 20,
                      left: "calc(50% + 20px)",
                      right: "calc(-50% + 20px)",
                      height: 2,
                      bgcolor: currentStep > step.num ? "#1d2b48" : "#d1d5db",
                      zIndex: 1,
                      transition: "background-color 0.3s ease",
                    }}
                  />
                )}
              </Box>
            ))}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Animated Step Container */}
          <Box
            sx={{
              position: "relative",
              overflow: "hidden",
              minHeight: 320,
            }}
          >
            {/* Loading Overlay during transition */}
            {isTransitioning && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(255, 255, 255, 0.8)",
                  zIndex: 10,
                  animation: "fadeIn 0.2s ease-in",
                  "@keyframes fadeIn": {
                    "0%": {
                      opacity: 0,
                    },
                    "100%": {
                      opacity: 1,
                    },
                  },
                }}
              >
                <CircularProgress size={40} sx={{ color: "#1d2b48" }} />
              </Box>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && !isTransitioning && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  animation: "fadeSlideIn 0.4s ease-out",
                  "@keyframes fadeSlideIn": {
                    "0%": {
                      opacity: 0,
                      transform: "translateX(20px)",
                    },
                    "100%": {
                      opacity: 1,
                      transform: "translateX(0)",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      height: 40,
                      width: 40,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      bgcolor: "#1d2b48",
                      color: "white",
                    }}
                  >
                    <User size={20} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Dados Pessoais
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Informe seu tipo e dados
                    </Typography>
                  </Box>
                </Box>

                {/* Org Type PF/PJ Selector - First Field */}
                <FormControl fullWidth>
                  <Select
                    value={orgType}
                    onChange={(e) => {
                      setOrgType(e.target.value as any);
                      // Clear fields when switching type
                      setName("");
                      setLegalName("");
                      setCpf("");
                      setCnpj("");
                    }}
                    disabled={isLoading}
                  >
                    <MenuItem value="PF">Pessoa Física (PF)</MenuItem>
                    <MenuItem value="PJ">Pessoa Jurídica (PJ)</MenuItem>
                  </Select>
                </FormControl>

                {/* Conditional Name Field based on orgType */}
                {orgType === "PF" ? (
                  <TextField
                    fullWidth
                    label="Nome Completo"
                    placeholder="Seu nome completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Razão Social"
                    placeholder="Nome da empresa"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                )}

                <TextField
                  fullWidth
                  type="email"
                  label="Email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  InputProps={{
                    startAdornment: (
                      <Mail
                        style={{
                          height: 20,
                          width: 20,
                          color: "#9ca3af",
                          marginRight: 8,
                        }}
                      />
                    ),
                  }}
                />

                <Box
                  sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}
                >
                  <Button
                    variant="contained"
                    onClick={goToNextStep}
                    disabled={!canProceedStep1}
                    endIcon={<ArrowRight size={16} />}
                    sx={{
                      bgcolor: "#1d2b48",
                      "&:hover": { bgcolor: "#152038" },
                      textTransform: "none",
                    }}
                  >
                    Continuar
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 2: Organization Information */}
            {currentStep === 2 && !isTransitioning && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  animation: "fadeSlideIn 0.4s ease-out",
                  "@keyframes fadeSlideIn": {
                    "0%": {
                      opacity: 0,
                      transform: "translateX(20px)",
                    },
                    "100%": {
                      opacity: 1,
                      transform: "translateX(0)",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      height: 40,
                      width: 40,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      bgcolor: "#1d2b48",
                      color: "white",
                    }}
                  >
                    <Building2 size={20} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Dados da Organização
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Configure sua {orgType === "PF" ? "conta" : "empresa"}
                    </Typography>
                  </Box>
                </Box>

                <TextField
                  fullWidth
                  label="Nome da Organização"
                  placeholder={
                    orgType === "PF"
                      ? "Nome para sua conta"
                      : "Nome da sua empresa"
                  }
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  disabled={isLoading}
                />

                <FormControl fullWidth>
                  <Select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    disabled={isLoading}
                    displayEmpty
                  >
                    <MenuItem value="BR">Brasil</MenuItem>
                    <MenuItem value="PT">Portugal</MenuItem>
                  </Select>
                </FormControl>

                {/* Identification Fields based on orgType */}
                {country === "BR" && (
                  <>
                    {orgType === "PF" ? (
                      <TextField
                        fullWidth
                        label="CPF"
                        placeholder="000.000.000-00"
                        value={cpf}
                        onChange={(e) => {
                          const formatted = formatCPF(e.target.value);
                          setCpf(formatted);
                          setCpfError("");
                        }}
                        onBlur={() => {
                          if (cpf && !validateCPF(cpf)) {
                            setCpfError("CPF inválido");
                          } else {
                            setCpfError("");
                          }
                        }}
                        disabled={isLoading}
                        required
                        inputProps={{ maxLength: 14 }}
                        error={!!cpfError}
                        helperText={cpfError}
                      />
                    ) : (
                      <>
                        <TextField
                          fullWidth
                          label="Nome Fantasia"
                          placeholder="Nome comercial da empresa"
                          value={tradeName}
                          onChange={(e) => setTradeName(e.target.value)}
                          disabled={isLoading}
                        />
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 1fr",
                            gap: 2,
                          }}
                        >
                          <TextField
                            fullWidth
                            label="CNPJ"
                            placeholder="00.000.000/0000-00"
                            value={cnpj}
                            onChange={(e) => {
                              const formatted = formatCNPJ(e.target.value);
                              setCnpj(formatted);
                              setCnpjError("");
                            }}
                            onBlur={() => {
                              if (cnpj && !validateCNPJ(cnpj)) {
                                setCnpjError("CNPJ inválido");
                              } else {
                                setCnpjError("");
                              }
                            }}
                            disabled={isLoading}
                            required
                            inputProps={{ maxLength: 18 }}
                            error={!!cnpjError}
                            helperText={cnpjError}
                          />
                          <TextField
                            fullWidth
                            label="Inscrição Estadual"
                            placeholder="ISENTO ou número"
                            value={ie}
                            onChange={(e) => setIe(e.target.value)}
                            disabled={isLoading}
                          />
                        </Box>
                      </>
                    )}
                  </>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={goToPreviousStep}
                    startIcon={<ArrowLeft size={16} />}
                    sx={{ textTransform: "none" }}
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={goToNextStep}
                    disabled={!canProceedStep2}
                    endIcon={<ArrowRight size={16} />}
                    sx={{
                      bgcolor: "#1d2b48",
                      "&:hover": { bgcolor: "#152038" },
                      textTransform: "none",
                    }}
                  >
                    Continuar
                  </Button>
                </Box>
              </Box>
            )}

            {/* Step 3: Address (optional) */}
            {currentStep === 3 && !isTransitioning && (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 1.5,
                  animation: "fadeSlideIn 0.4s ease-out",
                  "@keyframes fadeSlideIn": {
                    "0%": {
                      opacity: 0,
                      transform: "translateX(20px)",
                    },
                    "100%": {
                      opacity: 1,
                      transform: "translateX(0)",
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    mb: 0,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      height: 40,
                      width: 40,
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "50%",
                      bgcolor: "#1d2b48",
                      color: "white",
                    }}
                  >
                    <MapPin size={20} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Endereço
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.secondary" }}
                    >
                      Opcional - pode preencher depois
                    </Typography>
                  </Box>
                </Box>

                {country === "BR" && (
                  <>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="CEP"
                        placeholder="00000-000"
                        value={cep}
                        onChange={(e) => {
                          const formatted = formatCEP(e.target.value);
                          setCep(formatted);
                        }}
                        onBlur={async () => {
                          const clean = cep.replace(/\D/g, "");
                          if (clean.length === 8) {
                            try {
                              setIsCepLoading(true);
                              const addr: CepAddress = await lookupCep(clean);
                              setStreet(addr.street);
                              setNeighborhood(addr.neighborhood);
                              setCity(addr.city);
                              setStateUf(addr.state);
                              if (!complement) setComplement(addr.complement);
                            } catch (err: any) {
                              setError(err.message || "CEP inválido");
                            } finally {
                              setIsCepLoading(false);
                            }
                          }
                        }}
                        disabled={isLoading}
                        inputProps={{ maxLength: 9 }}
                      />
                      <TextField
                        label="Número"
                        value={number}
                        onChange={(e) => setNumber(e.target.value)}
                        disabled={isLoading}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr",
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="Rua"
                        value={street}
                        onChange={(e) => setStreet(e.target.value)}
                        disabled={isLoading || isCepLoading}
                      />
                      <TextField
                        label="Complemento"
                        value={complement}
                        onChange={(e) => setComplement(e.target.value)}
                        disabled={isLoading}
                      />
                    </Box>
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr",
                        gap: 2,
                      }}
                    >
                      <TextField
                        label="Bairro"
                        value={neighborhood}
                        onChange={(e) => setNeighborhood(e.target.value)}
                        disabled={isLoading || isCepLoading}
                      />
                      <TextField
                        label="Cidade"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        disabled={isLoading || isCepLoading}
                      />
                      <TextField
                        label="UF"
                        value={stateUf}
                        onChange={(e) => setStateUf(e.target.value)}
                        disabled={isLoading || isCepLoading}
                        inputProps={{ maxLength: 2 }}
                      />
                    </Box>
                  </>
                )}

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={goToPreviousStep}
                    startIcon={<ArrowLeft size={16} />}
                    disabled={isLoading}
                    sx={{ textTransform: "none" }}
                  >
                    Voltar
                  </Button>
                  <Button
                    variant="contained"
                    onClick={handleEmailSignUp}
                    disabled={isLoading}
                    startIcon={
                      isLoading ? (
                        <CircularProgress size={20} sx={{ color: "white" }} />
                      ) : (
                        <UserPlus style={{ height: 20, width: 20 }} />
                      )
                    }
                    sx={{
                      bgcolor: "#1d2b48",
                      "&:hover": { bgcolor: "#152038" },
                      textTransform: "none",
                    }}
                  >
                    {isLoading ? "Criando conta..." : "Criar Conta"}
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "#6b7280",
              mt: 2.5,
              fontSize: "0.8125rem",
            }}
          >
            Ao criar uma conta, você concorda com nossos{" "}
            <Link
              href="/terms"
              style={{
                color: "#1d2b48",
                textDecoration: "none",
              }}
            >
              Termos de Serviço
            </Link>{" "}
            e{" "}
            <Link
              href="/privacy"
              style={{
                color: "#1d2b48",
                textDecoration: "none",
              }}
            >
              Política de Privacidade
            </Link>
            .
          </Typography>

          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "#6b7280", mt: 1, mb: 0 }}
          >
            Já tem uma conta?{" "}
            <Link
              href="/auth/signin"
              style={{
                color: "#1d2b48",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Entrar
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
