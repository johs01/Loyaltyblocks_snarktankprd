/**
 * Authentication and Authorization Utilities
 *
 * Utilities for working with Clerk authentication and our internal user system
 */

import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import type { AuthenticatedUser, UserRole } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";

/**
 * Get the current authenticated user with their role and organization
 * This combines Clerk auth with our internal user record
 */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  try {
    // Get Clerk user
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return null;
    }

    // Get our internal user record
    const user = await db.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as UserRole,
      organizationId: user.organizationId,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Get user by Clerk user ID
 */
export async function getUserByClerkId(clerkUserId: string) {
  try {
    return await db.user.findUnique({
      where: { clerkUserId },
      include: {
        organization: true,
      },
    });
  } catch (error) {
    console.error("Error getting user by Clerk ID:", error);
    return null;
  }
}

/**
 * Check if user has a specific role
 */
export function hasRole(user: AuthenticatedUser | null, role: UserRole): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user has minimum required role (role hierarchy)
 * SUPER_ADMIN > MANAGER > VIEWER
 */
export function hasMinimumRole(user: AuthenticatedUser | null, minimumRole: UserRole): boolean {
  if (!user) return false;

  const roleHierarchy: Record<UserRole, number> = {
    SUPER_ADMIN: 3,
    MANAGER: 2,
    VIEWER: 1,
  };

  return roleHierarchy[user.role] >= roleHierarchy[minimumRole];
}

/**
 * Check if user can perform a specific action
 */
export function canPerformAction(
  user: AuthenticatedUser | null,
  action: keyof typeof ROLE_PERMISSIONS.SUPER_ADMIN
): boolean {
  if (!user) return false;

  const permissions = ROLE_PERMISSIONS[user.role];
  return permissions[action];
}

/**
 * Check if user belongs to a specific organization
 */
export function belongsToOrganization(
  user: AuthenticatedUser | null,
  organizationId: string
): boolean {
  if (!user) return false;
  return user.organizationId === organizationId;
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Authentication required");
  }

  return user;
}

/**
 * Require specific role - throws error if user doesn't have role
 */
export async function requireRole(role: UserRole): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!hasRole(user, role)) {
    throw new Error(`Role ${role} required`);
  }

  return user;
}

/**
 * Require minimum role - throws error if user doesn't have minimum role
 */
export async function requireMinimumRole(minimumRole: UserRole): Promise<AuthenticatedUser> {
  const user = await requireAuth();

  if (!hasMinimumRole(user, minimumRole)) {
    throw new Error(`Minimum role ${minimumRole} required`);
  }

  return user;
}

/**
 * Create a new internal user linked to a Clerk user
 * Used during user creation/invitation process
 */
export async function createInternalUser(data: {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
}) {
  try {
    const user = await db.user.create({
      data: {
        clerkUserId: data.clerkUserId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        organizationId: data.organizationId,
      },
      include: {
        organization: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error creating internal user:", error);
    return null;
  }
}

/**
 * Check if this is the first user in an organization
 * Used to determine if someone should become super admin
 */
export async function isFirstUserInOrganization(organizationId: string): Promise<boolean> {
  try {
    const userCount = await db.user.count({
      where: { organizationId },
    });

    return userCount === 0;
  } catch (error) {
    console.error("Error checking first user:", error);
    return false;
  }
}

/**
 * Get all users in an organization
 */
export async function getOrganizationUsers(organizationId: string) {
  try {
    return await db.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error getting organization users:", error);
    return [];
  }
}

/**
 * Update user role
 * Only super admins can update roles
 */
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    return await db.user.update({
      where: { id: userId },
      data: { role: newRole },
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return null;
  }
}

/**
 * Delete internal user
 * Note: This doesn't delete the Clerk user, just our internal record
 */
export async function deleteInternalUser(userId: string) {
  try {
    await db.user.delete({
      where: { id: userId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting internal user:", error);
    return false;
  }
}
