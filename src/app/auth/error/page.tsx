"use client";

import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

const errorMessages: Record<string, { title: string; description: string }> = {
  Configuration: {
    title: "Erro de Configuração",
    description:
      "Há um problema na configuração do servidor. Entre em contato com o suporte.",
  },
  AccessDenied: {
    title: "Acesso Negado",
    description: "Você não tem permissão para acessar este recurso.",
  },
  Verification: {
    title: "Link Inválido ou Expirado",
    description:
      "Este link de login já foi usado ou expirou. Por favor, solicite um novo link.",
  },
  Default: {
    title: "Erro de Autenticação",
    description:
      "Ocorreu um erro ao tentar fazer login. Por favor, tente novamente.",
  },
};

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get("error") || "Default";

  const errorInfo = errorMessages[error] || errorMessages.Default;

  console.log("❌ Erro de autenticação:", error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">{errorInfo.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            {errorInfo.description}
          </p>

          {error === "Verification" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-semibold mb-2">💡 Dica:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Cada link só pode ser usado uma vez</li>
                <li>Links expiram em 24 horas</li>
                <li>Solicite um novo link se necessário</li>
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-2 mt-6">
            <Link href="/auth/signin">
              <Button className="w-full" size="lg">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Login
              </Button>
            </Link>

            {error === "Verification" && (
              <p className="text-center text-sm text-muted-foreground mt-4">
                Ao voltar para o login, digite seu email novamente para receber
                um novo link.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
