"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Mail, UserPlus, Building2 } from "lucide-react";
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
} from "@mui/material";
import { trpc } from "@/lib/trpc-client";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("BR");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

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
        // Sign in with magic link
        await signIn("email", {
          email,
          callbackUrl: "/dashboard",
        });
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      setError(error.message || "Erro ao criar conta. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsLoading(true);
    // For Google signup, we'll need to collect org data after auth
    // Redirect to onboarding to collect org info
    await signIn("google", { callbackUrl: "/onboarding" });
  };

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

          {/* Google Sign Up */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleSignUp}
            disabled={isLoading}
            sx={{
              height: 48,
              borderRadius: 2,
              borderWidth: 1.5,
              borderColor: "#e5e7eb",
              color: "#374151",
              textTransform: "none",
              fontSize: "0.9375rem",
              fontWeight: 500,
              mb: 3,
              "&:hover": {
                borderColor: "#1d2b48",
                bgcolor: "#f9fafb",
                borderWidth: 1.5,
              },
            }}
          >
            <svg
              style={{ marginRight: 12, height: 20, width: 20 }}
              viewBox="0 0 24 24"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continuar com Google
          </Button>

          <Divider sx={{ my: 3 }}>
            <Typography variant="body2" sx={{ color: "#9ca3af", px: 2 }}>
              Ou registre-se com
            </Typography>
          </Divider>

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
                  <MenuItem value="BR">🇧🇷 Brasil</MenuItem>
                  <MenuItem value="US">🇺🇸 Estados Unidos</MenuItem>
                  <MenuItem value="PT">🇵🇹 Portugal</MenuItem>
                  <MenuItem value="ES">🇪🇸 Espanha</MenuItem>
                  <MenuItem value="MX">🇲🇽 México</MenuItem>
                  <MenuItem value="AR">🇦🇷 Argentina</MenuItem>
                  <MenuItem value="CL">🇨🇱 Chile</MenuItem>
                  <MenuItem value="CO">🇨🇴 Colômbia</MenuItem>
                </Select>
              </FormControl>
              <Typography
                variant="caption"
                sx={{ color: "#6b7280", mt: 0.5, display: "block" }}
              >
                Define moeda, fuso horário e formato de dados da sua
                organização.
              </Typography>
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
