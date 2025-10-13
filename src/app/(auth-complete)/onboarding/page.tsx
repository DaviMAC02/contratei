"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  CircularProgress,
  FormHelperText,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Building,
  FileText,
  Bell,
  Users,
  Check,
  ArrowRight,
  ArrowLeft,
  Loader2,
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [needsOrgCreation, setNeedsOrgCreation] = useState(false);
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null);

  const [orgData, setOrgData] = useState({
    name: "",
    country: "BR" as "BR" | "US",
  });
  const [contractData, setContractData] = useState({
    title: "",
    counterpartyName: "",
    startDate: "",
    valueAmount: "",
    periodicity: "MONTHLY" as const,
  });
  const [alertSettings, setAlertSettings] = useState({
    alert90: true,
    alert60: true,
    alert30: true,
  });
  const [inviteEmails, setInviteEmails] = useState([""]);

  const orgsQuery = trpc.org.list.useQuery(undefined, {
    enabled: !!session,
  });
  const createOrgMutation = trpc.org.create.useMutation();
  const createContractMutation = trpc.contract.create.useMutation();
  const inviteUserMutation = trpc.org.inviteUser.useMutation();

  useEffect(() => {
    if (orgsQuery.data) {
      const userOrgs = orgsQuery.data;
      const ownedOrg = userOrgs.find((org) => org.role === "OWNER");

      if (ownedOrg) {
        // User already has an org (created during email signup)
        setCurrentOrgId(ownedOrg.id);
        setNeedsOrgCreation(false);
        setStep(2); // Skip to contract creation
      } else {
        // User logged in with Google and needs to create org
        setNeedsOrgCreation(true);
        setStep(1);
      }
      setIsLoading(false);
    }
  }, [orgsQuery.data]);

  const handleCreateOrg = async () => {
    const org = await createOrgMutation.mutateAsync(orgData);
    setCurrentOrgId(org.id);
    setStep(2);
  };

  const handleCreateContract = async () => {
    if (!currentOrgId) return;

    if (contractData.title && contractData.counterpartyName) {
      await createContractMutation.mutateAsync({
        orgId: currentOrgId,
        title: contractData.title,
        counterpartyName: contractData.counterpartyName,
        ownerUserId: "", // Will be set on server
        startDate: new Date(contractData.startDate),
        valueAmount: Number(contractData.valueAmount),
        periodicity: contractData.periodicity,
        autoRenew: true,
      });
    }
    setStep(3);
  };

  const handleFinish = async () => {
    if (!currentOrgId) return;

    // Send invites
    for (const email of inviteEmails.filter(Boolean)) {
      await inviteUserMutation.mutateAsync({
        orgId: currentOrgId,
        email,
        role: "VIEWER",
      });
    }

    router.push("/dashboard");
  };

  const totalSteps = needsOrgCreation ? 4 : 3;

  if (isLoading || orgsQuery.isLoading) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <CircularProgress size={40} sx={{ color: "#1d2b48" }} />
          <Typography sx={{ color: "text.secondary" }}>Carregando...</Typography>
        </Box>
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
        background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 800, width: "100%" }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              Bem-vindo!
            </Typography>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Passo {needsOrgCreation ? step : step - 1} de {totalSteps}
            </Typography>
          </Box>

          {/* Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={((needsOrgCreation ? step : step - 1) / totalSteps) * 100}
            sx={{
              mb: 4,
              height: 8,
              borderRadius: 1,
              bgcolor: "#e2e8f0",
              "& .MuiLinearProgress-bar": {
                bgcolor: "#1d2b48",
                borderRadius: 1,
              },
            }}
          />
          {/* Step 1: Create Organization */}
          {step === 1 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
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
                  <Building size={20} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Crie sua Organização
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Configure as informações básicas da sua empresa
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth
                  label="Nome da Organização *"
                  placeholder="Minha Empresa LTDA"
                  value={orgData.name}
                  onChange={(e) =>
                    setOrgData({ ...orgData, name: e.target.value })
                  }
                  required
                />

                <FormControl fullWidth>
                  <InputLabel>País / Região *</InputLabel>
                  <Select
                    value={orgData.country}
                    onChange={(e) =>
                      setOrgData({
                        ...orgData,
                        country: e.target.value as "BR" | "US",
                      })
                    }
                    label="País / Região *"
                  >
                    <MenuItem value="BR">🇧🇷 Brasil (BRL - Português)</MenuItem>
                    <MenuItem value="US">🇺🇸 Estados Unidos (USD - English)</MenuItem>
                  </Select>
                  <FormHelperText>
                    Define a moeda e idioma da sua organização
                  </FormHelperText>
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  variant="contained"
                  onClick={handleCreateOrg}
                  disabled={!orgData.name || createOrgMutation.isPending}
                  endIcon={<ArrowRight size={16} />}
                >
                  Continuar
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 2: Create First Contract */}
          {step === 2 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
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
                  <FileText size={20} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Crie seu Primeiro Contrato
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Opcional - você pode pular e adicionar depois
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth
                  label="Título do Contrato"
                  placeholder="Ex: Contrato de Marketing Digital"
                  value={contractData.title}
                  onChange={(e) =>
                    setContractData({
                      ...contractData,
                      title: e.target.value,
                    })
                  }
                />

                <TextField
                  fullWidth
                  label="Fornecedor / Cliente"
                  placeholder="Nome da empresa"
                  value={contractData.counterpartyName}
                  onChange={(e) =>
                    setContractData({
                      ...contractData,
                      counterpartyName: e.target.value,
                    })
                  }
                />

                <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Data de Início"
                    type="date"
                    value={contractData.startDate}
                    onChange={(e) =>
                      setContractData({
                        ...contractData,
                        startDate: e.target.value,
                      })
                    }
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    fullWidth
                    label="Valor"
                    type="number"
                    placeholder="0.00"
                    value={contractData.valueAmount}
                    onChange={(e) =>
                      setContractData({
                        ...contractData,
                        valueAmount: e.target.value,
                      })
                    }
                    inputProps={{ step: "0.01" }}
                  />
                </Box>

                <FormControl fullWidth>
                  <InputLabel>Periodicidade</InputLabel>
                  <Select
                    value={contractData.periodicity}
                    onChange={(e) =>
                      setContractData({
                        ...contractData,
                        periodicity: e.target.value as any,
                      })
                    }
                    label="Periodicidade"
                  >
                    <MenuItem value="MONTHLY">Mensal</MenuItem>
                    <MenuItem value="YEARLY">Anual</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button variant="outlined" onClick={() => setStep(3)}>
                  Pular
                </Button>
                <Button
                  variant="contained"
                  onClick={handleCreateContract}
                  disabled={createContractMutation.isPending}
                  endIcon={<ArrowRight size={16} />}
                >
                  Continuar
                </Button>
              </Box>
            </Box>
          )}

          {/* Step 3: Alert Settings */}
          {step === 3 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
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
                  <Bell size={20} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Configure os Alertas
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Seja notificado antes dos contratos vencerem
                  </Typography>
                </Box>
              </Box>

              <Card sx={{ bgcolor: "rgba(0, 0, 0, 0.02)" }}>
                <CardContent sx={{ pt: 3 }}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography sx={{ fontWeight: 500 }}>90 dias antes</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          Alerta antecipado
                        </Typography>
                      </Box>
                      <Button
                        variant={alertSettings.alert90 ? "contained" : "outlined"}
                        size="small"
                        onClick={() =>
                          setAlertSettings({
                            ...alertSettings,
                            alert90: !alertSettings.alert90,
                          })
                        }
                      >
                        {alertSettings.alert90 ? "Ativado" : "Desativado"}
                      </Button>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography sx={{ fontWeight: 500 }}>60 dias antes</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          Planejamento médio prazo
                        </Typography>
                      </Box>
                      <Button
                        variant={alertSettings.alert60 ? "contained" : "outlined"}
                        size="small"
                        onClick={() =>
                          setAlertSettings({
                            ...alertSettings,
                            alert60: !alertSettings.alert60,
                          })
                        }
                      >
                        {alertSettings.alert60 ? "Ativado" : "Desativado"}
                      </Button>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography sx={{ fontWeight: 500 }}>30 dias antes</Typography>
                        <Typography variant="body2" sx={{ color: "text.secondary" }}>
                          Alerta final
                        </Typography>
                      </Box>
                      <Button
                        variant={alertSettings.alert30 ? "contained" : "outlined"}
                        size="small"
                        onClick={() =>
                          setAlertSettings({
                            ...alertSettings,
                            alert30: !alertSettings.alert30,
                          })
                        }
                      >
                        {alertSettings.alert30 ? "Ativado" : "Desativado"}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  variant="outlined"
                  onClick={() => setStep(2)}
                  startIcon={<ArrowLeft size={16} />}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  onClick={() => setStep(4)}
                  endIcon={<ArrowRight size={16} />}
                >
                  Continuar
                </Button>
              </Box>
            </Box>
          )}          {/* Step 4: Invite Team */}
          {step === 4 && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
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
                  <Users size={20} />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Convide sua Equipe
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    Opcional - você pode adicionar membros depois
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {inviteEmails.map((email, index) => (
                  <TextField
                    key={index}
                    fullWidth
                    type="email"
                    label={`Email do Membro ${index + 1}`}
                    placeholder="colega@empresa.com"
                    value={email}
                    onChange={(e) => {
                      const newEmails = [...inviteEmails];
                      newEmails[index] = e.target.value;
                      setInviteEmails(newEmails);
                    }}
                  />
                ))}

                <Button
                  variant="outlined"
                  onClick={() => setInviteEmails([...inviteEmails, ""])}
                  fullWidth
                >
                  + Adicionar Outro Email
                </Button>
              </Box>

              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Button
                  variant="outlined"
                  onClick={() => setStep(3)}
                  startIcon={<ArrowLeft size={16} />}
                >
                  Voltar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleFinish}
                  disabled={inviteUserMutation.isPending}
                  startIcon={<Check size={16} />}
                >
                  {inviteUserMutation.isPending
                    ? "Finalizando..."
                    : "Finalizar"}
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
