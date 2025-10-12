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
import { trackPlanChange } from "@/components/providers/posthog-provider";

export default function BillingPage() {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { orgId, org, isLoading: orgsLoading } = useOrgSelection();
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month"
  );

  const subscriptionQuery = trpc.billing.getSubscription.useQuery(
    { orgId: orgId || "" },
    { enabled: !!orgId }
  );
  const plansQuery = trpc.billing.getPlans.useQuery(
    { orgId: orgId || "" },
    { enabled: !!orgId }
  );

  // CRITICAL: All hooks must be called before any early returns
  const checkoutMutation = trpc.billing.createCheckoutSession.useMutation({
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
  });

  const portalMutation = trpc.billing.createPortalSession.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
    },
  });

  // Early returns after all hooks
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

  const handleUpgrade = async (plan: string, interval: string) => {
    // Track plan change
    if (org) {
      trackPlanChange(org.plan, plan, orgId);
    }

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
            {subscription && (
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                disabled={portalMutation.isPending}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Gerenciar Assinatura
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">
                Plano {org?.plan || "Free"}
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>
                    {org?.maxContracts && org.maxContracts >= 1000
                      ? "Contratos ilimitados"
                      : `${org?.maxContracts} contratos`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>
                    {org?.maxUsers && org.maxUsers >= 50
                      ? "Usuários ilimitados"
                      : `${org?.maxUsers} usuários`}
                  </span>
                </div>
              </div>
            </div>

            {subscription && (
              <div className="text-right">
                <Badge
                  variant={
                    subscription.cancelAtPeriodEnd ? "secondary" : "success"
                  }
                >
                  {subscription.cancelAtPeriodEnd ? "Cancelando" : "Ativo"}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Planos Disponíveis</h2>

        {/* Billing Interval Toggle */}
        <div className="flex justify-center gap-2 mb-6">
          <Button
            variant={billingInterval === "month" ? "default" : "outline"}
            onClick={() => setBillingInterval("month")}
            size="sm"
          >
            Mensal
          </Button>
          <Button
            variant={billingInterval === "year" ? "default" : "outline"}
            onClick={() => setBillingInterval("year")}
            size="sm"
          >
            Anual
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={plan.isCurrentPlan ? "border-primary" : ""}
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
                      (billingInterval === "month"
                        ? plan.price.monthly
                        : plan.price.yearly) / 100,
                      org?.currency as any,
                      org?.locale
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    por {billingInterval === "month" ? "mês" : "ano"}
                  </p>
                </div>

                <ul className="space-y-3 mb-6">
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {plan.maxContracts >= 999999
                        ? "Contratos ilimitados"
                        : `Até ${plan.maxContracts} contratos`}
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">
                      {plan.maxUsers >= 999999
                        ? "Usuários ilimitados"
                        : `Até ${plan.maxUsers} usuários`}
                    </span>
                  </li>
                  {(plan as any).features?.automaticAlerts && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Alertas automáticos</span>
                    </li>
                  )}
                  {(plan as any).features?.automaticRenewal && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Renovação automática</span>
                    </li>
                  )}
                  {(plan as any).features?.automaticAdjustments && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Reajustes automáticos</span>
                    </li>
                  )}
                  {(plan as any).features?.fileUpload && (
                    <li className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">Upload de arquivos</span>
                    </li>
                  )}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.isCurrentPlan ? "outline" : "default"}
                  disabled={plan.isCurrentPlan || checkoutMutation.isPending}
                  onClick={() => handleUpgrade(plan.id, billingInterval)}
                >
                  {plan.isCurrentPlan ? "Plano Atual" : "Selecionar Plano"}
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
