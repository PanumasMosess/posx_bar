import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      orgId: number;
      username: string;
      slug?: string | null;
      ownerId: number;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    username: string;
    slug?: string | null;
    ownerId: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    orgId: number;
    username: string;
    slug?: string | null;
    ownerId: number;
  }
}
