/**
 * Customer List Page
 *
 * Displays all customers for the organization with search, filter, and pagination
 * RBAC: All roles can view, only MANAGER+ can edit/delete
 */

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import Link from "next/link";
import { formatPhoneForDisplay } from "@/lib/phone-formatter";
import CustomerListClient from "./CustomerListClient";

interface PageProps {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{
    search?: string;
    page?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
  }>;
}

export default async function CustomersPage({ params, searchParams }: PageProps) {
  const { tenantId } = await params;
  const { search = "", page = "1", sortBy = "createdAt", sortOrder = "desc" } = await searchParams;

  // Check authentication
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(`/${tenantId}/sign-in?redirect_url=/${tenantId}/admin/customers`);
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

  // Pagination setup
  const pageSize = 20;
  const currentPage = Math.max(1, parseInt(page, 10));
  const skip = (currentPage - 1) * pageSize;

  // Build search filter
  const searchFilter = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  // Fetch customers
  const [customers, totalCount] = await Promise.all([
    db.customer.findMany({
      where: {
        organizationId: organization.id,
        ...searchFilter,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: pageSize,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    db.customer.count({
      where: {
        organizationId: organization.id,
        ...searchFilter,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  // Format customers for display
  const formattedCustomers = customers.map((customer) => ({
    id: customer.id,
    name: `${customer.firstName} ${customer.lastName}`,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: formatPhoneForDisplay(customer.phone, "national"),
    email: customer.email || "N/A",
    createdAt: customer.createdAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    createdBy: customer.creator
      ? `${customer.creator.firstName} ${customer.creator.lastName}`
      : "Public Registration",
    birthDate: customer.birthDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Database</h1>
          <p className="text-sm text-gray-500 mt-1">
            Showing {customers.length} of {totalCount} customers
          </p>
        </div>
        {(internalUser.role === "SUPER_ADMIN" || internalUser.role === "MANAGER") && (
          <Link
            href={`/${tenantId}/admin/customers/create`}
            className="bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            + Add Customer
          </Link>
        )}
      </div>

      {/* Pass to client component for interactive features */}
      <CustomerListClient
        customers={formattedCustomers}
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        tenantId={tenantId}
        userRole={internalUser.role}
        initialSearch={search}
      />
    </div>
  );
}
