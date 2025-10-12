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
            subject: "Login no Contratei - Seu link mágico",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>🔐 Login Seguro</h2>
                <p>Clique no botão abaixo para fazer login na sua conta:</p>
                <a href="${url}" style="display: inline-block; padding: 12px 24px; background-color: #0070f3; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                  Fazer Login
                </a>
                <p style="color: #666; font-size: 14px;">
                  Ou copie e cole este link no navegador:<br/>
                  <code style="background: #f4f4f4; padding: 4px 8px;">${url}</code>
                </p>
                <p style="color: #999; font-size: 12px; margin-top: 40px;">
                  Este link expira em 24 horas e só pode ser usado uma vez.
                </p>
              </div>
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
