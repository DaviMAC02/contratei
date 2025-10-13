"use client";

import { Card, CardContent, Typography, Box } from "@mui/material";
import { Mail, CheckCircle } from "lucide-react";

export default function VerifyRequestPage() {
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
            Um link de acesso foi enviado para seu email.
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary", mb: 4 }}>
            Clique no link no email para entrar na sua conta. O link expira em
            24 horas.
          </Typography>

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
