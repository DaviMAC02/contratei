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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Bem-vindo ao Contratei</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">Você foi adicionado à organização ${orgName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Olá ${
                        name?.split(" ")[0] || ""
                      }, comece a gerenciar seus contratos de forma eficiente.</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/dashboard" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">Acessar Dashboard</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. Todos os direitos reservados.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Gestão inteligente de contratos</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
    "en-US": {
      subject: "Welcome to Contratei!",
      getHtml: (name: string, orgName: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Welcome to Contratei</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">You've been added to ${orgName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Hi ${
                        name?.split(" ")[0] || ""
                      }, start managing your contracts efficiently.</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/dashboard" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">Access Dashboard</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. All rights reserved.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Smart contract management</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
  },
  invitation: {
    "pt-BR": {
      subject: "Convite para se juntar ao Contratei",
      getHtml: (inviterName: string, orgName: string, inviteUrl: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Você foi convidado!</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">${inviterName} convidou você para ${orgName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Gerencie contratos recorrentes de forma simples e eficiente.</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${inviteUrl}" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">Aceitar Convite</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. Todos os direitos reservados.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Gestão inteligente de contratos</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
    "en-US": {
      subject: "Invitation to join Contratei",
      getHtml: (inviterName: string, orgName: string, inviteUrl: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">You're invited!</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">${inviterName} invited you to ${orgName}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">Manage recurring contracts simply and efficiently.</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${inviteUrl}" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">Accept Invitation</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. All rights reserved.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Smart contract management</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Contrato vencendo em ${days} dias</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">Aja com antecedência e evite imprevistos</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">O contrato <strong>${contractTitle}</strong> com <strong>${counterpartyName}</strong> vence em <strong>${days} dias</strong>.</p>
                      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; margin: 16px 0;">
                        <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;"><strong>Data de vencimento:</strong> ${dueDate}</p>
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/contracts" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">Ver Contratos</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. Todos os direitos reservados.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Gestão inteligente de contratos</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
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
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Contract due in ${days} days</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">Act early and avoid surprises</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">The contract <strong>${contractTitle}</strong> with <strong>${counterpartyName}</strong> is due in <strong>${days} days</strong>.</p>
                      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; margin: 16px 0;">
                        <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;"><strong>Due date:</strong> ${dueDate}</p>
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/contracts" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">View Contracts</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. All rights reserved.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Smart contract management</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
  },
  contractExpired: {
    "pt-BR": {
      subject: "Contrato vencido",
      getHtml: (contractTitle: string, counterpartyName: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #7f1d1d; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Contrato vencido</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">Ação imediata pode ser necessária</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">O contrato <strong>${contractTitle}
                      </strong> com <strong>${counterpartyName}</strong> venceu.</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/contracts" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">Ver Contratos</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. Todos os direitos reservados.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Gestão inteligente de contratos</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
    "en-US": {
      subject: "Contract expired",
      getHtml: (contractTitle: string, counterpartyName: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #7f1d1d; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Contract expired</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">Immediate action may be required</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">The contract <strong>${contractTitle}
                      </strong> with <strong>${counterpartyName}</strong> has expired.</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/contracts" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">View Contracts</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. All rights reserved.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Smart contract management</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
  },
  adjustmentDue: {
    "pt-BR": {
      subject: "Reajuste de contrato disponível",
      getHtml: (contractTitle: string, percentage: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Reajuste de contrato</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">Contrato apto para reajuste de ${percentage}%</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">O contrato <strong>${contractTitle}</strong> está apto para reajuste.</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/contracts" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">Aplicar Reajuste</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. Todos os direitos reservados.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Gestão inteligente de contratos</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
    "en-US": {
      subject: "Contract adjustment available",
      getHtml: (contractTitle: string, percentage: string) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img src="https://davicmartini.sirv.com/Images/logo.png" alt="Contratei" style="height: 56px; max-width: 240px; display: block; margin: 0 auto;" />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">Contract adjustment</h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">Eligible for ${percentage}% adjustment</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">The contract <strong>${contractTitle}</strong> is eligible for an adjustment.</p>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/contracts" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">Apply Adjustment</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">© ${new Date().getFullYear()} Contratei. All rights reserved.</p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">Smart contract management</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
  },
  adjustmentApplied: {
    "pt-BR": {
      subject: "Reajuste de contrato aplicado",
      getHtml: (
        contractTitle: string,
        percentage: string,
        previousValue: string,
        newValue: string
      ) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset=\"UTF-8\">
          <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
        </head>
        <body style=\"margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\">
          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f5f5f5; padding: 40px 20px;\">
            <tr>
              <td align=\"center\">
                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;\">
                  <tr>
                    <td style=\"background-color: #1d2b48; padding: 48px 40px; text-align: center;\">
                      <div style=\"margin-bottom: 24px;\">
                        <div style=\"background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\">
                          <img src=\"https://davicmartini.sirv.com/Images/logo.png\" alt=\"Contratei\" style=\"height: 56px; max-width: 240px; display: block; margin: 0 auto;\" />
                        </div>
                      </div>
                      <h2 style=\"color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;\">Reajuste aplicado</h2>
                      <p style=\"color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;\">${percentage}% aplicado automaticamente</p>
                    </td>
                  </tr>
                  <tr>
                    <td style=\"padding: 48px 40px;\">
                      <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;\">O contrato <strong>${contractTitle}</strong> teve reajuste automático aplicado.</p>
                      <div style=\"background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; margin: 16px 0;\">
                        <p style=\"color: #374151; font-size: 14px; margin: 0; line-height: 1.6;\">
                          <strong>Valor anterior:</strong> ${previousValue}<br/>
                          <strong>Novo valor:</strong> ${newValue}
                        </p>
                      </div>
                      <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">
                        <tr>
                          <td align=\"center\" style=\"padding: 8px 0 32px 0;\">
                            <a href=\"${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/contracts\" style=\"display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);\">Ver contrato</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style=\"background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;\">
                      <p style=\"color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;\">© ${new Date().getFullYear()} Contratei. Todos os direitos reservados.</p>
                      <p style=\"color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;\">Gestão inteligente de contratos</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
    "en-US": {
      subject: "Contract adjustment applied",
      getHtml: (
        contractTitle: string,
        percentage: string,
        previousValue: string,
        newValue: string
      ) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset=\"UTF-8\">
          <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
        </head>
        <body style=\"margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;\">
          <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #f5f5f5; padding: 40px 20px;\">
            <tr>
              <td align=\"center\">
                <table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;\">
                  <tr>
                    <td style=\"background-color: #1d2b48; padding: 48px 40px; text-align: center;\">
                      <div style=\"margin-bottom: 24px;\">
                        <div style=\"background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\">
                          <img src=\"https://davicmartini.sirv.com/Images/logo.png\" alt=\"Contratei\" style=\"height: 56px; max-width: 240px; display: block; margin: 0 auto;\" />
                        </div>
                      </div>
                      <h2 style=\"color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;\">Adjustment applied</h2>
                      <p style=\"color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;\">${percentage}% applied automatically</p>
                    </td>
                  </tr>
                  <tr>
                    <td style=\"padding: 48px 40px;\">
                      <p style=\"color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;\">The contract <strong>${contractTitle}</strong> had an automatic adjustment applied.</p>
                      <div style=\"background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; margin: 16px 0;\">
                        <p style=\"color: #374151; font-size: 14px; margin: 0; line-height: 1.6;\">
                          <strong>Previous value:</strong> ${previousValue}<br/>
                          <strong>New value:</strong> ${newValue}
                        </p>
                      </div>
                      <table width=\"100%\" cellpadding=\"0\" cellspacing=\"0\">
                        <tr>
                          <td align=\"center\" style=\"padding: 8px 0 32px 0;\">
                            <a href=\"${
                              process.env.NEXT_PUBLIC_APP_URL
                            }/contracts\" style=\"display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);\">View contract</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  <tr>
                    <td style=\"background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;\">
                      <p style=\"color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;\">© ${new Date().getFullYear()} Contratei. All rights reserved.</p>
                      <p style=\"color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;\">Smart contract management</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
  },
  renewalReminder: {
    "pt-BR": {
      subject: () => "Contrato renovado automaticamente",
      getHtml: (
        contractTitle: string,
        previousEndDate: Date | string,
        newEndDate: Date | string,
        contractUrl: string
      ) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img 
                            src="https://davicmartini.sirv.com/Images/logo.png" 
                            alt="Contratei" 
                            style="height: 56px; max-width: 240px; display: block; margin: 0 auto;"
                          />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">
                        Contrato renovado automaticamente
                      </h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">
                        O acompanhamento de contratos trabalhou por você
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                        O contrato <strong>${contractTitle}</strong> foi renovado automaticamente.
                      </p>
                      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; margin: 16px 0;">
                        <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;">
                          <strong>Data de vencimento anterior:</strong> ${new Date(
                            previousEndDate
                          ).toLocaleDateString("pt-BR")}<br/>
                          <strong>Nova data de vencimento:</strong> ${new Date(
                            newEndDate
                          ).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${contractUrl}" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">
                              Ver contrato
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                        Caso a renovação automática não seja mais desejada, você pode alterar as configurações deste contrato.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
                        © ${new Date().getFullYear()} Contratei. Todos os direitos reservados.
                      </p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                        Gestão inteligente de contratos
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
    "en-US": {
      subject: () => "Contract renewed automatically",
      getHtml: (
        contractTitle: string,
        previousEndDate: Date | string,
        newEndDate: Date | string,
        contractUrl: string
      ) => `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05); overflow: hidden;">
                  <tr>
                    <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                      <div style="margin-bottom: 24px;">
                        <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                          <img 
                            src="https://davicmartini.sirv.com/Images/logo.png" 
                            alt="Contratei" 
                            style="height: 56px; max-width: 240px; display: block; margin: 0 auto;"
                          />
                        </div>
                      </div>
                      <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">
                        Contract renewed automatically
                      </h2>
                      <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">
                        Contract tracking worked for you
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 48px 40px;">
                      <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 16px 0;">
                        The contract <strong>${contractTitle}</strong> was renewed automatically.
                      </p>
                      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px 20px; margin: 16px 0;">
                        <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.6;">
                          <strong>Previous due date:</strong> ${new Date(
                            previousEndDate
                          ).toLocaleDateString("en-US")}<br/>
                          <strong>New due date:</strong> ${new Date(
                            newEndDate
                          ).toLocaleDateString("en-US")}
                        </p>
                      </div>
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center" style="padding: 8px 0 32px 0;">
                            <a href="${contractUrl}" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">
                              View contract
                            </a>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                        If automatic renewal is no longer desired, you can change this contract's settings.
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="background-color: #f9fafb; padding: 32px 40px; border-top: 1px solid #e5e7eb;">
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0 0 8px 0; text-align: center;">
                        © ${new Date().getFullYear()} Contratei. All rights reserved.
                      </p>
                      <p style="color: #9ca3af; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                        Smart contract management
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    },
  },
};

export type Locale = "pt-BR" | "en-US";
