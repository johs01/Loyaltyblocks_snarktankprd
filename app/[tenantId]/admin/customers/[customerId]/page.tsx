/**
 * Customer Detail Page
 *
 * Displays comprehensive information about a specific customer
 * RBAC: All roles can view
 */

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getUserByClerkId } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import Link from "next/link";
import { formatPhoneForDisplay } from "@/lib/phone-formatter";

interface PageProps {
  params: Promise<{
    tenantId: string;
    customerId: string;
  }>;
}

export default async function CustomerDetailPage({ params }: PageProps) {
  const { tenantId, customerId } = await params;

  // Check authentication
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(`/${tenantId}/sign-in?redirect_url=/${tenantId}/admin/customers/${customerId}`);
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
    notFound();
  }

  // Verify customer belongs to this organization
  if (customer.organizationId !== organization.id) {
    redirect(`/${tenantId}/admin/customers`);
  }

  const canEdit = internalUser.role === "SUPER_ADMIN" || internalUser.role === "MANAGER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href={`/${tenantId}/admin/customers`}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.firstName} {customer.lastName}
            </h1>
            <p className="text-sm text-gray-500 mt-1">Customer Details</p>
          </div>
        </div>
        {canEdit && (
          <Link
            href={`/${tenantId}/admin/customers/${customerId}/edit`}
            className="bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Edit Customer
          </Link>
        )}
      </div>

      {/* Customer Information */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">First Name</label>
              <p className="mt-1 text-sm text-gray-900">{customer.firstName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Last Name</label>
              <p className="mt-1 text-sm text-gray-900">{customer.lastName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Phone Number</label>
              <p className="mt-1 text-sm text-gray-900">
                {formatPhoneForDisplay(customer.phone, "national")}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Email</label>
              <p className="mt-1 text-sm text-gray-900">{customer.email || "Not provided"}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Birth Date</label>
              <p className="mt-1 text-sm text-gray-900">
                {customer.birthDate.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Consent Given</label>
              <p className="mt-1 text-sm text-gray-900">
                {customer.consentGiven ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Yes
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    No
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Address Information */}
      {(customer.addressLine1 || customer.city || customer.state || customer.postalCode) && (
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Address</h2>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customer.addressLine1 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">
                    Address Line 1
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{customer.addressLine1}</p>
                </div>
              )}
              {customer.addressLine2 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">
                    Address Line 2
                  </label>
                  <p className="mt-1 text-sm text-gray-900">{customer.addressLine2}</p>
                </div>
              )}
              {customer.city && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">City</label>
                  <p className="mt-1 text-sm text-gray-900">{customer.city}</p>
                </div>
              )}
              {customer.state && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">State</label>
                  <p className="mt-1 text-sm text-gray-900">{customer.state}</p>
                </div>
              )}
              {customer.postalCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Postal Code</label>
                  <p className="mt-1 text-sm text-gray-900">{customer.postalCode}</p>
                </div>
              )}
              {customer.country && (
                <div>
                  <label className="block text-sm font-medium text-gray-500">Country</label>
                  <p className="mt-1 text-sm text-gray-900">{customer.country}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* System Information */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">System Information</h2>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500">Customer ID</label>
              <p className="mt-1 text-sm text-gray-900 font-mono">{customer.id}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Created At</label>
              <p className="mt-1 text-sm text-gray-900">
                {customer.createdAt.toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Created By</label>
              <p className="mt-1 text-sm text-gray-900">
                {customer.creator
                  ? `${customer.creator.firstName} ${customer.creator.lastName} (${customer.creator.email})`
                  : "Public Registration"}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500">Last Updated</label>
              <p className="mt-1 text-sm text-gray-900">
                {customer.updatedAt.toLocaleString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            {customer.updater && (
              <div>
                <label className="block text-sm font-medium text-gray-500">Updated By</label>
                <p className="mt-1 text-sm text-gray-900">
                  {customer.updater.firstName} {customer.updater.lastName} (
                  {customer.updater.email})
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
