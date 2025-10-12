"use client";

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Loader2, Sparkles, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  Box,
  Typography,
  TextField,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";

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
        window.location.href = "/auth/verify-request";
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      {/* Content */}
      <Paper
        elevation={0}
        className="w-full max-w-md"
        sx={{
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box className="p-8">
          {/* Logo and Title */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Image
                src="/logo.svg"
                alt="Contratei Logo"
                width={180}
                height={60}
                priority
              />
            </div>
            <Typography
              variant="h5"
              className="font-semibold text-gray-900 mb-2"
            >
              Entrar no Contratei
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Acesse sua conta para gerenciar contratos
            </Typography>
          </div>

          {/* Timeout Alert */}
          {timeout === "true" && (
            <Alert
              severity="warning"
              className="mb-6 rounded-xl animate-slide-in-left"
            >
              ⏱️ Sua sessão expirou por inatividade. Por favor, faça login
              novamente.
            </Alert>
          )}

          {/* Google Sign In */}
          <Button
            variant="outline"
            className="w-full mb-6 h-12 rounded-xl border-2 hover:border-primary hover:bg-primary/5 transition-all hover-lift"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
          >
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
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
            <span className="font-medium">Continuar com Google</span>
          </Button>

          <Divider className="my-6">
            <Typography variant="caption" className="text-gray-500 px-4">
              Ou continue com email
            </Typography>
          </Divider>
          <Divider className="my-6">
            <Typography variant="caption" className="text-gray-500 px-4">
              Ou continue com email
            </Typography>
          </Divider>

          {/* Email Sign In */}
          <form onSubmit={handleEmailSignIn} className="space-y-5">
            <Box>
              <Typography
                variant="body2"
                className="font-medium text-gray-700 mb-2"
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 2,
                    "&:hover": {
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "primary.main",
                      },
                    },
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <Mail className="h-5 w-5 text-gray-400 mr-2" />
                  ),
                }}
              />
            </Box>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-medium hover-lift gradient-primary text-white"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <CircularProgress
                    size={20}
                    className="mr-2"
                    sx={{ color: "white" }}
                  />
                  Enviando...
                </>
              ) : (
                <>
                  Entrar com Email
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>

          <Typography
            variant="body2"
            className="text-center text-gray-600 mt-6"
          >
            Não tem uma conta?{" "}
            <Link
              href="/auth/signup"
              className="text-primary font-semibold hover:underline animated-underline"
            >
              Criar conta
            </Link>
          </Typography>
        </Box>
      </Paper>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SignInForm />
    </Suspense>
  );
}
