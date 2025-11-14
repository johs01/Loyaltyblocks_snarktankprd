/**
 * User Management Page
 *
 * List and manage internal admin users
 * Only accessible to SUPER_ADMIN
 */

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const currentUser = await getCurrentUser();
  const organization = await getOrganizationBySlug(tenantId);

  if (!organization || !currentUser) {
    redirect(`/${tenantId}/sign-in`);
  }

  // Only SUPER_ADMIN can access user management
  if (currentUser.role !== "SUPER_ADMIN") {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-900 mb-2">Access Denied</h2>
          <p className="text-red-700">
            Only Super Administrators can manage users.
          </p>
          <Link
            href={`/${tenantId}/admin`}
            className="mt-4 inline-block text-blue-600 hover:text-blue-700"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Get all users for this organization
  const users = await db.user.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage admin users and their permissions
          </p>
        </div>
        <Link
          href={`/${tenantId}/admin/users/create`}
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors"
        >
          + Invite User
        </Link>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {users.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {user.firstName[0]}
                        {user.lastName[0]}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === "SUPER_ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "MANAGER"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role === "SUPER_ADMIN" && "Super Admin"}
                      {user.role === "MANAGER" && "Manager"}
                      {user.role === "VIEWER" && "Viewer"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.id !== currentUser.id ? (
                      <button
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        disabled
                      >
                        Remove
                      </button>
                    ) : (
                      <span className="text-gray-400">You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500 mb-4">No users found.</p>
            <Link
              href={`/${tenantId}/admin/users/create`}
              className="text-blue-600 hover:text-blue-700"
            >
              Invite your first user →
            </Link>
          </div>
        )}
      </div>

      {/* Role Permissions Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-blue-900 mb-3">
          Role Permissions
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Super Admin:</strong> Full access - can manage users,
            settings, and all customers
          </p>
          <p>
            <strong>Manager:</strong> Can create, edit, and delete customers
            (cannot manage users or settings)
          </p>
          <p>
            <strong>Viewer:</strong> Read-only access to customer database
          </p>
        </div>
      </div>
    </div>
  );
}
