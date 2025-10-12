"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, CheckCircle } from "lucide-react";

export default function VerifyRequestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Verifique seu Email</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center mb-6">
            <Mail className="h-16 w-16 text-muted-foreground" />
          </div>

          <p className="text-muted-foreground">
            Um link de acesso foi enviado para seu email.
          </p>

          <p className="text-sm text-muted-foreground">
            Clique no link no email para entrar na sua conta. O link expira em
            24 horas.
          </p>

          <div className="bg-muted/50 p-4 rounded-lg text-left space-y-2 mt-6">
            <p className="text-sm font-medium">Não recebeu o email?</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Verifique sua pasta de spam</li>
              <li>• Confirme se o email está correto</li>
              <li>• Aguarde alguns minutos e tente novamente</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
