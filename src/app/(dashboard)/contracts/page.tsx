"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { skipToken } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useTranslation } from "@/lib/use-translation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Plus, Search, Filter, Download } from "lucide-react";
import Link from "next/link";
import { Select } from "@/components/ui/select";
import { DashboardPageWrapper } from "@/components/layout/dashboard-page-wrapper";

export default function ContractsPage() {
  return (
    <DashboardPageWrapper>
      {({ orgId, org }) => <ContractsContent orgId={orgId} org={org} />}
    </DashboardPageWrapper>
  );
}

function ContractsContent({ orgId, org }: { orgId: string; org: any }) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const contractsQuery = trpc.contract.list.useQuery(
    orgId && orgId.trim()
      ? {
          orgId,
          search: search || undefined,
          status:
            statusFilter && statusFilter.trim()
              ? (statusFilter as any)
              : undefined,
        }
      : skipToken
  );

  const contracts = contractsQuery.data?.contracts || [];

  const exportCSV = () => {
    const headers = [
      "Título",
      "Fornecedor",
      "Responsável",
      "Valor",
      "Status",
      "Próxima Renovação",
    ];
    const rows = contracts.map((c) => [
      c.title,
      c.supplierName,
      c.owner.name || "",
      c.valueAmount.toString(),
      c.status,
      c.nextRenewalDate ? new Date(c.nextRenewalDate).toLocaleDateString() : "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contratos-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="p-4 md:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {t("contracts.title")}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Gerencie todos os seus contratos recorrentes
          </p>
        </div>
        <Link href="/contracts/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            {t("contracts.new")}
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("form.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="">Todos os status</option>
          <option value="ACTIVE">Ativo</option>
          <option value="DUE_SOON">Vence em Breve</option>
          <option value="EXPIRED">Vencido</option>
          <option value="CANCELED">Cancelado</option>
        </Select>
        <Button
          variant="outline"
          onClick={exportCSV}
          className="w-full sm:w-auto"
        >
          <Download className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">{t("form.export")}</span>
          <span className="sm:hidden">CSV</span>
        </Button>
      </div>

      {/* Table - Desktop View */}
      <div className="hidden md:block border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("contracts.title")}</TableHead>
              <TableHead>{t("contracts.supplier")}</TableHead>
              <TableHead>{t("contracts.owner")}</TableHead>
              <TableHead>{t("contracts.value")}</TableHead>
              <TableHead>{t("contracts.status")}</TableHead>
              <TableHead>{t("contracts.nextRenewal")}</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    Nenhum contrato encontrado.
                  </p>
                  <Link href="/contracts/new">
                    <Button variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Criar primeiro contrato
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.title}
                  </TableCell>
                  <TableCell>{contract.supplierName}</TableCell>
                  <TableCell>{contract.owner.name}</TableCell>
                  <TableCell>
                    {formatCurrency(
                      Number(contract.valueAmount),
                      contract.currency as any,
                      org?.locale
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contract.status === "ACTIVE"
                          ? "success"
                          : contract.status === "DUE_SOON"
                          ? "warning"
                          : contract.status === "EXPIRED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {t(`status.${contract.status.toLowerCase()}` as any)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contract.nextRenewalDate
                      ? formatDate(contract.nextRenewalDate, org?.locale)
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/contracts/${contract.id}`}>
                      <Button variant="ghost" size="sm">
                        {t("contracts.view")}
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {contracts.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <p className="text-sm text-muted-foreground mb-4">
              Nenhum contrato encontrado.
            </p>
            <Link href="/contracts/new">
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro contrato
              </Button>
            </Link>
          </div>
        ) : (
          contracts.map((contract) => (
            <div key={contract.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">
                    {contract.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {contract.supplierName}
                  </p>
                </div>
                <Badge
                  variant={
                    contract.status === "ACTIVE"
                      ? "success"
                      : contract.status === "DUE_SOON"
                      ? "warning"
                      : contract.status === "EXPIRED"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs shrink-0"
                >
                  {t(`status.${contract.status.toLowerCase()}` as any)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Responsável</p>
                  <p className="font-medium mt-1">{contract.owner.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium mt-1">
                    {formatCurrency(
                      Number(contract.valueAmount),
                      contract.currency as any,
                      org?.locale
                    )}
                  </p>
                </div>
              </div>

              {contract.nextRenewalDate && (
                <div className="text-xs">
                  <p className="text-muted-foreground">Próxima Renovação</p>
                  <p className="font-medium mt-1">
                    {formatDate(contract.nextRenewalDate, org?.locale)}
                  </p>
                </div>
              )}

              <Link href={`/contracts/${contract.id}`} className="block">
                <Button variant="outline" size="sm" className="w-full">
                  {t("contracts.view")}
                </Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
