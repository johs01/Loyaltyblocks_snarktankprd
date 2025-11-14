/**
 * Organization Settings Page
 *
 * Allows SUPER_ADMIN to configure organization-wide settings
 * Currently supports: Country selection for phone formatting
 */

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import SettingsForm from "./SettingsForm";

interface PageProps {
  params: Promise<{ tenantId: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { tenantId } = await params;

  // Check authentication
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(`/${tenantId}/sign-in?redirect_url=/${tenantId}/admin/settings`);
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

  // Check RBAC - only SUPER_ADMIN can access settings
  if (internalUser.role !== "SUPER_ADMIN") {
    redirect(`/${tenantId}/admin`);
  }

  // Fetch or create settings
  let settings = await db.organizationSettings.findUnique({
    where: { organizationId: organization.id },
  });

  // Create default settings if they don't exist
  if (!settings) {
    settings = await db.organizationSettings.create({
      data: {
        organizationId: organization.id,
        country: "United States",
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure organization-wide settings and preferences
        </p>
      </div>

      {/* Settings Form */}
      <SettingsForm
        tenantId={tenantId}
        initialCountry={settings.country}
        organizationName={organization.name}
      />

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-blue-800">About Settings</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Country:</strong> Determines the default phone number format for your
                  organization
                </li>
                <li>
                  Existing customer phone numbers will be displayed according to the selected
                  country format
                </li>
                <li>
                  Phone numbers are stored in E.164 format (international standard) regardless of
                  display format
                </li>
                <li>Only Super Admins can modify organization settings</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
