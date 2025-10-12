import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCProvider } from "@/lib/trpc-client";

const inter = Inter({ subsets: ["latin"] });

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
      <body className={inter.className}>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
