import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

// Explicit cookie configuration for NextAuth

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.RESEND_FROM_EMAIL || "contato@contratei.co",
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        try {
          const { Resend: ResendClient } = await import("resend");
          const resend = new ResendClient(process.env.RESEND_API_KEY!);

          await resend.emails.send({
            from: provider.from as string,
            to: identifier,
            subject: "Login no Contratei - Seu link de acesso",
            html: `
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
                        <!-- Header -->
                        <tr>
                          <td style="background-color: #1d2b48; padding: 48px 40px; text-align: center;">
                            <div style="margin-bottom: 24px;">
                              <img src="https://contratei.co/logo.png" 
                                   alt="CONTRATEI" 
                                   style="height: 56px; max-width: 200px; display: block; margin: 0 auto;"
                                   onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-block';" />
                              <div style="background-color: #ffffff; display: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                                <span style="color: #1d2b48; font-size: 28px; font-weight: 800; letter-spacing: 0.5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
                                  CONTRATEI
                                </span>
                              </div>
                            </div>
                            <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">
                              Acesse sua conta
                            </h2>
                            <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">
                              Clique no botão abaixo para fazer login de forma segura
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Conteúdo -->
                        <tr>
                          <td style="padding: 48px 40px;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                              Olá,
                            </p>
                            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0 0 32px 0;">
                              Você solicitou um link de acesso para sua conta no <strong>Contratei</strong>. 
                              Clique no botão abaixo para fazer login de forma rápida e segura:
                            </p>
                            
                            <!-- Botão CTA -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td align="center" style="padding: 8px 0 32px 0;">
                                  <a href="${url}" style="display: inline-block; background-color: #1d2b48; color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(29, 43, 72, 0.3);">
                                    Acessar minha conta
                                  </a>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Link alternativo -->
                            <div style="background-color: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 32px; border: 1px solid #e5e7eb;">
                              <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">
                                Ou copie e cole este link no navegador:
                              </p>
                              <p style="color: #1d2b48; font-size: 13px; word-break: break-all; margin: 0; font-family: 'Courier New', monospace; background-color: #ffffff; padding: 12px; border-radius: 8px; border: 1px solid #e5e7eb;">
                                ${url}
                              </p>
                            </div>
                            
                            <!-- Informações de segurança -->
                            <div style="border-left: 4px solid #b4efe5; background-color: #f9fafb; padding: 16px 20px; border-radius: 8px; margin-bottom: 24px;">
                              <p style="color: #374151; font-size: 14px; margin: 0; line-height: 1.5;">
                                <strong>Importante:</strong> Este link é único, expira em <strong>24 horas</strong> e só pode ser usado uma vez.
                              </p>
                            </div>
                            
                            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0;">
                              Se você não solicitou este acesso, pode ignorar este email com segurança.
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
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
          });
        } catch (error) {
          console.error("Erro ao enviar email via Resend:", error);
          throw error;
        }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - session will be updated if older than this
  },
  cookies: {
    sessionToken: {
      name: `authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        domain: process.env.NEXTAUTH_COOKIE_DOMAIN || undefined,
      },
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      return true;
    },
    async redirect({ url, baseUrl }) {
      // If the url is already an absolute URL, check if it's from our domain
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }

      // For sign-in redirects, check user's organizations
      if (
        url === baseUrl ||
        url === `${baseUrl}/` ||
        url === `${baseUrl}/select-org`
      ) {
        try {
          // Get the session to find the user
          const session = await auth();
          if (session?.user?.id) {
            // Get user's organizations
            const orgs = await prisma.orgMember.findMany({
              where: { userId: session.user.id },
              include: { org: true },
            });

            // If user has exactly one org, redirect directly to dashboard
            // The orgId will be set in the session by the dashboard page
            if (orgs.length === 1) {
              return `${baseUrl}/dashboard`;
            }

            // If user has multiple orgs or no orgs, go to select-org
            return `${baseUrl}/select-org`;
          }
        } catch (error) {
          console.error("Error checking user orgs in redirect:", error);
        }
      }

      return baseUrl;
    },
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email!;
        session.user.image = token.picture;
        session.selectedOrgId = token.selectedOrgId;
      }
      return session;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }

      // Handle session update trigger (when user changes org)
      if (trigger === "update" && session?.selectedOrgId) {
        token.selectedOrgId = session.selectedOrgId;
      }

      // Add issued at time for tracking token age
      if (!token.iat) {
        token.iat = Math.floor(Date.now() / 1000);
      }

      // Update last activity timestamp on every request
      token.lastActivity = Math.floor(Date.now() / 1000);

      return token;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Custom sign in event logic can go here
    },
    async createUser({ user }) {
      // Custom create user event logic can go here
    },
  },
  trustHost: true,
});
