import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { Resend } from "resend";
import { TRPCError } from "@trpc/server";

export const supportRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(
      z.object({
        subject: z.string().min(1, "Assunto é obrigatório"),
        message: z.string().min(1, "Mensagem é obrigatória"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { session } = ctx;
      const { subject, message } = input;

      if (!session?.user?.email) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Você precisa estar autenticado para enviar uma mensagem",
        });
      }

      try {
        const resend = new Resend(process.env.RESEND_API_KEY!);

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "contato@contratei.co",
          to: "contato@contratei.co",
          reply_to: session.user.email,
          subject: `[Suporte] ${subject}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); overflow: hidden;">
                      
                      <!-- Header com logo -->
                      <tr>
                        <td style="background-color: #1d2b48; padding: 40px 40px 36px 40px; text-align: center;">
                          <div style="margin-bottom: 24px;">
                            <img src="https://davicmartini.sirv.com/Images/logo.png" 
                                 alt="CONTRATEI" 
                                 style="height: 56px; max-width: 200px; display: block; margin: 0 auto;"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" />
                            <div style="background-color: #ffffff; display: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                              <span style="color: #1d2b48; font-size: 28px; font-weight: 800; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                CONTRATEI
                              </span>
                            </div>
                          </div>
                          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; line-height: 1.3;">
                            Nova Solicitação de Suporte
                          </h1>
                          <p style="color: rgba(255, 255, 255, 0.8); margin: 8px 0 0 0; font-size: 14px;">
                            Um usuário precisa da sua ajuda
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Barra de destaque -->
                      <tr>
                        <td style="background-color: #b4efe5; height: 4px; padding: 0;"></td>
                      </tr>
                      
                      <!-- Conteúdo principal -->
                      <tr>
                        <td style="padding: 40px;">
                          
                          <!-- Card de informações do usuário -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 10px; border: 2px solid #e5e7eb; margin-bottom: 32px;">
                            <tr>
                              <td style="padding: 24px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="padding-bottom: 20px;">
                                      <div style="display: inline-block; background-color: #1d2b48; padding: 6px 14px; border-radius: 6px;">
                                        <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;">
                                          Dados do Solicitante
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding: 0;">
                                      <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                          <td width="80" style="vertical-align: top; padding: 8px 0;">
                                            <span style="color: #374151; font-size: 13px; font-weight: 700;">Nome:</span>
                                          </td>
                                          <td style="vertical-align: top; padding: 8px 0;">
                                            <span style="color: #1f2937; font-size: 15px; font-weight: 600;">
                                              ${
                                                session.user?.name ||
                                                "Não informado"
                                              }
                                            </span>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td width="80" style="vertical-align: top; padding: 8px 0;">
                                            <span style="color: #374151; font-size: 13px; font-weight: 700;">Email:</span>
                                          </td>
                                          <td style="vertical-align: top; padding: 8px 0;">
                                            <a href="mailto:${
                                              session.user.email
                                            }" style="color: #1d2b48; font-size: 15px; font-weight: 600; text-decoration: none; border-bottom: 2px solid #1d2b48;">
                                              ${session.user.email}
                                            </a>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td width="80" style="vertical-align: top; padding: 8px 0;">
                                            <span style="color: #374151; font-size: 13px; font-weight: 700;">Assunto:</span>
                                          </td>
                                          <td style="vertical-align: top; padding: 8px 0;">
                                            <span style="color: #1f2937; font-size: 15px; font-weight: 600;">
                                              ${subject}
                                            </span>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td width="80" style="vertical-align: top; padding: 8px 0;">
                                            <span style="color: #374151; font-size: 13px; font-weight: 700;">Data:</span>
                                          </td>
                                          <td style="vertical-align: top; padding: 8px 0;">
                                            <span style="color: #6b7280; font-size: 14px;">
                                              ${new Date().toLocaleString(
                                                "pt-BR",
                                                {
                                                  dateStyle: "long",
                                                  timeStyle: "short",
                                                }
                                              )}
                                            </span>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Mensagem do usuário -->
                          <div style="margin-bottom: 32px;">
                            <div style="background-color: #1d2b48; display: inline-block; padding: 6px 14px; border-radius: 6px; margin-bottom: 16px;">
                              <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase;">
                                Mensagem do Usuário
                              </span>
                            </div>
                            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-left: 4px solid #1d2b48; border-radius: 8px; padding: 24px;">
                              <p style="color: #1f2937; font-size: 15px; line-height: 1.8; margin: 0; white-space: pre-wrap; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
${message}
                              </p>
                            </div>
                          </div>
                          
                          <!-- Call to Action -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                            <tr>
                              <td align="center" style="padding: 20px 0;">
                                <a href="mailto:${
                                  session.user.email
                                }?subject=Re: ${encodeURIComponent(subject)}" 
                                   style="display: inline-block; 
                                          background-color: #1d2b48; 
                                          color: #ffffff; 
                                          text-decoration: none; 
                                          padding: 16px 40px; 
                                          border-radius: 8px; 
                                          font-weight: 700; 
                                          font-size: 15px; 
                                          letter-spacing: 0.3px;
                                          box-shadow: 0 4px 14px rgba(29, 43, 72, 0.4);">
                                  Responder Usuário
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <!-- Informação de resposta rápida -->
                          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-left: 4px solid #b4efe5; border-radius: 8px;">
                            <tr>
                              <td style="padding: 18px 20px;">
                                <table width="100%" cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td width="40" style="vertical-align: middle; padding-right: 12px;">
                                      <table cellpadding="0" cellspacing="0" width="32" height="32" style="background-color: #1d2b48; border-radius: 50%;">
                                        <tr>
                                          <td align="center" valign="middle">
                                            <span style="color: #ffffff; font-size: 16px; font-weight: bold; line-height: 32px;">i</span>
                                          </td>
                                        </tr>
                                      </table>
                                    </td>
                                    <td style="vertical-align: middle;">
                                      <p style="color: #374151; font-size: 13px; line-height: 1.6; margin: 0; font-weight: 500;">
                                        <strong>Resposta Direta:</strong> Este email está configurado para resposta direta. 
                                        Basta clicar em "Responder" para enviar sua mensagem ao usuário.
                                      </p>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>
                          </table>
                          
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 28px 40px; border-top: 1px solid #e5e7eb;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td align="center">
                                <p style="color: #6b7280; font-size: 12px; line-height: 1.6; margin: 0 0 6px 0;">
                                  © ${new Date().getFullYear()} <strong>Contratei</strong> - Gestão Inteligente de Contratos
                                </p>
                                <p style="color: #9ca3af; font-size: 11px; line-height: 1.5; margin: 0;">
                                  Esta mensagem foi enviada automaticamente pelo sistema de suporte
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `,
          text: `
╔═══════════════════════════════════════════════════════════╗
║                       CONTRATEI                           ║
║           Nova Solicitação de Suporte                     ║
╚═══════════════════════════════════════════════════════════╝

DADOS DO SOLICITANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nome:     ${session.user?.name || "Não informado"}
Email:    ${session.user.email}
Assunto:  ${subject}
Data:     ${new Date().toLocaleString("pt-BR", {
            dateStyle: "long",
            timeStyle: "short",
          })}

MENSAGEM DO USUÁRIO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${message}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AÇÃO REQUERIDA:
Responda este email para entrar em contato com o usuário.

Link direto: mailto:${session.user.email}

---
© ${new Date().getFullYear()} Contratei - Gestão Inteligente de Contratos
Sistema de Suporte Automatizado
          `,
        });

        return {
          success: true,
          message: "Mensagem de suporte enviada com sucesso",
        };
      } catch (error) {
        console.error("Erro ao enviar email de suporte:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Erro ao enviar mensagem de suporte",
        });
      }
    }),
});
