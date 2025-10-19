"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  CircularProgress,
} from "@mui/material";
import { Mail, CheckCircle, RefreshCw } from "lucide-react";
import { signIn } from "next-auth/react";

export default function VerifyRequestPage() {
  const searchParams = useSearchParams();
  const emailFromUrl = searchParams?.get("email") || "";

  const [email, setEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Load email from URL or localStorage
  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
      localStorage.setItem("verify-email", emailFromUrl);
    } else {
      const storedEmail = localStorage.getItem("verify-email");
      if (storedEmail) {
        setEmail(storedEmail);
      }
    }
  }, [emailFromUrl]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || !email) return;

    setIsResending(true);
    setResendSuccess(false);

    try {
      const result = await signIn("resend", {
        email,
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.error) {
        console.error("Error resending email:", result.error);
      } else {
        setResendSuccess(true);
        setCooldown(30); // Start 30-second cooldown only after success
      }
    } catch (error) {
      console.error("Error resending email:", error);
    } finally {
      setIsResending(false);
    }
  };

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
              bgcolor: "#d1fae5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CheckCircle style={{ width: 28, height: 28, color: "#059669" }} />
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
            Verifique seu Email
          </Typography>

          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <Mail style={{ width: 64, height: 64, color: "#9ca3af" }} />
          </Box>

          <Typography variant="body1" sx={{ color: "text.secondary", mb: 2 }}>
            Um link de acesso foi enviado para{" "}
            {email ? <strong>{email}</strong> : "seu email"}.
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
            Clique no link no email para entrar na sua conta. O link expira em
            24 horas.
          </Typography>

          {resendSuccess && (
            <Box
              sx={{
                bgcolor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderLeft: "4px solid #10b981",
                p: 2.5,
                borderRadius: 2,
                mb: 3,
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <CheckCircle
                style={{
                  width: 20,
                  height: 20,
                  color: "#059669",
                  flexShrink: 0,
                }}
              />
              <Typography
                variant="body2"
                sx={{ color: "#065f46", fontWeight: 500, lineHeight: 1.5 }}
              >
                Link reenviado com sucesso! Verifique seu email.
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            startIcon={
              isResending ? (
                <CircularProgress size={18} sx={{ color: "white" }} />
              ) : (
                <RefreshCw size={18} />
              )
            }
            sx={{
              mb: 3,
              py: 1.5,
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: 600,
              bgcolor: cooldown > 0 || isResending ? "#e5e7eb" : "#1d2b48",
              color: cooldown > 0 || isResending ? "#9ca3af" : "white",
              boxShadow:
                cooldown > 0 || isResending
                  ? "none"
                  : "0 2px 8px rgba(29, 43, 72, 0.15)",
              "&:hover": {
                bgcolor: cooldown > 0 || isResending ? "#e5e7eb" : "#152038",
                boxShadow:
                  cooldown > 0 || isResending
                    ? "none"
                    : "0 4px 12px rgba(29, 43, 72, 0.25)",
              },
              "&:disabled": {
                bgcolor: "#e5e7eb",
                color: "#9ca3af",
              },
            }}
          >
            {isResending
              ? "Reenviando..."
              : cooldown > 0
              ? `Aguarde ${cooldown}s para reenviar`
              : "Reenviar link"}
          </Button>

          <Box
            sx={{
              bgcolor: "#f3f4f6",
              p: 3,
              borderRadius: 1,
              textAlign: "left",
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
              Não recebeu o email?
            </Typography>
            <Box component="ul" sx={{ pl: 2, m: 0, color: "text.secondary" }}>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Verifique sua pasta de spam
              </Typography>
              <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                Confirme se o email está correto
              </Typography>
              <Typography component="li" variant="body2">
                Aguarde alguns minutos e tente novamente
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
