"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc-client";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Box,
  Typography,
  Button,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogActions,
  TextField,
  CircularProgress,
  DialogContent,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { formatCurrency } from "@/lib/utils";
import {
  Check,
  CreditCard,
  Users,
  FileText,
  Crown,
  Send,
  X,
  ArrowUpRight,
  CheckCircle2,
} from "lucide-react";
import { useSelectedOrg } from "@/hooks/use-selected-org";
import { useToast } from "@/components/providers/toast-provider";

// Styled components matching system design
const StyledCard = styled(MuiCard)(({ theme }) => ({
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

const PlanCard = styled(MuiCard, {
  shouldForwardProp: (prop) => prop !== "featured" && prop !== "current",
})<{ featured?: boolean; current?: boolean }>(
  ({ theme, featured, current }) => ({
    borderRadius: 8,
    border: featured
      ? "2px solid #1d2b48"
      : current
      ? "2px solid #10b981"
      : "1px solid #e5e7eb",
    boxShadow: featured
      ? "0 4px 20px 0 rgba(29, 43, 72, 0.15)"
      : "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
    transition: "all 0.2s ease",
    backgroundColor: "#ffffff",
    position: "relative",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    "&:hover": {
      boxShadow: "0 8px 24px 0 rgba(0, 0, 0, 0.12)",
      transform: "translateY(-2px)",
    },
  })
);

const FeatureIconBox = styled(Box)(({ theme }) => ({
  width: 44,
  height: 44,
  borderRadius: 12,
  backgroundColor: "#e8f4f2",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
}));

type BillingClientProps = {
  subscription: any;
  plans: any[];
  analytics: any;
  org: any;
};

export default function BillingClient({
  subscription: initialSubscription,
  plans: initialPlans,
  analytics: initialAnalytics,
  org,
}: BillingClientProps) {
  const { showSuccess, showError } = useToast();
  const { selectedOrgId: orgId } = useSelectedOrg();

  // State
  const [billingPeriod, setBillingPeriod] = useState<"MONTHLY" | "YEARLY">(
    "MONTHLY"
  );
  const [supportDialogOpen, setSupportDialogOpen] = useState(false);
  const [supportMessage, setSupportMessage] = useState("");
  const [sendingSupport, setSendingSupport] = useState(false);

  // Use initial data and only refetch on mutation
  const subscription = initialSubscription;
  const plans = initialPlans;
  const analytics = initialAnalytics;

  // Mutations
  const createCheckoutMutation = trpc.billing.createCheckoutSession.useMutation(
    {
      onSuccess: (data) => {
        if (data.url) {
          window.location.href = data.url;
        }
      },
      onError: (error: any) => {
        showError(error.message);
      },
    }
  );

  const sendSupportMessage = trpc.support.sendMessage.useMutation({
    onSuccess: () => {
      showSuccess("Mensagem enviada com sucesso!");
      setSupportMessage("");
      setSupportDialogOpen(false);
    },
    onError: (error: any) => {
      showError(error.message);
    },
    onSettled: () => {
      setSendingSupport(false);
    },
  });

  const handleSelectPlan = (planId: string) => {
    if (!orgId) return;
    createCheckoutMutation.mutate({
      orgId,
      plan: planId as any,
      interval: billingPeriod === "MONTHLY" ? "monthly" : "yearly",
    });
  };

  const handleManageSubscription = () => {
    if (!orgId) return;
    if (
      subscription &&
      "stripeCustomerId" in subscription &&
      subscription.stripeCustomerId
    ) {
      window.open(`/api/stripe/portal?orgId=${orgId}`, "_blank");
    }
  };

  const handleSendSupport = () => {
    if (!supportMessage.trim()) return;
    setSendingSupport(true);
    sendSupportMessage.mutate({
      message: supportMessage,
      subject: "Solicitação de plano personalizado",
    });
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Current Plan Overview */}
      <Box sx={{ mb: 4 }}>
        <StyledCard>
          <MuiCardContent sx={{ p: { xs: 3, md: 4 } }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 3,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <FeatureIconBox>
                  <Crown size={24} color="#1d2b48" />
                </FeatureIconBox>
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      color: "#1d2b48",
                      mb: 0.5,
                    }}
                  >
                    {org?.plan ?? "Free"}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#6b7280" }}>
                    Plano atual da organização
                  </Typography>
                </Box>
              </Box>
              {subscription &&
                "stripeCustomerId" in subscription &&
                subscription.stripeCustomerId && (
                  <Button
                    variant="outlined"
                    startIcon={<CreditCard size={16} />}
                    onClick={handleManageSubscription}
                    sx={{
                      borderColor: "#e5e7eb",
                      color: "#1d2b48",
                      "&:hover": {
                        borderColor: "#1d2b48",
                        backgroundColor: "#f9fafb",
                      },
                    }}
                  >
                    Gerenciar Assinatura
                  </Button>
                )}
            </Box>
          </MuiCardContent>
        </StyledCard>
      </Box>

      {/* Usage Statistics */}
      {analytics && (
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h6"
            sx={{ fontWeight: 600, color: "#1d2b48", mb: 2 }}
          >
            Uso Atual
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(4, 1fr)",
              },
              gap: 3,
            }}
          >
            {/* Contracts Card */}
            <StyledCard>
              <MuiCardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <FeatureIconBox>
                    <FileText size={20} color="#1d2b48" />
                  </FeatureIconBox>
                  <Chip
                    label={`${analytics.contractPercentage}%`}
                    size="small"
                    sx={{
                      backgroundColor: "#e8f4f2",
                      color: "#1d2b48",
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
                  Contratos
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "#1d2b48", mb: 1 }}
                >
                  {analytics.contractCount} / {analytics.contractLimit}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={analytics.contractPercentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#e8f4f2",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor:
                        analytics.contractPercentage > 80
                          ? "#ef4444"
                          : "#10b981",
                      borderRadius: 3,
                    },
                  }}
                />
              </MuiCardContent>
            </StyledCard>

            {/* Users Card */}
            <StyledCard>
              <MuiCardContent sx={{ p: 3 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    justifyContent: "space-between",
                    mb: 2,
                  }}
                >
                  <FeatureIconBox>
                    <Users size={20} color="#1d2b48" />
                  </FeatureIconBox>
                  <Chip
                    label={`${analytics.userPercentage}%`}
                    size="small"
                    sx={{
                      backgroundColor: "#e8f4f2",
                      color: "#1d2b48",
                      fontWeight: 600,
                    }}
                  />
                </Box>
                <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
                  Usuários
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "#1d2b48", mb: 1 }}
                >
                  {analytics.userCount} / {analytics.userLimit}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={analytics.userPercentage}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: "#e8f4f2",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor:
                        analytics.userPercentage > 80 ? "#ef4444" : "#10b981",
                      borderRadius: 3,
                    },
                  }}
                />
              </MuiCardContent>
            </StyledCard>

            {/* Active Contracts Card */}
            <StyledCard>
              <MuiCardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <FeatureIconBox>
                    <CheckCircle2 size={20} color="#10b981" />
                  </FeatureIconBox>
                </Box>
                <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
                  Contratos Ativos
                </Typography>
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 700, color: "#1d2b48" }}
                >
                  {analytics.activeContractsCount}
                </Typography>
              </MuiCardContent>
            </StyledCard>

            {/* Current Plan Card */}
            <StyledCard>
              <MuiCardContent sx={{ p: 3 }}>
                <Box sx={{ mb: 2 }}>
                  <FeatureIconBox>
                    <Crown size={20} color="#1d2b48" />
                  </FeatureIconBox>
                </Box>
                <Typography variant="body2" sx={{ color: "#6b7280", mb: 1 }}>
                  Plano Atual
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: "#1d2b48" }}
                >
                  {analytics.currentPlan}
                </Typography>
              </MuiCardContent>
            </StyledCard>
          </Box>
        </Box>
      )}

      {/* Billing Period Toggle */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#1d2b48" }}>
          Planos Disponíveis
        </Typography>
        <ToggleButtonGroup
          value={billingPeriod}
          exclusive
          onChange={(e, value) => value && setBillingPeriod(value)}
          size="small"
          sx={{
            "& .MuiToggleButton-root": {
              borderColor: "#e5e7eb",
              color: "#6b7280",
              "&.Mui-selected": {
                backgroundColor: "#1d2b48",
                color: "#ffffff",
                "&:hover": {
                  backgroundColor: "#162238",
                },
              },
            },
          }}
        >
          <ToggleButton value="MONTHLY">Mensal</ToggleButton>
          <ToggleButton value="YEARLY">Anual</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Plans Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, 1fr)",
            lg: "repeat(3, 1fr)",
          },
          gap: 3,
          mb: 4,
        }}
      >
        {plans?.map((plan: any) => {
          const isCurrent = org?.plan === plan.id;
          const isFeatured = plan.name.toLowerCase().includes("pro");

          return (
            <PlanCard key={plan.id} featured={isFeatured} current={isCurrent}>
              {isCurrent ? (
                <Chip
                  label="Plano Atual"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                />
              ) : isFeatured ? (
                <Chip
                  label="Mais Popular"
                  size="small"
                  sx={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    backgroundColor: "#1d2b48",
                    color: "#ffffff",
                    fontWeight: 600,
                  }}
                />
              ) : null}

              <MuiCardContent
                sx={{
                  p: 3,
                  pt: isCurrent || isFeatured ? 7 : 3,
                  flexGrow: 1,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: "#1d2b48",
                    mb: 1,
                  }}
                >
                  {plan.name}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#6b7280", mb: 3, minHeight: 40 }}
                >
                  Até{" "}
                  {plan.maxContracts === 999999
                    ? "contratos ilimitados"
                    : `${plan.maxContracts} contratos`}
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: "flex", alignItems: "baseline" }}>
                    <Typography
                      variant="h3"
                      sx={{ fontWeight: 800, color: "#1d2b48" }}
                    >
                      {formatCurrency(
                        plan.price[
                          billingPeriod === "MONTHLY" ? "monthly" : "yearly"
                        ]
                      )}
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "#6b7280", ml: 1 }}
                    >
                      /{billingPeriod === "MONTHLY" ? "mês" : "ano"}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 3 }} />

                {/* Features List */}
                <Box sx={{ mb: 3, flexGrow: 1 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "#1d2b48",
                      mb: 2,
                    }}
                  >
                    Recursos inclusos:
                  </Typography>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 1.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Check size={18} color="#10b981" />
                      <Typography variant="body2" sx={{ color: "#4b5563" }}>
                        {plan.maxContracts === 999999
                          ? "Contratos ilimitados"
                          : `Até ${plan.maxContracts} contratos`}
                      </Typography>
                    </Box>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Check size={18} color="#10b981" />
                      <Typography variant="body2" sx={{ color: "#4b5563" }}>
                        {plan.maxUsers === 999999
                          ? "Usuários ilimitados"
                          : `Até ${plan.maxUsers} usuários`}
                      </Typography>
                    </Box>
                    {plan.features.automaticAlerts && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Check size={18} color="#10b981" />
                        <Typography variant="body2" sx={{ color: "#4b5563" }}>
                          Alertas automáticos
                        </Typography>
                      </Box>
                    )}
                    {plan.features.automaticRenewal && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Check size={18} color="#10b981" />
                        <Typography variant="body2" sx={{ color: "#4b5563" }}>
                          Renovação automática
                        </Typography>
                      </Box>
                    )}
                    {plan.features.automaticAdjustments && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Check size={18} color="#10b981" />
                        <Typography variant="body2" sx={{ color: "#4b5563" }}>
                          Ajustes automáticos
                        </Typography>
                      </Box>
                    )}
                    {plan.features.fileUpload && (
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Check size={18} color="#10b981" />
                        <Typography variant="body2" sx={{ color: "#4b5563" }}>
                          Upload de arquivos
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* CTA Button */}
                <Button
                  variant={isCurrent ? "outlined" : "contained"}
                  fullWidth
                  disabled={isCurrent || createCheckoutMutation.isPending}
                  onClick={() => handleSelectPlan(plan.id)}
                  endIcon={!isCurrent && <ArrowUpRight size={16} />}
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: 600,
                    ...(isCurrent
                      ? {
                          borderColor: "#10b981",
                          color: "#10b981",
                          "&:hover": {
                            borderColor: "#059669",
                            backgroundColor: "#f0fdf4",
                          },
                        }
                      : {
                          backgroundColor: "#1d2b48",
                          color: "#ffffff",
                          "&:hover": {
                            backgroundColor: "#162238",
                          },
                        }),
                  }}
                >
                  {isCurrent
                    ? "Plano Atual"
                    : createCheckoutMutation.isPending
                    ? "Processando..."
                    : "Selecionar Plano"}
                </Button>
              </MuiCardContent>
            </PlanCard>
          );
        })}
      </Box>

      {/* Need Help Section */}
      <StyledCard>
        <MuiCardContent sx={{ p: 4 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 3,
            }}
          >
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 600, color: "#1d2b48", mb: 1 }}
              >
                Precisa de um plano personalizado?
              </Typography>
              <Typography variant="body2" sx={{ color: "#6b7280" }}>
                Entre em contato conosco para discutir suas necessidades
                específicas
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<Send size={16} />}
              onClick={() => setSupportDialogOpen(true)}
              sx={{
                backgroundColor: "#1d2b48",
                "&:hover": {
                  backgroundColor: "#162238",
                },
              }}
            >
              Contatar Suporte
            </Button>
          </Box>
        </MuiCardContent>
      </StyledCard>

      {/* Support Dialog */}
      <Dialog
        open={supportDialogOpen}
        onClose={() => setSupportDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6" component="div" sx={{ color: "#1d2b48" }}>
            Contatar Suporte
          </Typography>
          <Button
            onClick={() => setSupportDialogOpen(false)}
            sx={{ minWidth: "auto", color: "#6b7280" }}
            disabled={sendingSupport}
          >
            <X size={20} />
          </Button>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="Descreva sua necessidade..."
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            disabled={sendingSupport}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setSupportDialogOpen(false)}
            variant="outlined"
            disabled={sendingSupport}
            sx={{
              borderColor: "#e5e7eb",
              color: "#6b7280",
              "&:hover": {
                borderColor: "#d1d5db",
                backgroundColor: "#f9fafb",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendSupport}
            variant="contained"
            disabled={sendingSupport || !supportMessage.trim()}
            startIcon={
              sendingSupport ? (
                <CircularProgress size={16} sx={{ color: "#ffffff" }} />
              ) : (
                <Send size={16} />
              )
            }
            sx={{
              backgroundColor: "#1d2b48",
              "&:hover": {
                backgroundColor: "#162238",
              },
            }}
          >
            {sendingSupport ? "Enviando..." : "Enviar"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
