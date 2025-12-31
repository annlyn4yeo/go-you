import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        // 1. Basic guard
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim();
        const password = credentials.password;

        if (!email || !password || !email.includes("@")) {
          return null;
        }

        // 2. Look for existing user
        const existingUser = await prisma.user.findUnique({
          where: { email },
        });

        // 3. FIRST-TIME USER → CREATE ACCOUNT
        if (!existingUser) {
          const passwordHash = await bcrypt.hash(password, 10);

          const newUser = await prisma.user.create({
            data: {
              id: email, // using email as String ID
              email,
              passwordHash,
            },
          });

          return {
            id: newUser.id,
            email: newUser.email,
          };
        }

        // 4. RETURNING USER → VERIFY PASSWORD
        const isValidPassword = await bcrypt.compare(
          password,
          existingUser.passwordHash
        );

        if (!isValidPassword) {
          return null; // ❌ incorrect password
        }

        // 5. SUCCESS
        return {
          id: existingUser.id,
          email: existingUser.email,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Attach user id to JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Expose user id in session
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
