import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
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

        // ตรวจสอบ Password
        let isValid = await bcrypt.compare(passwordInput, org.password);
        if (!isValid && passwordInput === org.password) {
          isValid = true;
        }

        if (!isValid) {
          return null;
        }

        // 🌟 คืนค่า Detail องค์กรออกไป
        return {
          id: String(org.id),
          orgId: org.id, // เก็บ orgId เป็น number โดยตรง
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
        // 🌟 บันทึกข้อมูลลง Token อย่างปลอดภัย
        const u = user as any;
        token.orgId = u.orgId || Number(u.id);
        token.username = u.username;
        token.slug = u.slug;
        token.ownerId = u.ownerId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // 🌟 ผูกข้อมูลองค์กรกลับเข้าไปใน Session Object
        session.user.id = String(token.orgId);
        (session.user as any).orgId = Number(token.orgId);
        (session.user as any).username = token.username;
        (session.user as any).slug = token.slug;
        (session.user as any).ownerId = token.ownerId;
      }
      return session;
    },
  },
});
