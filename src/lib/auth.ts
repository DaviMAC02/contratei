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
      from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
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
    async session({ token, session }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.email = token.email!;
        session.user.image = token.picture;
      }
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
      }
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
