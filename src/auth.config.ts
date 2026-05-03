import Credentials from "next-auth/providers/credentials";

const authConfig = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {},
      async authorize() {
        return null;
      },
    }),
  ],
};

export default authConfig;