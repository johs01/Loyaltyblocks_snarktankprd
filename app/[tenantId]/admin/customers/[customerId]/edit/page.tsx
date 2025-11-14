/**
 * Customer Edit Page
 *
 * Allows editing existing customer information
 * RBAC: Only MANAGER+ can access
 */

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import CustomerEditForm from "./CustomerEditForm";

interface PageProps {
  params: Promise<{
    tenantId: string;
    customerId: string;
  }>;
}

export default async function CustomerEditPage({ params }: PageProps) {
  const { tenantId, customerId } = await params;

  // Check authentication
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(`/${tenantId}/sign-in?redirect_url=/${tenantId}/admin/customers/${customerId}/edit`);
  }

  // Get organization
  const organization = await getOrganizationBySlug(tenantId);

  if (!organization) {
    redirect("/");
  }

  // Get internal user record
  const internalUser = await getUserByClerkId(clerkUserId);

  if (!internalUser || internalUser.organizationId !== organization.id) {
    redirect(`/${tenantId}/admin`);
  }

  // Check RBAC - only MANAGER+ can edit
  if (internalUser.role === "VIEWER") {
    redirect(`/${tenantId}/admin/customers/${customerId}`);
  }

  // Fetch customer
  const customer = await db.customer.findUnique({
    where: {
      id: customerId,
    },
  });

  if (!customer) {
    notFound();
  }

  // Verify customer belongs to this organization
  if (customer.organizationId !== organization.id) {
    redirect(`/${tenantId}/admin/customers`);
  }

  // Get country setting from organization
  const orgSettings = await db.organizationSettings.findUnique({
    where: { organizationId: organization.id },
  });

  const defaultCountry = orgSettings?.country || "United States";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
        <p className="text-sm text-gray-500 mt-1">
          Update information for {customer.firstName} {customer.lastName}
        </p>
      </div>

      {/* Form */}
      <CustomerEditForm
        customer={{
          id: customer.id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
          birthDate: customer.birthDate.toISOString().split("T")[0],
          email: customer.email || "",
          addressLine1: customer.addressLine1 || "",
          addressLine2: customer.addressLine2 || "",
          city: customer.city || "",
          state: customer.state || "",
          postalCode: customer.postalCode || "",
          country: customer.country || defaultCountry,
          consentGiven: customer.consentGiven,
        }}
        tenantId={tenantId}
        defaultCountry={defaultCountry}
      />
    </div>
  );
}
