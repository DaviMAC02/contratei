"use client";

import { useTranslation } from "@/lib/use-translation";
import {
  formatCurrency,
  formatDate,
  getStatusTranslationKey,
} from "@/lib/utils";
import {
  FileText,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import {
  Card as MuiCard,
  CardContent as MuiCardContent,
  Box,
  Typography,
  Chip,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";

interface DashboardClientProps {
  stats: {
    total: number;
    active: number;
    dueSoon: number;
    expiring30: number;
    expired: number;
    totalValue: number;
  };
  contracts: Array<{
    id: string;
    title: string;
    status: string;
    counterpartyName: string;
    owner: { name: string | null };
    nextRenewalDate: Date | null;
    valueAmount: number | string;
    currency: string;
    [key: string]: any; // Allow additional properties from Prisma
  }>;
  org: {
    id: string;
    name: string;
    currency: string;
    locale: string;
    [key: string]: any; // Allow additional properties
  };
  userName: string;
}

// Styled components for professional stats cards
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

export default function DashboardClient({
  stats,
  contracts,
  org,
  userName,
}: DashboardClientProps) {
  const { t } = useTranslation();

  return (
    <div className="p-4 md:p-6 lg:p-8 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <Box className="mb-8">
        <Typography variant="h4" className="font-semibold text-gray-900 mb-1">
          {t("dashboard.welcome")}, {userName}
        </Typography>
        <Typography variant="body2" className="text-gray-500">
          Visão geral dos seus contratos e métricas
        </Typography>
      </Box>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatsCard>
          <MuiCardContent className="p-5">
            <Box className="flex items-start justify-between mb-3">
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
                variant="caption"
                className="text-gray-500 font-medium"
              >
                +{stats.active} ativos
              </Typography>
            </Box>
            <Typography
              variant="h4"
              className="font-semibold text-gray-900 mb-0.5"
            >
              {stats.total}
            </Typography>
            <Typography variant="body2" className="text-gray-500 text-sm">
              {t("dashboard.totalContracts")}
            </Typography>
          </MuiCardContent>
        </StatsCard>

        <StatsCard>
          <MuiCardContent className="p-5">
            <Box className="flex items-start justify-between mb-3">
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
                <AlertCircle className="h-5 w-5" style={{ color: "#1d2b48" }} />
              </Box>
              <Typography
                variant="caption"
                className="text-gray-500 font-medium"
              >
                {stats.expiring30} em 30d
              </Typography>
            </Box>
            <Typography
              variant="h4"
              className="font-semibold text-gray-900 mb-0.5"
            >
              {stats.dueSoon}
            </Typography>
            <Typography variant="body2" className="text-gray-500 text-sm">
              {t("dashboard.expiringSoon")}
            </Typography>
          </MuiCardContent>
        </StatsCard>

        <StatsCard>
          <MuiCardContent className="p-5">
            <Box className="flex items-start justify-between mb-3">
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
                <AlertCircle className="h-5 w-5" style={{ color: "#1d2b48" }} />
              </Box>
              <Typography
                variant="caption"
                className="text-red-600 font-medium"
              >
                Atenção
              </Typography>
            </Box>
            <Typography
              variant="h4"
              className="font-semibold text-gray-900 mb-0.5"
            >
              {stats.expired}
            </Typography>
            <Typography variant="body2" className="text-gray-500 text-sm">
              {t("dashboard.expired")}
            </Typography>
          </MuiCardContent>
        </StatsCard>

        <StatsCard>
          <MuiCardContent className="p-5">
            <Box className="flex items-start justify-between mb-3">
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
                <DollarSign className="h-5 w-5" style={{ color: "#1d2b48" }} />
              </Box>
            </Box>
            <Typography
              variant="h5"
              className="font-semibold text-gray-900 mb-0.5"
            >
              {formatCurrency(
                stats.totalValue,
                org.currency as any,
                org.locale
              )}
            </Typography>
            <Typography variant="body2" className="text-gray-500 text-sm">
              {t("dashboard.totalValue")}
            </Typography>
          </MuiCardContent>
        </StatsCard>
      </div>

      {/* Recent Contracts */}
      <MuiCard
        sx={{
          borderRadius: 1,
          border: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Typography
                variant="h6"
                className="font-semibold text-gray-900 mb-1"
              >
                {t("dashboard.recentContracts")}
              </Typography>
              <Typography variant="body2" className="text-gray-500 text-sm">
                Últimos contratos adicionados ou atualizados
              </Typography>
            </div>
            <Link href={`/contracts/new`} className="w-full sm:w-auto">
              <Button
                variant="contained"
                size="small"
                sx={{
                  bgcolor: "#1d2b48",
                  "&:hover": {
                    bgcolor: "#b3efe5",
                    color: "#1d2b48",
                    border: "1px solid rgba(0, 0, 0, 0.2)",
                  },
                }}
                className="w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("contracts.new")}
              </Button>
            </Link>
          </div>
        </Box>
        <MuiCardContent className="p-6">
          {contracts.length === 0 ? (
            <div className="text-center py-16">
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: 2,
                  bgcolor: "#f9fafb",
                  border: "2px dashed #d1d5db",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                }}
              >
                <FileText className="h-9 w-9 text-gray-400" />
              </Box>
              <Typography
                variant="h6"
                sx={{
                  color: "#111827",
                  fontWeight: 600,
                  fontSize: "1.125rem",
                  mb: 1.5,
                }}
              >
                Nenhum contrato cadastrado
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "#6b7280",
                  fontSize: "0.9375rem",
                  mb: 4,
                }}
              >
                Comece criando seu primeiro contrato
              </Typography>
              <Link href={`/contracts/new`}>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#1d2b48",
                    fontSize: "0.9375rem",
                    fontWeight: 500,
                    px: 3,
                    py: 1.25,
                    textTransform: "none",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                    "&:hover": {
                      bgcolor: "#152038",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    },
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar contrato
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <Box
                  key={contract.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50/50 transition-all gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <Typography
                        variant="subtitle1"
                        className="font-medium text-gray-900 truncate"
                      >
                        {contract.title}
                      </Typography>
                      <Chip
                        label={t(
                          `status.${getStatusTranslationKey(
                            contract.status
                          )}` as any
                        )}
                        size="small"
                        variant="outlined"
                        color={
                          contract.status === "ACTIVE"
                            ? "success"
                            : contract.status === "DUE_SOON"
                            ? "warning"
                            : "error"
                        }
                        sx={{
                          fontWeight: 500,
                          fontSize: "0.75rem",
                          height: 22,
                        }}
                      />
                    </div>
                    <Typography
                      variant="body2"
                      className="text-gray-500 truncate mb-1 text-sm"
                    >
                      {contract.counterpartyName} •{" "}
                      {contract.owner.name || "N/A"}
                    </Typography>
                    {contract.nextRenewalDate && (
                      <Typography
                        variant="caption"
                        className="text-gray-400 text-xs"
                      >
                        Próxima renovação:{" "}
                        {formatDate(contract.nextRenewalDate, org?.locale)}
                      </Typography>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:text-right">
                    <Typography
                      variant="subtitle1"
                      className="font-semibold text-gray-900"
                    >
                      {formatCurrency(
                        Number(contract.valueAmount),
                        contract.currency as any,
                        org?.locale
                      )}
                    </Typography>
                    <Link href={`/contracts/${contract.id}`}>
                      <Button
                        variant="text"
                        size="small"
                        sx={{
                          color: "#1d2b48",
                          "&:hover": {
                            bgcolor: "#b3efe5",
                            color: "#1d2b48",
                            border: "1px solid rgba(0, 0, 0, 0.2)",
                          },
                        }}
                      >
                        {t("contracts.view")}
                      </Button>
                    </Link>
                  </div>
                </Box>
              ))}
              <div className="text-center pt-4 border-t border-gray-200">
                <Link href={`/contracts`}>
                  <Button
                    variant="text"
                    sx={{
                      color: "#1d2b48",
                      "&:hover": {
                        bgcolor: "#b3efe5",
                        color: "#1d2b48",
                        border: "1px solid rgba(0, 0, 0, 0.2)",
                      },
                    }}
                  >
                    Ver todos os contratos
                    <ArrowUpRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </MuiCardContent>
      </MuiCard>
    </div>
  );
}
