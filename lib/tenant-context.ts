/**
 * Tenant Context Utilities
 *
 * Utilities for extracting and managing tenant information from URLs and requests
 * All routes follow the pattern: /[tenantId]/[route]
 */

import { db } from "./db";
import type { TenantContext } from "@/types";
import { headers } from "next/headers";

/**
 * Extract tenant slug from URL pathname
 * Expected format: /[tenantId]/[...rest]
 */
export function extractTenantSlugFromPath(pathname: string): string | null {
  // Remove leading slash and split path
  const segments = pathname.replace(/^\//, "").split("/");

  // First segment is the tenant slug
  const tenantSlug = segments[0];

  // Validate it's not empty and doesn't start with underscore (Next.js special routes)
  if (!tenantSlug || tenantSlug.startsWith("_")) {
    return null;
  }

  return tenantSlug;
}

/**
 * Get organization by slug
 */
export async function getOrganizationBySlug(slug: string) {
  try {
    const organization = await db.organization.findUnique({
      where: { slug },
      include: {
        settings: true,
      },
    });

    return organization;
  } catch (error) {
    console.error(`Error fetching organization with slug "${slug}":`, error);
    return null;
  }
}

/**
 * Get tenant context from request headers
 * This is set by middleware and available in API routes and server components
 */
export async function getTenantContext(): Promise<TenantContext | null> {
  const headersList = await headers();
  const organizationId = headersList.get("x-organization-id");
  const organizationSlug = headersList.get("x-organization-slug");

  if (!organizationId || !organizationSlug) {
    return null;
  }

  return {
    organizationId,
    organizationSlug,
  };
}

/**
 * Validate that a user has access to a specific tenant
 * Used to prevent users from accessing other tenants' data
 */
export async function validateUserTenantAccess(
  clerkUserId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const user = await db.user.findFirst({
      where: {
        clerkUserId,
        organizationId,
      },
    });

    return !!user;
  } catch (error) {
    console.error("Error validating user tenant access:", error);
    return false;
  }
}

/**
 * Get organization settings for a tenant
 */
export async function getOrganizationSettings(organizationId: string) {
  try {
    const settings = await db.organizationSettings.findUnique({
      where: { organizationId },
    });

    // Return settings or create default if none exist
    if (!settings) {
      return await db.organizationSettings.create({
        data: {
          organizationId,
          country: "United States",
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("Error fetching organization settings:", error);
    return null;
  }
}

/**
 * Check if an organization exists by slug
 */
export async function organizationExists(slug: string): Promise<boolean> {
  try {
    const count = await db.organization.count({
      where: { slug },
    });
    return count > 0;
  } catch (error) {
    console.error("Error checking organization existence:", error);
    return false;
  }
}

/**
 * Create a new organization (tenant)
 * Used during first customer registration
 */
export async function createOrganization(data: {
  name: string;
  slug: string;
}) {
  try {
    const organization = await db.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        settings: {
          create: {
            country: "United States",
          },
        },
      },
      include: {
        settings: true,
      },
    });

    return organization;
  } catch (error) {
    console.error("Error creating organization:", error);
    return null;
  }
}
