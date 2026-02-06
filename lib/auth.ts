import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { query, generateId } from "./db";
import { compare, hash } from "bcryptjs";

// User type for NextAuth
export interface User {
  id: string;
  name: string | null;
  email: string;
  emailVerified: Date | null;
  image: string | null;
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await query<User>("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0] || null;
}

// Get user by ID
export async function getUserById(id: string): Promise<User | null> {
  const result = await query<User>("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0] || null;
}

// Create user
export async function createUser(data: {
  name: string;
  email: string;
  password?: string;
  image?: string;
}): Promise<User> {
  const id = generateId();
  const hashedPassword = data.password ? await hash(data.password, 12) : null;

  const result = await query<User>(
    `INSERT INTO users (id, name, email, password, image, "createdAt", "updatedAt") 
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
     RETURNING *`,
    [id, data.name, data.email, hashedPassword, data.image || null],
  );
  return result.rows[0];
}

// Update user
export async function updateUser(
  id: string,
  data: Partial<Pick<User, "name" | "email" | "image" | "emailVerified">>,
): Promise<User | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (data.name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(data.name);
  }
  if (data.email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(data.email);
  }
  if (data.image !== undefined) {
    fields.push(`image = $${paramIndex++}`);
    values.push(data.image);
  }
  if (data.emailVerified !== undefined) {
    fields.push(`"emailVerified" = $${paramIndex++}`);
    values.push(data.emailVerified);
  }

  fields.push(`"updatedAt" = NOW()`);
  values.push(id);

  const result = await query<User>(
    `UPDATE users SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
    values,
  );
  return result.rows[0] || null;
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
  const id = generateId();
  await query(
    `INSERT INTO accounts (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     ON CONFLICT (provider, "providerAccountId") DO NOTHING`,
    [
      id,
      data.userId,
      data.type,
      data.provider,
      data.providerAccountId,
      data.refresh_token,
      data.access_token,
      data.expires_at,
      data.token_type,
      data.scope,
      data.id_token,
      data.session_state,
    ],
  );
}

// Get account by provider
export async function getAccountByProvider(
  provider: string,
  providerAccountId: string,
) {
  const result = await query(
    `SELECT * FROM accounts WHERE provider = $1 AND "providerAccountId" = $2`,
    [provider, providerAccountId],
  );
  return result.rows[0] || null;
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
