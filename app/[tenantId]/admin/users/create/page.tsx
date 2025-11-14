/**
 * Create User Page
 *
 * Form to invite new admin users
 * Only accessible to SUPER_ADMIN
 */

import { getCurrentUser } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function CreateUserPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const currentUser = await getCurrentUser();
  const organization = await getOrganizationBySlug(tenantId);

  if (!organization || !currentUser || currentUser.role !== "SUPER_ADMIN") {
    redirect(`/${tenantId}/admin`);
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <Link
          href={`/${tenantId}/admin/users`}
          className="text-blue-600 hover:text-blue-700 text-sm mb-4 inline-block"
        >
          ← Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Invite New User</h1>
        <p className="text-gray-600 mt-1">
          Add a new admin user to your organization
        </p>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">
          How to Add Users
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
          <li>Have the user create an account at /{tenantId}/sign-up</li>
          <li>They will automatically be added as a Viewer</li>
          <li>You can then upgrade their role from the Users page (coming soon)</li>
        </ol>
      </div>

      {/* Temporary Notice */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">🚧</span>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Feature In Progress
        </h2>
        <p className="text-gray-600 mb-6">
          User invitation system is currently under development. For now, users
          can sign up directly and will be automatically added as Viewers.
        </p>
        <div className="bg-gray-50 rounded-lg p-4 text-left">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Share this sign-up link:
          </p>
          <code className="text-sm bg-white px-3 py-2 rounded border border-gray-200 block">
            {process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/
            {tenantId}/sign-up
          </code>
        </div>
      </div>
    </div>
  );
}
