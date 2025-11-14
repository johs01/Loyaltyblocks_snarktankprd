/**
 * Organization Settings API Endpoint
 *
 * GET /api/[tenantId]/settings - Get organization settings
 * PUT /api/[tenantId]/settings - Update organization settings
 *
 * RBAC: Only SUPER_ADMIN can access
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/auth";
import { COUNTRIES } from "@/lib/countries";
import type { ApiResponse } from "@/types";

interface RouteContext {
  params: Promise<{
    tenantId: string;
  }>;
}

// GET - Fetch organization settings
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { tenantId } = await params;

    // Check authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organization
    const organization = await getOrganizationBySlug(tenantId);
    if (!organization) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get internal user
    const internalUser = await getUserByClerkId(clerkUserId);
    if (!internalUser || internalUser.organizationId !== organization.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check RBAC - only SUPER_ADMIN can access settings
    if (internalUser.role !== "SUPER_ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Only super admins can access settings" },
        { status: 403 }
      );
    }

    // Fetch or create settings
    let settings = await db.organizationSettings.findUnique({
      where: { organizationId: organization.id },
    });

    // Create default settings if they don't exist
    if (!settings) {
      settings = await db.organizationSettings.create({
        data: {
          organizationId: organization.id,
          country: "United States",
        },
      });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update organization settings
export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { tenantId } = await params;
    const body = await request.json();

    // Check authentication
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get organization
    const organization = await getOrganizationBySlug(tenantId);
    if (!organization) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    // Get internal user
    const internalUser = await getUserByClerkId(clerkUserId);
    if (!internalUser || internalUser.organizationId !== organization.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Check RBAC - only SUPER_ADMIN can update settings
    if (internalUser.role !== "SUPER_ADMIN") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Only super admins can update settings" },
        { status: 403 }
      );
    }

    // Validate country
    const { country } = body;
    if (!country || typeof country !== "string") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Country is required" },
        { status: 400 }
      );
    }

    // Validate against available countries
    const validCountry = COUNTRIES.find((c) => c.name === country);
    if (!validCountry) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Invalid country selected" },
        { status: 400 }
      );
    }

    // Update or create settings
    const settings = await db.organizationSettings.upsert({
      where: { organizationId: organization.id },
      update: {
        country,
      },
      create: {
        organizationId: organization.id,
        country,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
