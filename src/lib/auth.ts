import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Resend from "next-auth/providers/resend";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "./prisma";

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
                              <div style="background-color: #ffffff; display: inline-block; padding: 20px 48px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
                                <img 
                                  src="https://davicmartini.sirv.com/Images/logo.png" 
                                  alt="Contratei" 
                                  style="height: 56px; max-width: 240px; display: block; margin: 0 auto;"
                                />
                              </div>
                            </div>
                            <h2 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; line-height: 1.3;">
                              Acesse sua conta
                            </h2>
                            <p style="color: rgba(255, 255, 255, 0.85); margin: 12px 0 0 0; font-size: 16px;">
              Clique no botão abaixo para fazer login de forma segura
            </p>
                          </td>
                        </tr>                        <!-- Conteúdo -->
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
    maxAge: 24 * 60 * 60, // 24 hours - absolute max session lifetime
    updateAge: 15 * 60, // 15 minutes - refresh token if older than this when user is active
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
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: {
            accounts: {
              where: { provider: "google" },
            },
          },
        });

        if (existingUser) {
          const hasGoogleAccount = existingUser.accounts.some(
            (acc) => acc.provider === "google"
          );

          if (!hasGoogleAccount) {
            await prisma.account.create({
              data: {
                userId: existingUser.id,
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token,
                access_token: account.access_token,
                expires_at: account.expires_at,
                token_type: account.token_type,
                scope: account.scope,
                id_token: account.id_token,
                session_state:
                  typeof account.session_state === "string"
                    ? account.session_state
                    : null,
              },
            });

            if (!existingUser.image && user.image) {
              await prisma.user.update({
                where: { id: existingUser.id },
                data: { image: user.image },
              });
            }
          }

          return true;
        }

        return false;
      }

      return true;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      } else if (new URL(url).origin === baseUrl) {
        return url;
      }

      if (
        url === baseUrl ||
        url === `${baseUrl}/` ||
        url === `${baseUrl}/select-org`
      ) {
        try {
          const session = await auth();
          if (session?.user?.id) {
            const user = await prisma.user.findUnique({
              where: { id: session.user.id },
              include: {
                accounts: true,
                memberships: true,
              },
            });

            if (user) {
              const hasGoogleAccount = user.accounts.some(
                (acc) => acc.provider === "google"
              );
              const hasOtherAccount = user.accounts.some(
                (acc) => acc.provider !== "google"
              );
              const hasOrg = user.memberships.length > 0;

              if (hasGoogleAccount && !hasOtherAccount && !hasOrg) {
                return `${baseUrl}/auth/error?error=OAuthAccountNotLinked`;
              }

              const orgCount = user.memberships.length;

              if (orgCount === 1) {
                return `${baseUrl}/dashboard`;
              }

              return `${baseUrl}/select-org`;
            }
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
        session.dbSessionId = token.dbSessionId; // Store DB session ID for revocation checks
      }
      return session;
    },
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        
        // Create a stable session ID for this JWT (only on first login)
        if (!token.dbSessionId) {
          // Generate a unique session ID that will be stored in DB
          const { nanoid } = await import("nanoid");
          token.dbSessionId = nanoid();
        }
      }

      if (trigger === "update" && session?.selectedOrgId) {
        token.selectedOrgId = session.selectedOrgId;
      }

      if (!token.iat) {
        token.iat = Math.floor(Date.now() / 1000);
      }

      token.lastActivity = Math.floor(Date.now() / 1000);

      return token;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email) {
        const hasOrg = await prisma.orgMember.findFirst({
          where: { userId: user.id },
        });

        if (!hasOrg) {
          const accounts = await prisma.account.findMany({
            where: { userId: user.id },
          });

          const hasGoogleAccount = accounts.some(
            (acc) => acc.provider === "google"
          );
          const hasOtherAccount = accounts.some(
            (acc) => acc.provider !== "google"
          );

          if (hasGoogleAccount && !hasOtherAccount) {
            await prisma.account.deleteMany({
              where: { userId: user.id },
            });
            await prisma.user.delete({
              where: { id: user.id },
            });
          }
        }
      }
    },
  },
  trustHost: true,
});
