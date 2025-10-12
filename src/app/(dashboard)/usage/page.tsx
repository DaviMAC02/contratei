"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc-client";
import { skipToken } from "@tanstack/react-query";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Button,
  Alert,
  AlertTitle,
  Skeleton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  Users,
  FileText,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Zap,
  Upload,
  Bell,
  RefreshCw,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { DashboardPageWrapper } from "@/components/layout/dashboard-page-wrapper";
import { PLANS } from "@/lib/stripe";
import { trackLimitReached } from "@/components/providers/posthog-provider";

const StatsCard = styled(MuiCard)(({ theme }) => ({
  position: "relative",
  overflow: "hidden",
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

export default function UsagePage() {
  return (
    <DashboardPageWrapper>
      {({ orgId, org }) => <UsageContent orgId={orgId} org={org} />}
    </DashboardPageWrapper>
  );
}

function UsageContent({ orgId, org }: { orgId: string; org: any }) {
  // Get usage stats
  const statsQuery = trpc.contract.getDashboardStats.useQuery(
    orgId && orgId.trim() ? { orgId } : skipToken
  );

  // Get org details with member count
  const orgQuery = trpc.org.get.useQuery(
    orgId && orgId.trim() ? { orgId } : skipToken
  );

  const stats = statsQuery.data;
  const orgDetails = orgQuery.data;

  // Calculate values for tracking (must be before early return)
  const currentPlan = org ? PLANS[org.plan as keyof typeof PLANS] : null;
  const contractsUsed = stats?.total || 0;
  const contractsMax = org?.maxContracts || 0;
  const contractsPercent =
    contractsMax > 0 ? (contractsUsed / contractsMax) * 100 : 0;

  const usersUsed = orgDetails?._count?.members || 0;
  const usersMax = org?.maxUsers || 0;
  const usersPercent = usersMax > 0 ? (usersUsed / usersMax) * 100 : 0;

  const contractsNearLimit = contractsPercent >= 80;
  const usersNearLimit = usersPercent >= 80;
  const contractsAtLimit = contractsUsed >= contractsMax && contractsMax > 0;
  const usersAtLimit = usersUsed >= usersMax && usersMax > 0;

  // Track limit reached events (hooks must be called before any conditional returns)
  useEffect(() => {
    if (contractsAtLimit && org) {
      trackLimitReached("contracts", contractsUsed, contractsMax, org.plan);
    }
  }, [contractsAtLimit, contractsUsed, contractsMax, org]);

  useEffect(() => {
    if (usersAtLimit && org) {
      trackLimitReached("users", usersUsed, usersMax, org.plan);
    }
  }, [usersAtLimit, usersUsed, usersMax, org]);

  // Early return after all hooks
  if (!org || !stats || !orgDetails || !currentPlan) {
    return (
      <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
        <Box className="mb-8">
          <Skeleton
            variant="rectangular"
            width={256}
            height={40}
            sx={{ mb: 2, borderRadius: 1 }}
          />
          <Skeleton
            variant="rectangular"
            width={384}
            height={20}
            sx={{ borderRadius: 1 }}
          />
        </Box>

        {/* Usage Cards Skeleton */}
        <div className="grid gap-6 md:grid-cols-2 mb-6">
          <StatsCard>
            <MuiCardContent className="p-6">
              <Skeleton
                variant="rectangular"
                width={128}
                height={32}
                sx={{ mb: 2, borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                width={96}
                height={48}
                sx={{ mb: 2, borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={8}
                sx={{ mb: 1, borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
            </MuiCardContent>
          </StatsCard>
          <StatsCard>
            <MuiCardContent className="p-6">
              <Skeleton
                variant="rectangular"
                width={128}
                height={32}
                sx={{ mb: 2, borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                width={96}
                height={48}
                sx={{ mb: 2, borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={8}
                sx={{ mb: 1, borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={40}
                sx={{ borderRadius: 1 }}
              />
            </MuiCardContent>
          </StatsCard>
        </div>

        {/* Plan Overview Skeleton */}
        <StatsCard>
          <MuiCardContent className="p-6">
            <Box className="mb-6">
              <Skeleton
                variant="rectangular"
                width={192}
                height={32}
                sx={{ mb: 2, borderRadius: 1 }}
              />
              <Skeleton
                variant="rectangular"
                width={256}
                height={20}
                sx={{ borderRadius: 1 }}
              />
            </Box>

            {/* Plan Badge and Limits Skeleton */}
            <Box className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
              <Box className="flex items-center justify-between mb-4">
                <Skeleton
                  variant="rectangular"
                  width={96}
                  height={20}
                  sx={{ borderRadius: 1 }}
                />
                <Skeleton
                  variant="rectangular"
                  width={64}
                  height={24}
                  sx={{ borderRadius: 1 }}
                />
              </Box>
              <Box className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Box className="flex items-center gap-3">
                  <Skeleton
                    variant="rectangular"
                    width={36}
                    height={36}
                    sx={{ borderRadius: 1 }}
                  />
                  <Box className="flex-1">
                    <Skeleton
                      variant="rectangular"
                      width={128}
                      height={16}
                      sx={{ mb: 1, borderRadius: 1 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={20}
                      sx={{ borderRadius: 1 }}
                    />
                  </Box>
                </Box>
                <Box className="flex items-center gap-3">
                  <Skeleton
                    variant="rectangular"
                    width={36}
                    height={36}
                    sx={{ borderRadius: 1 }}
                  />
                  <Box className="flex-1">
                    <Skeleton
                      variant="rectangular"
                      width={128}
                      height={16}
                      sx={{ mb: 1, borderRadius: 1 }}
                    />
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={20}
                      sx={{ borderRadius: 1 }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Features Grid Skeleton */}
            <Box className="mb-6">
              <Skeleton
                variant="rectangular"
                width={160}
                height={24}
                sx={{ mb: 1.5, borderRadius: 1 }}
              />
              <Box className="grid gap-3 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <Box key={i} className="p-3 rounded border border-gray-200">
                    <Box className="flex items-start gap-2">
                      <Skeleton variant="circular" width={20} height={20} />
                      <Box className="flex-1">
                        <Skeleton
                          variant="rectangular"
                          width={128}
                          height={20}
                          sx={{ mb: 1, borderRadius: 1 }}
                        />
                        <Skeleton
                          variant="rectangular"
                          width={160}
                          height={16}
                          sx={{ borderRadius: 1 }}
                        />
                      </Box>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Button Skeleton */}
            <Skeleton
              variant="rectangular"
              height={44}
              sx={{ borderRadius: 1 }}
            />
          </MuiCardContent>
        </StatsCard>
      </div>
    );
  }

  // Format unlimited display
  const formatLimit = (value: number) => {
    if (value >= 999999) return "Ilimitado";
    return value.toLocaleString("pt-BR");
  };

  const formatUsage = (used: number, max: number) => {
    if (max >= 999999) return `${used.toLocaleString("pt-BR")} de Ilimitado`;
    return `${used} de ${max}`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <Box className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Typography
              variant="h4"
              className="font-semibold text-gray-900 mb-1"
            >
              Uso do Plano
            </Typography>
            <div className="flex items-center gap-2 mt-1">
              <Typography variant="body2" className="text-gray-500">
                Acompanhe o uso dos recursos do seu plano
              </Typography>
              <Chip
                label={currentPlan.name}
                size="small"
                sx={{
                  backgroundColor: "#e8f4f2",
                  color: "#1d2b48",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            </div>
          </div>
        </div>
      </Box>

      {/* Alert if near or at limits */}
      {(contractsNearLimit || usersNearLimit) && (
        <MuiCard
          sx={{
            borderRadius: 1,
            border: "2px solid",
            borderColor:
              contractsAtLimit || usersAtLimit ? "#ef4444" : "#f59e0b",
            backgroundColor:
              contractsAtLimit || usersAtLimit ? "#fef2f2" : "#fffbeb",
            boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
            mb: 3,
          }}
        >
          <MuiCardContent className="p-4">
            <Box className="flex items-start gap-3">
              <AlertTriangle
                className={`h-5 w-5 mt-0.5 ${
                  contractsAtLimit || usersAtLimit
                    ? "text-red-600"
                    : "text-orange-600"
                }`}
              />
              <div className="flex-1">
                <Typography
                  variant="body2"
                  className={
                    contractsAtLimit || usersAtLimit
                      ? "text-red-900"
                      : "text-orange-900"
                  }
                >
                  {contractsAtLimit || usersAtLimit ? (
                    <span className="font-semibold">
                      Você atingiu o limite do seu plano!
                    </span>
                  ) : (
                    <span className="font-semibold">
                      Você está próximo do limite do seu plano.
                    </span>
                  )}
                  {
                    " Considere fazer upgrade para continuar adicionando recursos. "
                  }
                  <Link href={`/billing`}>
                    <span className="font-semibold underline hover:no-underline">
                      Ver planos disponíveis →
                    </span>
                  </Link>
                </Typography>
              </div>
            </Box>
          </MuiCardContent>
        </MuiCard>
      )}

      {/* Usage Cards */}
      <div className="grid gap-6 md:grid-cols-2 mb-6">
        {/* Contracts Usage */}
        <StatsCard>
          <MuiCardContent className="p-6">
            <Box className="flex items-center justify-between mb-4">
              <Box className="flex items-center gap-2">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: "#e8f4f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText className="h-5 w-5" style={{ color: "#1d2b48" }} />
                </Box>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-900"
                >
                  Contratos
                </Typography>
              </Box>
              {contractsAtLimit && (
                <Chip
                  label="Limite atingido"
                  size="small"
                  color="error"
                  sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                />
              )}
              {contractsNearLimit && !contractsAtLimit && (
                <Chip
                  label="Próximo ao limite"
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                />
              )}
            </Box>

            <Typography variant="body2" className="text-gray-500 mb-4">
              Número de contratos ativos na organização
            </Typography>

            <Box className="flex items-baseline justify-between mb-4">
              <Typography variant="h3" className="font-bold text-gray-900">
                {contractsUsed}
              </Typography>
              <Typography variant="body1" className="text-gray-500">
                de {formatLimit(contractsMax)}
              </Typography>
            </Box>

            <Box className="mb-2">
              <LinearProgress
                variant="determinate"
                value={Math.min(contractsPercent, 100)}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: "#e5e7eb",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      contractsPercent >= 80
                        ? "#ef4444"
                        : contractsPercent >= 60
                        ? "#f59e0b"
                        : "#1d2b48",
                    borderRadius: 1,
                  },
                }}
              />
            </Box>
            <Typography variant="caption" className="text-gray-500 block mb-4">
              {contractsPercent.toFixed(1)}% usado
            </Typography>

            {contractsAtLimit ? (
              <Link href={`/billing`}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": {
                      bgcolor: "#b3efe5",
                      color: "#1d2b48",
                      border: "1px solid rgba(0, 0, 0, 0.2)",
                    },
                  }}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Fazer upgrade
                </Button>
              </Link>
            ) : (
              <Link href={`/contracts/new`}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    borderColor: "#1d2b48",
                    color: "#1d2b48",
                    "&:hover": {
                      bgcolor: "#b3efe5",
                      borderColor: "rgba(0, 0, 0, 0.2)",
                      color: "#1d2b48",
                      border: "1px solid rgba(0, 0, 0, 0.2)",
                    },
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Criar contrato
                </Button>
              </Link>
            )}
          </MuiCardContent>
        </StatsCard>

        {/* Users Usage */}
        <StatsCard>
          <MuiCardContent className="p-6">
            <Box className="flex items-center justify-between mb-4">
              <Box className="flex items-center gap-2">
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 1.5,
                    bgcolor: "#e8f4f2",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users className="h-5 w-5" style={{ color: "#1d2b48" }} />
                </Box>
                <Typography
                  variant="h6"
                  className="font-semibold text-gray-900"
                >
                  Usuários
                </Typography>
              </Box>
              {usersAtLimit && (
                <Chip
                  label="Limite atingido"
                  size="small"
                  color="error"
                  sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                />
              )}
              {usersNearLimit && !usersAtLimit && (
                <Chip
                  label="Próximo ao limite"
                  size="small"
                  color="warning"
                  sx={{ fontWeight: 500, fontSize: "0.75rem" }}
                />
              )}
            </Box>

            <Typography variant="body2" className="text-gray-500 mb-4">
              Membros ativos na organização
            </Typography>

            <Box className="flex items-baseline justify-between mb-4">
              <Typography variant="h3" className="font-bold text-gray-900">
                {usersUsed}
              </Typography>
              <Typography variant="body1" className="text-gray-500">
                de {formatLimit(usersMax)}
              </Typography>
            </Box>

            <Box className="mb-2">
              <LinearProgress
                variant="determinate"
                value={Math.min(usersPercent, 100)}
                sx={{
                  height: 8,
                  borderRadius: 1,
                  backgroundColor: "#e5e7eb",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor:
                      usersPercent >= 80
                        ? "#ef4444"
                        : usersPercent >= 60
                        ? "#f59e0b"
                        : "#1d2b48",
                    borderRadius: 1,
                  },
                }}
              />
            </Box>
            <Typography variant="caption" className="text-gray-500 block mb-4">
              {usersPercent.toFixed(1)}% usado
            </Typography>

            {usersAtLimit ? (
              <Link href={`/billing`}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{
                    bgcolor: "#1d2b48",
                    "&:hover": {
                      bgcolor: "#b3efe5",
                      color: "#1d2b48",
                      border: "1px solid rgba(0, 0, 0, 0.2)",
                    },
                  }}
                >
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Fazer upgrade
                </Button>
              </Link>
            ) : (
              <Link href={`/team`}>
                <Button
                  fullWidth
                  variant="outlined"
                  sx={{
                    borderColor: "#1d2b48",
                    color: "#1d2b48",
                    "&:hover": {
                      bgcolor: "#b3efe5",
                      borderColor: "rgba(0, 0, 0, 0.2)",
                      color: "#1d2b48",
                      border: "1px solid rgba(0, 0, 0, 0.2)",
                    },
                  }}
                >
                  <Users className="mr-2 h-4 w-4" />
                  Convidar membro
                </Button>
              </Link>
            )}
          </MuiCardContent>
        </StatsCard>
      </div>

      {/* Plan Overview - Unified Card */}
      <MuiCard
        sx={{
          borderRadius: 2,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box className="p-6 pb-4">
          <Box className="flex items-center gap-3 mb-1">
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
              <Zap className="h-5 w-5" style={{ color: "#1d2b48" }} />
            </Box>
            <Typography variant="h6" className="font-semibold text-gray-900">
              Visão Geral do Plano
            </Typography>
          </Box>
          <Typography variant="body2" className="text-gray-500 ml-11">
            Detalhes completos do seu plano {currentPlan.name}
          </Typography>
        </Box>
        <MuiCardContent className="p-6 pt-2">
          {/* Plan Badge and Limits */}
          <Box
            className="mb-5 p-4 rounded-lg"
            sx={{ bgcolor: "#f8fafc", border: "1px solid #e5e7eb" }}
          >
            <Box className="flex items-center justify-between mb-3">
              <Typography variant="body2" className="text-gray-600 font-medium">
                Plano Atual
              </Typography>
              <Chip
                label={currentPlan.name}
                size="medium"
                sx={{
                  fontWeight: 600,
                  bgcolor: "#1d2b48",
                  color: "#fff",
                  "&:hover": { bgcolor: "#2d3b58" },
                }}
              />
            </Box>

            <Box className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Box className="flex items-center gap-3">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    bgcolor: "#eff6ff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FileText className="h-4 w-4" style={{ color: "#3b82f6" }} />
                </Box>
                <Box>
                  <Typography variant="body2" className="text-gray-600 text-xs">
                    Contratos permitidos
                  </Typography>
                  <Typography
                    variant="body1"
                    className="font-semibold text-gray-900"
                  >
                    {formatLimit(contractsMax)}
                  </Typography>
                </Box>
              </Box>

              <Box className="flex items-center gap-3">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    bgcolor: "#f0fdf4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Users className="h-4 w-4" style={{ color: "#10b981" }} />
                </Box>
                <Box>
                  <Typography variant="body2" className="text-gray-600 text-xs">
                    Usuários permitidos
                  </Typography>
                  <Typography
                    variant="body1"
                    className="font-semibold text-gray-900"
                  >
                    {formatLimit(usersMax)}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Features Grid */}
          <Box className="mb-5">
            <Typography
              variant="subtitle1"
              className="font-semibold text-gray-900 mb-2.5"
            >
              Recursos Disponíveis
            </Typography>
            <Box className="grid gap-2.5 md:grid-cols-2">
              {/* Automatic Alerts */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "start",
                  gap: 2,
                  p: 2.5,
                  borderRadius: 1,
                  border: "1px solid #e5e7eb",
                  backgroundColor: currentPlan.features.automaticAlerts
                    ? "#f0fdf4"
                    : "#f9fafb",
                }}
              >
                {currentPlan.features.automaticAlerts ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                )}
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 mb-0.5">
                    <Bell className="h-4 w-4 text-gray-700" />
                    <Typography
                      variant="subtitle2"
                      className="font-semibold text-gray-900"
                    >
                      Alertas Automáticos
                    </Typography>
                  </Box>
                  <Typography variant="body2" className="text-gray-600 text-sm">
                    {currentPlan.features.automaticAlerts
                      ? "Notificações de vencimento"
                      : "Não disponível"}
                  </Typography>
                </Box>
              </Box>

              {/* Automatic Renewal */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "start",
                  gap: 2,
                  p: 2.5,
                  borderRadius: 1,
                  border: "1px solid #e5e7eb",
                  backgroundColor: currentPlan.features.automaticRenewal
                    ? "#f0fdf4"
                    : "#f9fafb",
                }}
              >
                {currentPlan.features.automaticRenewal ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                )}
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 mb-0.5">
                    <RefreshCw className="h-4 w-4 text-gray-700" />
                    <Typography
                      variant="subtitle2"
                      className="font-semibold text-gray-900"
                    >
                      Renovação Automática
                    </Typography>
                  </Box>
                  <Typography variant="body2" className="text-gray-600 text-sm">
                    {currentPlan.features.automaticRenewal
                      ? "Renovação de contratos"
                      : "Não disponível"}
                  </Typography>
                </Box>
              </Box>

              {/* Automatic Adjustments */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "start",
                  gap: 2,
                  p: 2.5,
                  borderRadius: 1,
                  border: "1px solid #e5e7eb",
                  backgroundColor: currentPlan.features.automaticAdjustments
                    ? "#f0fdf4"
                    : "#f9fafb",
                }}
              >
                {currentPlan.features.automaticAdjustments ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                )}
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 mb-0.5">
                    <DollarSign className="h-4 w-4 text-gray-700" />
                    <Typography
                      variant="subtitle2"
                      className="font-semibold text-gray-900"
                    >
                      Reajustes Automáticos
                    </Typography>
                  </Box>
                  <Typography variant="body2" className="text-gray-600 text-sm">
                    {currentPlan.features.automaticAdjustments
                      ? "Reajustes de preço"
                      : "Não disponível"}
                  </Typography>
                </Box>
              </Box>

              {/* File Upload */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "start",
                  gap: 2,
                  p: 2.5,
                  borderRadius: 1,
                  border: "1px solid #e5e7eb",
                  backgroundColor: currentPlan.features.fileUpload
                    ? "#f0fdf4"
                    : "#f9fafb",
                }}
              >
                {currentPlan.features.fileUpload ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                )}
                <Box className="flex-1">
                  <Box className="flex items-center gap-2 mb-0.5">
                    <Upload className="h-4 w-4 text-gray-700" />
                    <Typography
                      variant="subtitle2"
                      className="font-semibold text-gray-900"
                    >
                      Upload de Arquivos
                    </Typography>
                  </Box>
                  <Typography variant="body2" className="text-gray-600 text-sm">
                    {currentPlan.features.fileUpload
                      ? "Anexar documentos"
                      : "Não disponível"}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Manage Subscription Button */}
          <Link href={`/billing`}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              sx={{
                borderColor: "#1d2b48",
                color: "#1d2b48",
                "&:hover": {
                  bgcolor: "#b3efe5",
                  borderColor: "rgba(0, 0, 0, 0.2)",
                  color: "#1d2b48",
                  border: "1px solid rgba(0, 0, 0, 0.2)",
                },
              }}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Gerenciar Assinatura
            </Button>
          </Link>

          {/* Upgrade CTA */}
          {org.plan === "FREE" && (
            <Box
              className="mt-3 p-3.5 rounded-lg"
              sx={{ bgcolor: "#eff6ff", border: "1px solid #bfdbfe" }}
            >
              <Box className="flex items-start gap-3">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                <Box className="flex-1">
                  <Typography
                    variant="subtitle2"
                    className="font-semibold text-blue-900 mb-0.5"
                  >
                    Desbloqueie todos os recursos
                  </Typography>
                  <Typography
                    variant="body2"
                    className="text-blue-700 text-sm mb-2"
                  >
                    Faça upgrade para ter acesso a alertas, renovações,
                    reajustes automáticos e muito mais.
                  </Typography>
                  <Link href={`/billing`}>
                    <Button
                      size="small"
                      variant="contained"
                      sx={{
                        bgcolor: "#1d2b48",
                        "&:hover": {
                          bgcolor: "#b3efe5",
                          color: "#1d2b48",
                          border: "1px solid rgba(0, 0, 0, 0.2)",
                        },
                      }}
                    >
                      Ver Planos Disponíveis
                    </Button>
                  </Link>
                </Box>
              </Box>
            </Box>
          )}
        </MuiCardContent>
      </MuiCard>
    </div>
  );
}
