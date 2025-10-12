import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export { resend };

// Helper function to send emails
export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  return await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL || "contato@contratei.co",
    to,
    subject,
    html,
  });
}

// Email templates
export const emailTemplates = {
  welcome: {
    "pt-BR": {
      subject: "Bem-vindo ao Contratei!",
      getHtml: (name: string, orgName: string) => `
        <h1>Bem-vindo ao Contratei, ${name}!</h1>
        <p>Você foi adicionado à organização <strong>${orgName}</strong>.</p>
        <p>Comece a gerenciar seus contratos de forma eficiente.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Acessar Dashboard</a>
      `,
    },
    "en-US": {
      subject: "Welcome to Contratei!",
      getHtml: (name: string, orgName: string) => `
        <h1>Welcome to Contratei, ${name}!</h1>
        <p>You have been added to the organization <strong>${orgName}</strong>.</p>
        <p>Start managing your contracts efficiently.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard">Access Dashboard</a>
      `,
    },
  },
  invitation: {
    "pt-BR": {
      subject: "Convite para se juntar ao Contratei",
      getHtml: (inviterName: string, orgName: string, inviteUrl: string) => `
        <h1>Você foi convidado!</h1>
        <p><strong>${inviterName}</strong> convidou você para se juntar à organização <strong>${orgName}</strong> no Contratei.</p>
        <p>Gerencie contratos recorrentes de forma simples e eficiente.</p>
        <a href="${inviteUrl}">Aceitar Convite</a>
      `,
    },
    "en-US": {
      subject: "Invitation to join Contratei",
      getHtml: (inviterName: string, orgName: string, inviteUrl: string) => `
        <h1>You're invited!</h1>
        <p><strong>${inviterName}</strong> invited you to join the organization <strong>${orgName}</strong> on Contratei.</p>
        <p>Manage recurring contracts simply and efficiently.</p>
        <a href="${inviteUrl}">Accept Invitation</a>
      `,
    },
  },
  contractDueSoon: {
    "pt-BR": {
      subject: (days: number) => `Contrato vence em ${days} dias`,
      getHtml: (
        contractTitle: string,
        counterpartyName: string,
        dueDate: string,
        days: number
      ) => `
        <h1>⚠️ Contrato vence em breve</h1>
        <p>O contrato <strong>${contractTitle}</strong> com <strong>${counterpartyName}</strong> vence em <strong>${days} dias</strong>.</p>
        <p>Data de vencimento: ${dueDate}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts">Ver Contratos</a>
      `,
    },
    "en-US": {
      subject: (days: number) => `Contract due in ${days} days`,
      getHtml: (
        contractTitle: string,
        counterpartyName: string,
        dueDate: string,
        days: number
      ) => `
        <h1>⚠️ Contract due soon</h1>
        <p>The contract <strong>${contractTitle}</strong> with <strong>${counterpartyName}</strong> is due in <strong>${days} days</strong>.</p>
        <p>Due date: ${dueDate}</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts">View Contracts</a>
      `,
    },
  },
  contractExpired: {
    "pt-BR": {
      subject: "Contrato vencido",
      getHtml: (contractTitle: string, counterpartyName: string) => `
        <h1>🔴 Contrato vencido</h1>
        <p>O contrato <strong>${contractTitle}</strong> com <strong>${counterpartyName}</strong> venceu.</p>
        <p>Renovação ou ação imediata necessária.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts">Ver Contratos</a>
      `,
    },
    "en-US": {
      subject: "Contract expired",
      getHtml: (contractTitle: string, counterpartyName: string) => `
        <h1>🔴 Contract expired</h1>
        <p>The contract <strong>${contractTitle}</strong> with <strong>${counterpartyName}</strong> has expired.</p>
        <p>Renewal or immediate action required.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts">View Contracts</a>
      `,
    },
  },
  adjustmentDue: {
    "pt-BR": {
      subject: "Reajuste de contrato disponível",
      getHtml: (contractTitle: string, percentage: string) => `
        <h1>💰 Reajuste de contrato</h1>
        <p>O contrato <strong>${contractTitle}</strong> está apto para reajuste de <strong>${percentage}%</strong>.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts">Aplicar Reajuste</a>
      `,
    },
    "en-US": {
      subject: "Contract adjustment available",
      getHtml: (contractTitle: string, percentage: string) => `
        <h1>💰 Contract adjustment</h1>
        <p>The contract <strong>${contractTitle}</strong> is eligible for a <strong>${percentage}%</strong> adjustment.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/contracts">Apply Adjustment</a>
      `,
    },
  },
};

export type Locale = "pt-BR" | "en-US";
