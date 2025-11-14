/**
 * Customer Detail API Endpoint
 *
 * GET /api/[tenantId]/customers/[customerId] - Get customer details
 * PUT /api/[tenantId]/customers/[customerId] - Update customer
 * DELETE /api/[tenantId]/customers/[customerId] - Delete customer
 *
 * RBAC: All roles can GET, only MANAGER+ can PUT/DELETE
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { auth } from "@clerk/nextjs/server";
import { getUserByClerkId } from "@/lib/auth";
import { validatePhoneAndCheckAvailability } from "@/lib/validation/phone";
import { validateCustomerRegistration } from "@/lib/validation/form";
import type { ApiResponse, CustomerRegistrationData } from "@/types";

interface RouteContext {
  params: Promise<{
    tenantId: string;
    customerId: string;
  }>;
}

// GET - Fetch customer details
export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { tenantId, customerId } = await params;

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

    // Fetch customer
    const customer = await db.customer.findUnique({
      where: {
        id: customerId,
      },
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        updater: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Verify customer belongs to this organization
    if (customer.organizationId !== organization.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT - Update customer
export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { tenantId, customerId } = await params;
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

    // Check RBAC - only MANAGER+ can edit
    if (internalUser.role === "VIEWER") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Insufficient permissions to edit customers" },
        { status: 403 }
      );
    }

    // Verify customer exists and belongs to this organization
    const existingCustomer = await db.customer.findUnique({
      where: { id: customerId },
    });

    if (!existingCustomer) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    if (existingCustomer.organizationId !== organization.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Validate form data
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

    // Validate phone if it changed
    let formattedPhone = existingCustomer.phone;
    if (body.phone !== existingCustomer.phone) {
      const phoneValidation = await validatePhoneAndCheckAvailability(
        body.phone,
        body.country || organization.settings?.country || "United States",
        organization.id,
        customerId // Exclude current customer from uniqueness check
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

      formattedPhone = phoneValidation.formatted!;
    }

    // Update customer
    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: {
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        phone: formattedPhone,
        birthDate: new Date(body.birthDate),
        email: body.email?.trim() || null,
        addressLine1: body.addressLine1?.trim() || null,
        addressLine2: body.addressLine2?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        postalCode: body.postalCode?.trim() || null,
        country: body.country || null,
        consentGiven: body.consentGiven,
        updatedBy: internalUser.id,
      },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: updatedCustomer,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete customer
export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { tenantId, customerId } = await params;

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

    // Check RBAC - only MANAGER+ can delete
    if (internalUser.role === "VIEWER") {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Insufficient permissions to delete customers" },
        { status: 403 }
      );
    }

    // Verify customer exists and belongs to this organization
    const customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { organizationId: true },
    });

    if (!customer) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    if (customer.organizationId !== organization.id) {
      return NextResponse.json<ApiResponse>(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    // Delete customer
    await db.customer.delete({
      where: { id: customerId },
    });

    return NextResponse.json<ApiResponse>({
      success: true,
      data: { message: "Customer deleted successfully" },
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json<ApiResponse>(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
