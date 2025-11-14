/**
 * Customer Registration API Endpoint
 *
 * POST /api/[tenantId]/customers/register
 * Public endpoint for customer self-registration
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrganizationBySlug, createOrganization } from "@/lib/tenant-context";
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

    // Get or create organization
    let organization = await getOrganizationBySlug(tenantId);
    let isFirstCustomer = false;

    if (!organization) {
      // First registrant - create organization
      const orgName = tenantId.charAt(0).toUpperCase() + tenantId.slice(1).replace(/-/g, " ");
      organization = await createOrganization({
        name: orgName,
        slug: tenantId,
      });

      if (!organization) {
        return NextResponse.json<ApiResponse>(
          {
            success: false,
            error: "Failed to create organization",
          },
          { status: 500 }
        );
      }

      isFirstCustomer = true;
    }

    // Validate phone format and availability
    const phoneValidation = await validatePhoneAndCheckAvailability(
      body.phone,
      // Use organization's country setting, fallback to form data or US
      organization.settings?.country || body.country || "United States",
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
          createdBy: null, // Public registration - no internal user
          updatedBy: null,
        },
      });

      return NextResponse.json<ApiResponse<{
        customerId: string;
        isFirstCustomer: boolean;
        message: string;
      }>>(
        {
          success: true,
          data: {
            customerId: customer.id,
            isFirstCustomer,
            message: isFirstCustomer
              ? "Registration successful! You are the first customer."
              : "Registration successful!",
          },
        },
        { status: 201 }
      );
    } catch (dbError: unknown) {
      console.error("Database error creating customer:", dbError);

      // Check for unique constraint violations
      if (dbError && typeof dbError === 'object' && 'code' in dbError) {
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
    console.error("Registration error:", error);
    return NextResponse.json<ApiResponse>(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
