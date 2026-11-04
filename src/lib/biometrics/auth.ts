import { auth, getUserDetails } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export interface AuthenticatedUser {
  userId: string;
  role: string;
  name?: string;
  email?: string;
  isMaster: boolean;
  isAdmin: boolean;
}

/**
 * Resolves the authenticated user from Clerk or custom_auth_token.
 * Enforces role checking according to project standards.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const userDetails = await getUserDetails(userId);
  if (!userDetails) return null;

  const metadataRole = String(
    (userDetails.publicMetadata as Record<string, unknown>)?.role ||
    (userDetails.privateMetadata as Record<string, unknown>)?.role ||
    ""
  ).toLowerCase();

  // Also check database User role if custom user or metadata is blank
  let dbRole = "";
  if (!metadataRole) {
    const dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { role: true },
    });
    dbRole = String(dbUser?.role || "").toLowerCase();
  }

  const role = metadataRole || dbRole || "user";
  const isMaster = role === "master";
  const isAdmin = role === "admin" || isMaster;

  const email = userDetails.emailAddresses?.[0]?.emailAddress;
  const name = `${userDetails.firstName || ""} ${userDetails.lastName || ""}`.trim() || userDetails.username || undefined;

  return {
    userId,
    role,
    name,
    email,
    isMaster,
    isAdmin,
  };
}

/**
 * Validates that the current user has MASTER or ADMIN permissions.
 */
export async function requireAdminOrMaster(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  if (!user.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
