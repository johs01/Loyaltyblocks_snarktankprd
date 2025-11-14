/**
 * Admin Customer Creation API Endpoint
 *
 * POST /api/[tenantId]/customers/create
 * Protected endpoint for admin users to manually add customers
 * RBAC: Only MANAGER+ can create
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/auth";
import { validatePhoneAndCheckAvailability } from "@/lib/validation/phone";
import { validateCustomerRegistration } from "@/lib/validation/form";
import type { ApiResponse, CustomerRegistrationData } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body: CustomerRegistrationData = await request.json();

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

    // Check RBAC - only MANAGER+ can create
    if (internalUser.role === "VIEWER") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Insufficient permissions to create customers" },
        { status: 403 }
      );
    }

    // Validate required fields
    const validationErrors = validateCustomerRegistration(body);

    if (validationErrors.length > 0) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Validation failed",
          details: validationErrors.reduce((acc, err) => {
            acc[err.field] = [err.message];
            return acc;
          }, {} as Record<string, string[]>),
        },
        { status: 400 }
      );
    }

    // Validate phone format and availability
    const phoneValidation = await validatePhoneAndCheckAvailability(
      body.phone,
      body.country || organization.settings?.country || "United States",
      organization.id
    );

    if (!phoneValidation.isValid || phoneValidation.available === false) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: phoneValidation.error || "Invalid phone number",
        },
        { status: 400 }
      );
    }

    // Create customer record
    try {
      const customer = await db.customer.create({
        data: {
          organizationId: organization.id,
          firstName: body.firstName.trim(),
          lastName: body.lastName.trim(),
          phone: phoneValidation.formatted!,
          birthDate: new Date(body.birthDate),
          email: body.email?.trim() || null,
          addressLine1: body.addressLine1?.trim() || null,
          addressLine2: body.addressLine2?.trim() || null,
          city: body.city?.trim() || null,
          state: body.state?.trim() || null,
          postalCode: body.postalCode?.trim() || null,
          country: body.country || null,
          consentGiven: body.consentGiven,
          createdBy: internalUser.id, // Track who created this customer
          updatedBy: internalUser.id,
        },
      });

      return NextResponse.json<ApiResponse<{ customerId: string; message: string }>>(
        {
          success: true,
          data: {
            customerId: customer.id,
            message: "Customer created successfully",
          },
        },
        { status: 201 }
      );
    } catch (dbError: unknown) {
      console.error("Database error creating customer:", dbError);

      // Check for unique constraint violations
      if (dbError && typeof dbError === "object" && "code" in dbError) {
        if (dbError.code === "P2002") {
          return NextResponse.json<ApiResponse>(
            {
              success: false,
              error: "Phone number already registered",
            },
            { status: 409 }
          );
        }
      }

      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Failed to create customer record",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
