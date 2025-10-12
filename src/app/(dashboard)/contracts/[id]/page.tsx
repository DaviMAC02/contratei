"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ArrowLeft,
  Edit,
  Trash2,
  RefreshCw,
  TrendingUp,
  FileText,
  Upload,
  Download,
} from "lucide-react";
import Link from "next/link";

export default function ContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, locale } = useTranslation();
  const [orgId, setOrgId] = useState<string>("");

  const contractId = params.id as string;

  const orgsQuery = trpc.org.list.useQuery();

  useEffect(() => {
    if (orgsQuery.data && orgsQuery.data.length > 0) {
      setOrgId(orgsQuery.data[0].id);
    }
  }, [orgsQuery.data]);

  const contractQuery = trpc.contract.get.useQuery(
    { orgId, id: contractId },
    { enabled: !!orgId }
  );

  const filesQuery = trpc.file.listFiles.useQuery(
    { orgId, contractId },
    { enabled: !!orgId }
  );

  const renewMutation = trpc.contract.renew.useMutation({
    onSuccess: () => {
      contractQuery.refetch();
    },
  });

  const deleteMutation = trpc.contract.delete.useMutation({
    onSuccess: () => {
      router.push("/contracts");
    },
  });

  const handleRenew = async () => {
    if (confirm("Deseja renovar este contrato?")) {
      await renewMutation.mutateAsync({ orgId, id: contractId });
    }
  };

  const handleDelete = async () => {
    if (
      confirm(
        "Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita."
      )
    ) {
      await deleteMutation.mutateAsync({ orgId, id: contractId });
    }
  };

  if (!orgId || contractQuery.isLoading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!contractQuery.data) {
    return <div className="p-8">Contrato não encontrado.</div>;
  }

  const contract = contractQuery.data;
  const files = filesQuery.data || [];
  const org = orgsQuery.data?.[0];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6">
        <Link href="/contracts">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
      </div>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {contract.title}
            </h1>
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
          </div>
          <p className="text-muted-foreground">{contract.supplierName}</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRenew}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t("contracts.renew")}
          </Button>
          <Link href={`/contracts/${contractId}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              {t("contracts.edit")}
            </Button>
          </Link>
          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4 mr-2" />
            {t("contracts.delete")}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {/* Contract Details */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Contrato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Responsável:</span>
              <span className="font-medium">{contract.owner.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor:</span>
              <span className="font-medium">
                {formatCurrency(
                  Number(contract.valueAmount),
                  contract.currency as any,
                  org?.locale
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data de Início:</span>
              <span>{formatDate(contract.startDate, org?.locale)}</span>
            </div>
            {contract.endDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data de Término:</span>
                <span>{formatDate(contract.endDate, org?.locale)}</span>
              </div>
            )}
            {contract.nextRenewalDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  Próxima Renovação:
                </span>
                <span>{formatDate(contract.nextRenewalDate, org?.locale)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Periodicidade:</span>
              <span>
                {t(`periodicity.${contract.periodicity.toLowerCase()}` as any)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Renovação Automática:
              </span>
              <span>{contract.autoRenew ? "Sim" : "Não"}</span>
            </div>
            {contract.costCenter && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Centro de Custo:</span>
                <span>{contract.costCenter}</span>
              </div>
            )}
            {contract.tags.length > 0 && (
              <div>
                <span className="text-muted-foreground mb-2 block">Tags:</span>
                <div className="flex flex-wrap gap-2">
                  {contract.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Supplier Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Fornecedor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nome:</span>
              <span className="font-medium">{contract.supplierName}</span>
            </div>
            {contract.supplierContact && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Contato:</span>
                <span>{contract.supplierContact}</span>
              </div>
            )}
            {contract.notes && (
              <div>
                <span className="text-muted-foreground mb-2 block">
                  Observações:
                </span>
                <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Files */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t("contracts.files")}</CardTitle>
            <Button size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Upload Arquivo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum arquivo anexado
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Upload em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                  <TableRow key={file.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {file.fileName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{file.fileType}</Badge>
                    </TableCell>
                    <TableCell>
                      {(file.sizeBytes / 1024).toFixed(0)} KB
                    </TableCell>
                    <TableCell>
                      {formatDate(file.uploadedAt, org?.locale)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Adjustments History */}
      {contract.adjustments.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("contracts.adjustments")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Valor Anterior</TableHead>
                  <TableHead>Novo Valor</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell>
                      {formatDate(adj.adjustmentDate, org?.locale)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        Number(adj.oldValue),
                        contract.currency as any,
                        org?.locale
                      )}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(
                        Number(adj.newValue),
                        contract.currency as any,
                        org?.locale
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{adj.percentage}%</Badge>
                    </TableCell>
                    <TableCell>{adj.reason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Renewal History */}
      {contract.renewalHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("contracts.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data de Renovação</TableHead>
                  <TableHead>Término Anterior</TableHead>
                  <TableHead>Novo Término</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contract.renewalHistory.map((renewal) => (
                  <TableRow key={renewal.id}>
                    <TableCell>
                      {formatDate(renewal.renewalDate, org?.locale)}
                    </TableCell>
                    <TableCell>
                      {formatDate(renewal.previousEndDate, org?.locale)}
                    </TableCell>
                    <TableCell>
                      {formatDate(renewal.newEndDate, org?.locale)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
