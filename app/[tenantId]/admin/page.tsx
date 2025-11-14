/**
 * Admin Dashboard Home Page
 *
 * Overview dashboard with key metrics and quick actions
 */

import { db } from "@/lib/db";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { getCurrentUser } from "@/lib/auth";
import Link from "next/link";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const user = await getCurrentUser();
  const organization = await getOrganizationBySlug(tenantId);

  if (!organization || !user) {
    return null;
  }

  // Get statistics
  const [customerCount, userCount] = await Promise.all([
    db.customer.count({
      where: { organizationId: organization.id },
    }),
    db.user.count({
      where: { organizationId: organization.id },
    }),
  ]);

  // Get recent customers
  const recentCustomers = await db.customer.findMany({
    where: { organizationId: organization.id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true,
    },
  });

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview of your customer database and system activity
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Customers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{customerCount}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
          <Link
            href={`/${tenantId}/admin/customers`}
            className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block"
          >
            View all customers →
          </Link>
        </div>

        {/* Total Users */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Admin Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{userCount}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🔐</span>
            </div>
          </div>
          {user.role === "SUPER_ADMIN" && (
            <Link
              href={`/${tenantId}/admin/users`}
              className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block"
            >
              Manage users →
            </Link>
          )}
        </div>

        {/* Organization Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Organization</p>
              <p className="text-lg font-semibold text-gray-900 mt-2 truncate">
                {organization.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {organization.settings?.country || "United States"}
              </p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
          {user.role === "SUPER_ADMIN" && (
            <Link
              href={`/${tenantId}/admin/settings`}
              className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block"
            >
              Edit settings →
            </Link>
          )}
        </div>
      </div>

      {/* Recent Customers */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Registrations</h2>
        </div>
        <div className="overflow-x-auto">
          {recentCustomers.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.firstName} {customer.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(customer.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/${tenantId}/admin/customers/${customer.id}`}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No customers registered yet.</p>
              <Link
                href={`/${tenantId}/add-customer`}
                className="text-blue-600 hover:text-blue-700 mt-2 inline-block"
              >
                Register first customer →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={`/${tenantId}/add-customer`}
            target="_blank"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="text-2xl mr-3">➕</span>
            <div>
              <p className="font-medium text-gray-900">Add New Customer</p>
              <p className="text-sm text-gray-500">Open public registration form</p>
            </div>
          </Link>

          {user.role === "SUPER_ADMIN" && (
            <Link
              href={`/${tenantId}/admin/users/create`}
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-2xl mr-3">👤</span>
              <div>
                <p className="font-medium text-gray-900">Invite Admin User</p>
                <p className="text-sm text-gray-500">Add manager or viewer</p>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
