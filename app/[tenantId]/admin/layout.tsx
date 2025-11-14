/**
 * Admin Dashboard Layout
 *
 * Protected layout for admin routes with navigation sidebar
 * Requires Clerk authentication and valid internal user record
 */

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserByClerkId } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import Navigation from "@/components/Navigation";
import { UserButton } from "@clerk/nextjs";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  // Check authentication
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    // Redirect to sign-in if not authenticated
    redirect(`/${tenantId}/sign-in?redirect_url=/${tenantId}/admin`);
  }

  // Get organization
  const organization = await getOrganizationBySlug(tenantId);

  if (!organization) {
    redirect("/");
  }

  // Get internal user record
  const internalUser = await getUserByClerkId(clerkUserId);

  // Check if user belongs to this organization
  if (!internalUser || internalUser.organizationId !== organization.id) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access this organization&apos;s admin dashboard.
          </p>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-sm fixed h-full">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">{organization.name}</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Dashboard</p>
        </div>
        <Navigation tenantId={tenantId} userRole={internalUser.role} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Welcome back, {internalUser.firstName}!
              </h2>
              <p className="text-sm text-gray-500">
                {internalUser.role === "SUPER_ADMIN" && "Super Admin"}
                {internalUser.role === "MANAGER" && "Manager"}
                {internalUser.role === "VIEWER" && "Viewer"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <UserButton afterSignOutUrl={`/${tenantId}`} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
