"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import {
  Mail,
  UserPlus,
  Building2,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Paper,
  Select,
  MenuItem,
  FormControl,
  Alert,
  Snackbar,
} from "@mui/material";
import { trpc } from "@/lib/trpc-client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("BR");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const signupMutation = trpc.auth.signupWithOrg.useMutation();

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Create user and organization
      const result = await signupMutation.mutateAsync({
        email,
        name,
        orgName,
        country,
      });

      if (result.success) {
        // Show success state
        setShowSuccess(true);
        setIsLoading(false);
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      setError(error.message || "Erro ao criar conta. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleContinueToLogin = async () => {
    setIsLoading(true);
    console.log("Attempting to send magic link to:", email);

    try {
      // Send magic link using the same method as signin
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      console.log("SignIn result:", result);

      if (result?.error) {
        console.error("SignIn error:", result.error);
        setIsLoading(false);
        setError("Erro ao enviar email. Tente novamente.");
      } else {
        console.log("Email sent successfully");
        // Mark email as sent and show toast
        setEmailSent(true);
        setShowToast(true);
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

        {/* Toast de Sucesso */}
        <Snackbar
          open={showToast}
          autoHideDuration={6000}
          onClose={() => setShowToast(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setShowToast(false)}
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
            ✓ Email enviado com sucesso! Verifique sua caixa de entrada.
          </Alert>
        </Snackbar>
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
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 450,
          borderRadius: 3,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box sx={{ p: 4 }}>
          {/* Logo */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
              <Image
                src="/logo.svg"
                alt="Contratei"
                width={120}
                height={40}
                priority
              />
            </Box>
            <Typography
              variant="h5"
              sx={{ fontWeight: 600, color: "#111827", mb: 1 }}
            >
              Criar Conta
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Comece a gerenciar seus contratos hoje
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {error}
            </Alert>
          )}

          {/* Email Sign Up */}
          <form onSubmit={handleEmailSignUp}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#374151", mb: 2 }}
            >
              Dados Pessoais
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
              >
                Nome Completo
              </Typography>
              <TextField
                fullWidth
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
                variant="outlined"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
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
                }}
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
              >
                Email
              </Typography>
              <TextField
                fullWidth
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                variant="outlined"
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
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
                }}
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 600, color: "#374151", mb: 2 }}
            >
              Dados da Organização
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
              >
                Nome da Organização
              </Typography>
              <TextField
                fullWidth
                type="text"
                placeholder="Nome da sua empresa"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                disabled={isLoading}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <Building2
                      style={{
                        height: 20,
                        width: 20,
                        color: "#9ca3af",
                        marginRight: 8,
                      }}
                    />
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
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
                }}
              />
              <Typography
                variant="caption"
                sx={{ color: "#6b7280", mt: 0.5, display: "block" }}
              >
                Esta será sua organização principal e única para faturamento.
              </Typography>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
              >
                País
              </Typography>
              <FormControl fullWidth>
                <Select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  disabled={isLoading}
                  sx={{
                    borderRadius: 2,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#e5e7eb",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1d2b48",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#1d2b48",
                    },
                  }}
                  MenuProps={{
                    PaperProps: {
                      style: {
                        maxHeight: 300,
                      },
                    },
                  }}
                >
                  <MenuItem value="BR">Brasil</MenuItem>
                  <MenuItem value="PT">Portugal</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              startIcon={
                isLoading ? (
                  <CircularProgress size={20} sx={{ color: "white" }} />
                ) : (
                  <UserPlus style={{ height: 20, width: 20 }} />
                )
              }
              sx={{
                height: 48,
                borderRadius: 2,
                bgcolor: "#1d2b48",
                textTransform: "none",
                fontSize: "0.9375rem",
                fontWeight: 500,
                "&:hover": {
                  bgcolor: "#162039",
                },
                "&:disabled": {
                  bgcolor: "#9ca3af",
                },
              }}
            >
              {isLoading ? "Criando conta..." : "Criar Conta"}
            </Button>
          </form>

          <Typography
            variant="body2"
            sx={{
              textAlign: "center",
              color: "#6b7280",
              mt: 3,
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
            sx={{ textAlign: "center", color: "#6b7280", mt: 2 }}
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
