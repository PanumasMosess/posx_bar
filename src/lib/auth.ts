import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Organization Login",
      credentials: {
        username: { label: "Organization Code", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const usernameInput = (credentials.username as string).trim();
        const passwordInput = credentials.password as string;

        // ค้นหาองค์กร/ร้านค้าจาก username (รหัสบริษัท)
        const org = await prisma.organizations.findUnique({
          where: { username: usernameInput },
        });

        if (!org || !org.password) {
          return null;
        }

        // ตรวจสอบ Password (รองรับทั้ง Hash และ Plaintext สำหรับการทดสอบ)
        let isValid = await bcrypt.compare(passwordInput, org.password);
        if (!isValid && passwordInput === org.password) {
          isValid = true;
        }

        if (!isValid) {
          return null;
        }

        // คืนค่า Object เพื่อนำไปเก็บใน JWT/Session
        return {
          id: String(org.id),
          name: org.name,
          username: org.username,
          slug: org.slug,
          ownerId: org.ownerId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.orgId = Number(user.id);
        token.username = (user as any).username;
        token.slug = (user as any).slug;
        token.ownerId = (user as any).ownerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = String(token.orgId);
        (session.user as any).orgId = token.orgId;
        (session.user as any).username = token.username;
        (session.user as any).slug = token.slug;
        (session.user as any).ownerId = token.ownerId;
      }
      return session;
    },
  },
});