import type { NextAuthConfig } from "next-auth";

export default {
  providers: [],
  pages: {
    signIn: "/signin",
  },
  session: {
    strategy: "jwt",
  },
} satisfies NextAuthConfig;