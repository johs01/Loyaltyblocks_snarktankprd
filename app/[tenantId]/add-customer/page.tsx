/**
 * Public Customer Registration Page
 *
 * /[tenantId]/add-customer
 * Public-facing page where customers can register themselves
 */

import { getOrganizationBySlug } from "@/lib/tenant-context";
import RegistrationForm from "./RegistrationForm";

export default async function AddCustomerPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  // Get organization to verify tenant exists
  const organization = await getOrganizationBySlug(tenantId);

  // Allow registration even if organization doesn't exist yet
  // (first registrant creates the organization)

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 py-10">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {organization?.name || "Customer"} Registration
            </h1>
            <p className="text-gray-600">
              Please fill out the form below to register.
            </p>
          </div>

          {/* Registration Form */}
          <RegistrationForm
            tenantId={tenantId}
            organizationName={organization?.name || tenantId}
            defaultCountry={organization?.settings?.country || "United States"}
          />
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Your information will be kept confidential and secure.</p>
        </div>
      </div>
    </main>
  );
}
