/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Utilities and middleware for enforcing role-based access control
 * in API routes and server actions
 */

import { NextResponse } from "next/server";
import type { UserRole } from "@/types";
import { ROLE_PERMISSIONS } from "@/types";
import { getCurrentUser } from "../auth";

/**
 * Check if a role has permission for a specific action
 */
export function roleHasPermission(
  role: UserRole,
  action: keyof typeof ROLE_PERMISSIONS.SUPER_ADMIN
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions[action];
}

/**
 * Compare role hierarchy
 * Returns true if firstRole is equal to or higher than secondRole
 */
export function roleIsAtLeast(firstRole: UserRole, secondRole: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    SUPER_ADMIN: 3,
    MANAGER: 2,
    VIEWER: 1,
  };

  return roleHierarchy[firstRole] >= roleHierarchy[secondRole];
}

/**
 * Middleware factory for protecting API routes with RBAC
 * Usage in API route:
 *
 * export async function GET(request: Request) {
 *   const rbacResult = await withRBAC(request, { minimumRole: "VIEWER" });
 *   if (!rbacResult.authorized) {
 *     return rbacResult.response;
 *   }
 *   const { user } = rbacResult;
 *   // ... rest of handler
 * }
 */
export async function withRBAC(
  request: Request,
  options: {
    minimumRole?: UserRole;
    requiredAction?: keyof typeof ROLE_PERMISSIONS.SUPER_ADMIN;
    organizationId?: string; // If provided, verify user belongs to this org
  } = {}
): Promise<
  | { authorized: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { authorized: false; response: NextResponse }
> {
  try {
    // Get current user
    const user = await getCurrentUser();

    // Check authentication
    if (!user) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: "Authentication required" },
          { status: 401 }
        ),
      };
    }

    // Check organization access if specified
    if (options.organizationId && user.organizationId !== options.organizationId) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: "Access denied: Invalid organization" },
          { status: 403 }
        ),
      };
    }

    // Check minimum role if specified
    if (options.minimumRole && !roleIsAtLeast(user.role, options.minimumRole)) {
      return {
        authorized: false,
        response: NextResponse.json(
          {
            success: false,
            error: `Access denied: Minimum role ${options.minimumRole} required`,
          },
          { status: 403 }
        ),
      };
    }

    // Check required action permission if specified
    if (options.requiredAction && !roleHasPermission(user.role, options.requiredAction)) {
      return {
        authorized: false,
        response: NextResponse.json(
          { success: false, error: "Access denied: Insufficient permissions" },
          { status: 403 }
        ),
      };
    }

    // All checks passed
    return {
      authorized: true,
      user,
    };
  } catch (error) {
    console.error("RBAC middleware error:", error);
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Helper to create unauthorized response
 */
export function unauthorizedResponse(message = "Authentication required") {
  return NextResponse.json({ success: false, error: message }, { status: 401 });
}

/**
 * Helper to create forbidden response
 */
export function forbiddenResponse(message = "Access denied") {
  return NextResponse.json({ success: false, error: message }, { status: 403 });
}

/**
 * Helper to create success response
 */
export function successResponse<T>(data: T, message?: string) {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status: 200 }
  );
}

/**
 * Helper to create error response
 */
export function errorResponse(error: string, status = 400, details?: Record<string, string[]>) {
  return NextResponse.json(
    {
      success: false,
      error,
      ...(details && { details }),
    },
    { status }
  );
}

/**
 * Check if user can manage users (create, edit, delete)
 */
export function canManageUsers(role: UserRole): boolean {
  return roleHasPermission(role, "canManageUsers");
}

/**
 * Check if user can manage settings
 */
export function canManageSettings(role: UserRole): boolean {
  return roleHasPermission(role, "canManageSettings");
}

/**
 * Check if user can create customers
 */
export function canCreateCustomers(role: UserRole): boolean {
  return roleHasPermission(role, "canCreateCustomers");
}

/**
 * Check if user can edit customers
 */
export function canEditCustomers(role: UserRole): boolean {
  return roleHasPermission(role, "canEditCustomers");
}

/**
 * Check if user can delete customers
 */
export function canDeleteCustomers(role: UserRole): boolean {
  return roleHasPermission(role, "canDeleteCustomers");
}

/**
 * Check if user can view customers
 */
export function canViewCustomers(role: UserRole): boolean {
  return roleHasPermission(role, "canViewCustomers");
}

/**
 * Get list of all actions a role can perform
 */
export function getRoleActions(role: UserRole): string[] {
  const permissions = ROLE_PERMISSIONS[role];
  return Object.entries(permissions)
    .filter(([, allowed]) => allowed)
    .map(([action]) => action);
}

/**
 * Validate that a role value is valid
 */
export function isValidRole(role: string): role is UserRole {
  return ["SUPER_ADMIN", "MANAGER", "VIEWER"].includes(role);
}
