"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Typography,
  TextField,
  Button,
  Divider,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
  const timeout = searchParams?.get("timeout");

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        alert(`Erro: ${result.error}`);
        setIsLoading(false);
      } else {
        window.location.href = `/auth/verify-request?email=${encodeURIComponent(
          email
        )}`;
      }
    } catch (error) {
      alert("Erro ao fazer login. Tente novamente.");
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl });
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
              Entrar no Contratei
            </Typography>
            <Typography variant="body2" sx={{ color: "#6b7280" }}>
              Acesse sua conta para gerenciar contratos
            </Typography>
          </Box>

          {/* Timeout Alert */}
          {timeout === "true" && (
            <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
              Sua sessão expirou por inatividade. Por favor, faça login
              novamente.
            </Alert>
          )}

          {/* Google Sign In */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleSignIn}
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
              Ou continue com email
            </Typography>
          </Divider>

          {/* Email Sign In */}
          <form onSubmit={handleEmailSignIn}>
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#374151", mb: 1 }}
              >
                Endereço de Email
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

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={isLoading}
              endIcon={
                isLoading ? null : (
                  <ArrowRight style={{ height: 20, width: 20 }} />
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
              {isLoading ? (
                <>
                  <CircularProgress size={20} sx={{ color: "white", mr: 1 }} />
                  Enviando...
                </>
              ) : (
                "Entrar com Email"
              )}
            </Button>
          </form>

          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "#6b7280", mt: 3 }}
          >
            Não tem uma conta?{" "}
            <Link
              href="/auth/signup"
              style={{
                color: "#1d2b48",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Criar conta
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#f9fafb",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
