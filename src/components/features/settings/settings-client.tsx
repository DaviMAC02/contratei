"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  Alert,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Save as SaveIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
  Business as BusinessIcon,
} from "@mui/icons-material";
import { useTranslation } from "@/lib/use-translation";
import { useSelectedOrg } from "@/hooks/use-selected-org";

// Styled Card matching dashboard styles
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 8,
  border: "1px solid #e5e7eb",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  transition: "all 0.2s ease",
  backgroundColor: "#ffffff",
  "&:hover": {
    boxShadow: "0 4px 12px 0 rgba(0, 0, 0, 0.1)",
    borderColor: "#d1d5db",
  },
}));

type SettingsClientProps = {
  org: any;
  session: any;
};

export default function SettingsClient({ org, session }: SettingsClientProps) {
  const { t } = useTranslation();
  const { selectedOrgId: orgId } = useSelectedOrg();
  const [successMessage, setSuccessMessage] = useState("");

  const updateOrgMutation = trpc.org.update.useMutation({
    onSuccess: () => {
      setSuccessMessage("Configurações salvas com sucesso!");
      setTimeout(() => setSuccessMessage(""), 3000);
    },
  });

  const handleUpdateOrg = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orgId) return;
    const formData = new FormData(e.currentTarget);

    await updateOrgMutation.mutateAsync({
      orgId,
      name: formData.get("name") as string,
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 900 }}>
          {/* Header */}
          <Box className="mb-8">
            <Typography
              variant="h4"
              className="font-semibold text-gray-900 mb-1"
            >
              {t("nav.settings")}
            </Typography>
            <Typography variant="body2" className="text-gray-500">
              Configure sua organização e preferências
            </Typography>
          </Box>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Organization Settings */}
            <StyledCard>
              <CardContent className="p-6">
                <Box className="flex items-center gap-2 mb-6">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: "#e8f4f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BusinessIcon sx={{ color: "#1d2b48", fontSize: 20 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    className="font-semibold text-gray-900"
                  >
                    Organização
                  </Typography>
                </Box>

                <form onSubmit={handleUpdateOrg}>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 3 }}
                  >
                    <TextField
                      fullWidth
                      id="name"
                      name="name"
                      label="Nome da Organização"
                      required
                      defaultValue={org?.name}
                      variant="outlined"
                      size="small"
                    />

                    <FormControl fullWidth required size="small">
                      <InputLabel id="country-label">País / Região</InputLabel>
                      <Select
                        labelId="country-label"
                        id="country"
                        name="country"
                        defaultValue={org?.country || "BR"}
                        label="País / Região"
                      >
                        <MenuItem value="BR">Brasil (BRL)</MenuItem>
                        <MenuItem value="US">Estados Unidos (USD)</MenuItem>
                      </Select>
                      <FormHelperText className="text-gray-500">
                        Define a moeda e idioma padrão da organização
                      </FormHelperText>
                    </FormControl>

                    <Box sx={{ pt: 1 }}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="small"
                        startIcon={
                          updateOrgMutation.isPending ? (
                            <CircularProgress
                              size={16}
                              sx={{ color: "#fff" }}
                            />
                          ) : (
                            <SaveIcon />
                          )
                        }
                        disabled={updateOrgMutation.isPending}
                        sx={{
                          bgcolor: "#1d2b48",
                          "&:hover": { bgcolor: "#141f35" },
                          textTransform: "none",
                          fontWeight: 500,
                        }}
                      >
                        {updateOrgMutation.isPending
                          ? "Salvando..."
                          : "Salvar Alterações"}
                      </Button>
                    </Box>
                  </Box>
                </form>
              </CardContent>
            </StyledCard>

            {/* Profile Settings */}
            <StyledCard>
              <CardContent className="p-6">
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-900 mb-6"
                >
                  Perfil do Usuário
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <TextField
                    fullWidth
                    label="Nome"
                    value={session?.user?.name || ""}
                    disabled
                    variant="outlined"
                    size="small"
                  />

                  <TextField
                    fullWidth
                    label="Email"
                    value={session?.user?.email || ""}
                    disabled
                    variant="outlined"
                    size="small"
                  />

                  <Typography variant="body2" className="text-gray-500">
                    Para alterar seu nome ou email, entre em contato com o
                    suporte.
                  </Typography>
                </Box>
              </CardContent>
            </StyledCard>

            {/* Notification Settings */}
            <StyledCard>
              <CardContent className="p-6">
                <Box className="flex items-center gap-2 mb-6">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: "#e8f4f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <NotificationsIcon
                      sx={{ color: "#1d2b48", fontSize: 20 }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    className="font-semibold text-gray-900"
                  >
                    Notificações
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel id="alert90-label">
                      Alertas 90 dias antes
                    </InputLabel>
                    <Select
                      labelId="alert90-label"
                      id="alert90"
                      defaultValue="true"
                      label="Alertas 90 dias antes"
                    >
                      <MenuItem value="true">Ativado</MenuItem>
                      <MenuItem value="false">Desativado</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="alert60-label">
                      Alertas 60 dias antes
                    </InputLabel>
                    <Select
                      labelId="alert60-label"
                      id="alert60"
                      defaultValue="true"
                      label="Alertas 60 dias antes"
                    >
                      <MenuItem value="true">Ativado</MenuItem>
                      <MenuItem value="false">Desativado</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="alert30-label">
                      Alertas 30 dias antes
                    </InputLabel>
                    <Select
                      labelId="alert30-label"
                      id="alert30"
                      defaultValue="true"
                      label="Alertas 30 dias antes"
                    >
                      <MenuItem value="true">Ativado</MenuItem>
                      <MenuItem value="false">Desativado</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl fullWidth size="small">
                    <InputLabel id="timezone-label">Fuso Horário</InputLabel>
                    <Select
                      labelId="timezone-label"
                      id="timezone"
                      defaultValue="America/Sao_Paulo"
                      label="Fuso Horário"
                    >
                      <MenuItem value="America/Sao_Paulo">
                        Brasília (GMT-3)
                      </MenuItem>
                      <MenuItem value="America/New_York">
                        Nova York (GMT-5)
                      </MenuItem>
                      <MenuItem value="Europe/London">Londres (GMT+0)</MenuItem>
                      <MenuItem value="Asia/Tokyo">Tóquio (GMT+9)</MenuItem>
                    </Select>
                  </FormControl>

                  <Box sx={{ pt: 1 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<SaveIcon />}
                      sx={{
                        borderColor: "#1d2b48",
                        color: "#1d2b48",
                        "&:hover": {
                          borderColor: "#141f35",
                          bgcolor: "rgba(29, 43, 72, 0.04)",
                        },
                        textTransform: "none",
                        fontWeight: 500,
                      }}
                    >
                      Salvar Preferências
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>

            {/* Localization */}
            <StyledCard>
              <CardContent className="p-6">
                <Box className="flex items-center gap-2 mb-6">
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 1.5,
                      bgcolor: "#e8f4f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <LanguageIcon sx={{ color: "#1d2b48", fontSize: 20 }} />
                  </Box>
                  <Typography
                    variant="h6"
                    className="font-semibold text-gray-900"
                  >
                    Localização
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <Box>
                    <TextField
                      fullWidth
                      label="Idioma"
                      value={
                        org?.locale === "pt-BR"
                          ? "Português (Brasil)"
                          : "English (US)"
                      }
                      disabled
                      variant="outlined"
                      size="small"
                    />
                    <FormHelperText
                      className="text-gray-500"
                      sx={{ ml: 0, mt: 1 }}
                    >
                      O idioma é definido automaticamente pelo país da
                      organização
                    </FormHelperText>
                  </Box>

                  <Box>
                    <TextField
                      fullWidth
                      label="Moeda"
                      value={org?.currency || "BRL"}
                      disabled
                      variant="outlined"
                      size="small"
                    />
                    <FormHelperText
                      className="text-gray-500"
                      sx={{ ml: 0, mt: 1 }}
                    >
                      A moeda é definida automaticamente pelo país da
                      organização
                    </FormHelperText>
                  </Box>

                  <TextField
                    fullWidth
                    label="Formato de Data"
                    value={
                      org?.locale === "pt-BR" ? "DD/MM/YYYY" : "MM/DD/YYYY"
                    }
                    disabled
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </CardContent>
            </StyledCard>
          </Box>
        </Box>
      </Box>
    </div>
  );
}
