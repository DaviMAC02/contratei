import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc-client";
import { Suspense } from "react";
import { PostHogPageview } from "@/components/providers/posthog-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { NavigationProgress } from "@/components/providers/navigation-progress";
import { ToastProvider } from "@/components/providers/toast-provider";
import { ErrorBoundary } from "@/components/shared/error-boundary";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Contratei - Gerenciador de Contratos Recorrentes",
  description: "Gerencie seus contratos recorrentes com facilidade",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} ${inter.variable}`}>
        <ThemeProvider>
          <TRPCProvider>
            <ToastProvider>
              <ErrorBoundary>
                <NavigationProgress />
                <Suspense fallback={null}>
                  <PostHogPageview />
                </Suspense>
                {children}
              </ErrorBoundary>
            </ToastProvider>
          </TRPCProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
