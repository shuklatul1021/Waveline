import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { redirect } from "next/navigation";

// Get session in Server Components
export async function getSession() {
  return await getServerSession(authOptions);
}

// Get current user in Server Components
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user;
}

// Require authentication in Server Components - redirects to login if not authenticated
export async function requireAuth() {
  const session = await getSession();

  if (!session?.user) {
    redirect("/auth");
  }

  return session;
}

// Check if user is authenticated (boolean)
export async function isAuthenticated() {
  const session = await getSession();
  return !!session?.user;
}
