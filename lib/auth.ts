import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { prisma } from "./db";
import { compare, hash } from "bcryptjs";
import type { User } from "@/lib/generated/prisma/client";

// Re-export User type
export type { User };

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

// Create user
export async function createUser(data: {
  name: string;
  email: string;
  password?: string;
  image?: string;
}): Promise<User> {
  const hashedPassword = data.password ? await hash(data.password, 12) : null;

  return prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      image: data.image ?? null,
    },
  });
}

// Update user
export async function updateUser(
  id: string,
  data: Partial<Pick<User, "name" | "email" | "image" | "emailVerified">>,
): Promise<User | null> {
  try {
    return await prisma.user.update({
      where: { id },
      data,
    });
  } catch {
    return null;
  }
}

// Link OAuth account
export async function linkAccount(data: {
  userId: string;
  type: string;
  provider: string;
  providerAccountId: string;
  refresh_token?: string;
  access_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  id_token?: string;
  session_state?: string;
}) {
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: {
        provider: data.provider,
        providerAccountId: data.providerAccountId,
      },
    },
    update: {},
    create: {
      userId: data.userId,
      type: data.type,
      provider: data.provider,
      providerAccountId: data.providerAccountId,
      refresh_token: data.refresh_token,
      access_token: data.access_token,
      expires_at: data.expires_at,
      token_type: data.token_type,
      scope: data.scope,
      id_token: data.id_token,
      session_state: data.session_state,
    },
  });
}

// Get account by provider
export async function getAccountByProvider(
  provider: string,
  providerAccountId: string,
) {
  return prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId,
      },
    },
  });
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await getUserByEmail(credentials.email);

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        // Check if user exists
        let existingUser = await getUserByEmail(user.email!);

        if (!existingUser) {
          // Create new user
          existingUser = await createUser({
            name: user.name || "",
            email: user.email!,
            image: user.image || undefined,
          });
        }

        // Check if account is already linked
        const existingAccount = await getAccountByProvider(
          account.provider,
          account.providerAccountId,
        );

        if (!existingAccount) {
          // Link the account
          await linkAccount({
            userId: existingUser.id,
            type: account.type,
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            refresh_token: account.refresh_token,
            access_token: account.access_token,
            expires_at: account.expires_at,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            session_state: account.session_state as string | undefined,
          });
        }

        // Update user object with database ID
        user.id = existingUser.id;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
    error: "/auth",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
