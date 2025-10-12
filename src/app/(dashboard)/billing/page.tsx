"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc-client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslation } from "@/lib/use-translation";
import { formatCurrency } from "@/lib/utils";
import {
  Check,
  CreditCard,
  Users,
  FileText,
  Zap,
  ExternalLink,
} from "lucide-react";
import { useOrgSelection } from "@/hooks/use-org-selection";

export default function BillingPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { orgId, org, isLoading: orgsLoading } = useOrgSelection();

  const subscriptionQuery = trpc.billing.getSubscription.useQuery(
    { orgId: orgId || "" },
    { enabled: !!orgId }
  );
  const plansQuery = trpc.billing.getPlans.useQuery(
    { orgId: orgId || "" },
    { enabled: !!orgId }
  );

  if (orgsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading your organization...</p>
        </div>
      </div>
    );
  }

  if (!orgId || orgId === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
  });

  const handleUpgrade = async (plan: string, interval: string) => {
    await checkoutMutation.mutateAsync({
      orgId,
      plan: plan as any,
      interval: interval as any,
    });
  };

  const handleManageSubscription = async () => {
    await portalMutation.mutateAsync({ orgId });
  };

  const subscription = subscriptionQuery.data;
  const plans = plansQuery.data || [];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {t("nav.billing")}
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie seu plano e assinatura
        </p>
      </div>

      {/* Current Plan */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plano Atual</CardTitle>
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={portalMutation.isLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Gerenciar Assinatura
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Plano {subscription?.planName || "Free"}
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>
                    {org?.maxContracts === -1
                      ? "Contratos ilimitados"
                      : `${org?.maxContracts} contratos`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {org?.maxUsers === -1
                      ? "Usuários ilimitados"
                      : `${org?.maxUsers} usuários`}
                  </span>
                </div>
              </div>
            </div>

            {subscription && (
              <div className="text-right">
                <div className="text-2xl font-bold mb-2">
                  {formatCurrency(
                    subscription.amount / 100,
                    org?.currency as any,
                    org?.locale
                  )}
                  <span className="text-sm text-muted-foreground">
                    /{subscription.interval === "month" ? "mês" : "ano"}
                  </span>
                </div>
                <Badge
                  variant={
                    subscription.status === "active" ? "success" : "secondary"
                  }
                >
                  {subscription.status}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Planos Disponíveis</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.priceId}
              className={
                subscription?.priceId === plan.priceId ? "border-primary" : ""
              }
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                  {plan.name === "Pro" && (
                    <Badge variant="default">
                      <Zap className="h-3 w-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="text-3xl font-bold mb-2">
                    {formatCurrency(
                      plan.amount / 100,
                      plan.currency as any,
                      org?.locale
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    por {plan.interval === "month" ? "mês" : "ano"}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {plan.maxContracts === -1
                        ? "Contratos ilimitados"
                        : `Até ${plan.maxContracts} contratos`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {plan.maxUsers === -1
                        ? "Usuários ilimitados"
                        : `Até ${plan.maxUsers} usuários`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Alertas automáticos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">Renovação automática</span>
                  </li>
                  {plan.name !== "Starter" && (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Reajustes automáticos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Upload de arquivos</span>
                      </li>
                    </>
                  )}
                  {plan.name === "Enterprise" && (
                    <>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">Suporte prioritário</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">API personalizada</span>
                      </li>
                    </>
                  )}
                </ul>

                <Button
                  className="w-full"
                  variant={
                    subscription?.priceId === plan.priceId
                      ? "outline"
                      : "default"
                  }
                  disabled={
                    subscription?.priceId === plan.priceId ||
                    checkoutMutation.isLoading
                  }
                  onClick={() => handleUpgrade(plan.priceId)}
                >
                  {subscription?.priceId === plan.priceId
                    ? "Plano Atual"
                    : "Selecionar Plano"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Perguntas Frequentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">
              Posso cancelar a qualquer momento?
            </h4>
            <p className="text-sm text-muted-foreground">
              Sim! Você pode cancelar sua assinatura a qualquer momento através
              do portal de gerenciamento. Seu acesso continuará até o fim do
              período pago.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">
              O que acontece se eu exceder os limites?
            </h4>
            <p className="text-sm text-muted-foreground">
              Você será notificado e poderá fazer upgrade do seu plano. Não há
              cobranças surpresa.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Posso mudar de plano?</h4>
            <p className="text-sm text-muted-foreground">
              Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer
              momento. O valor será ajustado proporcionalmente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
