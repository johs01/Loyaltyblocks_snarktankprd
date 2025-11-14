/**
 * Admin Customer Creation Page
 *
 * Allows admin users to manually add customers to the database
 * RBAC: Only MANAGER+ can access
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import CustomerCreateForm from "./CustomerCreateForm";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function CustomerCreatePage({ params }: PageProps) {
  const { tenantId } = await params;

  // Check authentication
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(`/${tenantId}/sign-in?redirect_url=/${tenantId}/admin/customers/create`);
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

  // Check RBAC - only MANAGER+ can create
  if (internalUser.role === "VIEWER") {
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
        <h1 className="text-2xl font-bold text-gray-900">Add New Customer</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manually add a customer to the database
        </p>
      </div>

      {/* Form */}
      <CustomerCreateForm tenantId={tenantId} defaultCountry={defaultCountry} />
    </div>
  );
}
