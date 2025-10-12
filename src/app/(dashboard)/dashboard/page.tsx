"use client";

import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc-client";
import { skipToken } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/use-translation";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  FileText,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { DashboardPageWrapper } from "@/components/layout/dashboard-page-wrapper";

export default function DashboardPage() {
  return (
    <DashboardPageWrapper>
      {({ orgId, org }) => <DashboardContent orgId={orgId} org={org} />}
    </DashboardPageWrapper>
  );
}

function DashboardContent({ orgId, org }: { orgId: string; org: any }) {
  const { data: session } = useSession();
  const { t, locale } = useTranslation();

  // Get dashboard stats
  const statsQuery = trpc.contract.getDashboardStats.useQuery(
    orgId && orgId.trim() ? { orgId } : skipToken
  );

  // Get recent contracts
  const contractsQuery = trpc.contract.list.useQuery(
    orgId && orgId.trim() ? { orgId, limit: 5 } : skipToken
  );

  const stats = statsQuery.data;
  const contracts = contractsQuery.data?.contracts || [];

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {t("dashboard.welcome")},{" "}
          {session?.user?.name?.split(" ")[0] || "User"}!
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mt-1">
          Aqui está um resumo dos seus contratos.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-6 md:mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalContracts")}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.active || 0} {t("status.active").toLowerCase()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.expiringSoon")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.dueSoon || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.expiring30 || 0} em 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.expired")}
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {stats?.expired || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requer atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t("dashboard.totalValue")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                stats?.totalValue || 0,
                org?.currency as any,
                org?.locale
              )}
            </div>
            <p className="text-xs text-muted-foreground">Contratos ativos</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Contracts */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg md:text-xl">
                {t("dashboard.recentContracts")}
              </CardTitle>
              <CardDescription className="text-sm">
                Últimos contratos adicionados ou atualizados
              </CardDescription>
            </div>
            <Link href="/contracts/new" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                {t("contracts.new")}
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Você ainda não tem contratos cadastrados.
              </p>
              <Link href="/contracts/new">
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar primeiro contrato
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3 md:space-y-4">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg hover:bg-accent/50 transition-colors gap-3 sm:gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm md:text-base truncate">
                        {contract.title}
                      </h3>
                      <Badge
                        variant={
                          contract.status === "ACTIVE"
                            ? "success"
                            : contract.status === "DUE_SOON"
                            ? "warning"
                            : "destructive"
                        }
                        className="text-xs"
                      >
                        {t(`status.${contract.status.toLowerCase()}` as any)}
                      </Badge>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {contract.supplierName} • {contract.owner.name}
                    </p>
                    {contract.nextRenewalDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Próxima renovação:{" "}
                        {formatDate(contract.nextRenewalDate, org?.locale)}
                      </p>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:text-right">
                    <p className="font-semibold text-sm md:text-base">
                      {formatCurrency(
                        Number(contract.valueAmount),
                        contract.currency as any,
                        org?.locale
                      )}
                    </p>
                    <Link href={`/contracts/${contract.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs md:text-sm"
                      >
                        {t("contracts.view")}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              <div className="text-center pt-4">
                <Link href="/contracts">
                  <Button variant="outline" className="w-full sm:w-auto">
                    Ver todos os contratos
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
