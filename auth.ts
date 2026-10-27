import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Use JWT sessions – no DB-backed sessions table needed.
  // This is ideal for Vercel where we want stateless API routes.
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "ईमेल", type: "email" },
        password: { label: "पासवर्ड", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const officer = await prisma.officer.findUnique({ where: { email } });
        if (!officer) return null;

        const valid = await bcrypt.compare(password, officer.passwordHash);
        if (!valid) return null;

        return {
          id: officer.id,
          name: officer.name,
          email: officer.email,
          designation: officer.designation,
        };
      },
    }),
  ],

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isLoginPage = nextUrl.pathname.startsWith("/login");
      const isAuthApi = nextUrl.pathname.startsWith("/api/auth");

      if (isLoginPage || isAuthApi) {
        if (isLoggedIn && isLoginPage) {
          return Response.redirect(new URL("/dashboard", nextUrl));
        }
        return true;
      }

      // If not logged in, returning false causes NextAuth proxy to redirect to /login
      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.designation = (user as { designation?: string }).designation;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as { designation?: string }).designation =
          token.designation as string;
      }
      return session;
    },
  },
});
