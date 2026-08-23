import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      farmerId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    farmerId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role;
    farmerId: string | null;
    uid: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: Role;
    farmerId: string | null;
    uid: string;
  }
}
