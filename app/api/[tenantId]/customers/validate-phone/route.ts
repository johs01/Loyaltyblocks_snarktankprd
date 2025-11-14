/**
 * Phone Validation API Endpoint
 *
 * POST /api/[tenantId]/customers/validate-phone
 * Validates phone format and checks for duplicates within tenant
 */

import { NextResponse } from "next/server";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { validatePhoneAndCheckAvailability } from "@/lib/validation/phone";
import type { ApiResponse, PhoneValidationResult } from "@/types";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();

    // Validate request body
    if (!body.phone || !body.countryCode) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Phone number and country code are required",
        },
        { status: 400 }
      );
    }

    // Get organization by slug
    const organization = await getOrganizationBySlug(tenantId);

    if (!organization) {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: "Organization not found",
        },
        { status: 404 }
      );
    }

    // Validate phone and check availability
    const result = await validatePhoneAndCheckAvailability(
      body.phone,
      body.countryCode,
      organization.id,
      body.excludeCustomerId // Optional: for update operations
    );

    // Return validation result
    if (result.isValid && result.available !== false) {
      return NextResponse.json<ApiResponse<PhoneValidationResult & { available?: boolean }>>(
        {
          success: true,
          data: result,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json<ApiResponse>(
        {
          success: false,
          error: result.error || "Phone validation failed",
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Phone validation error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
