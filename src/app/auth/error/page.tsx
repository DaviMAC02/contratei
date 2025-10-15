"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Erro de Configuração",
    description:
      "Há um problema na configuração do servidor. Entre em contato com o suporte.",
  },
  AccessDenied: {
    title: "Acesso Negado",
    description: "Você não tem permissão para acessar este recurso.",
  },
  Verification: {
    title: "Link Inválido ou Expirado",
    description:
      "Este link de login já foi usado ou expirou. Por favor, solicite um novo link.",
  },
  Default: {
    title: "Erro de Autenticação",
    description:
      "Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") || "Default";

  const errorInfo = errorMessages[error] || errorMessages.Default;

  console.log("❌ Erro de autenticação:", error);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 480, width: "100%" }}>
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          <Box
            sx={{
              mx: "auto",
              mb: 3,
              width: 56,
              height: 56,
              borderRadius: "50%",
              bgcolor: "#fee2e2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AlertCircle style={{ width: 28, height: 28, color: "#dc2626" }} />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 600, mb: 2 }}>
            {errorInfo.title}
          </Typography>

          <Typography variant="body1" sx={{ color: "text.secondary", mb: 3 }}>
            {errorInfo.description}
          </Typography>

          {error === "Verification" && (
            <Alert severity="info" sx={{ mb: 3, textAlign: "left" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                💡 Dica:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 0 }}>
                <li>Cada link só pode ser usado uma vez</li>
                <li>Links expiram em 24 horas</li>
                <li>Solicite um novo link se necessário</li>
              </Box>
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 4 }}>
            <Link href="/auth/signin" style={{ textDecoration: "none" }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                startIcon={<ArrowLeft size={18} />}
                sx={{
                  bgcolor: "#1d2b48",
                  "&:hover": { bgcolor: "#141f35" },
                  textTransform: "none",
                  py: 1.5,
                }}
              >
                Voltar para Login
              </Button>
            </Link>

            {error === "Verification" && (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", mt: 2 }}
              >
                Ao voltar para o login, digite seu email novamente para receber
                um novo link.
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}
