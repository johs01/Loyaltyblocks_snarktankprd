/**
 * Registration Success Page
 *
 * /[tenantId]/add-customer/success
 * Confirmation page shown after successful registration
 */

import Link from "next/link";
import { getOrganizationBySlug } from "@/lib/tenant-context";

export default async function RegistrationSuccessPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const organization = await getOrganizationBySlug(tenantId);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white shadow-md rounded-lg px-8 py-10 text-center">
          {/* Success Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registration Successful!
          </h1>

          {/* Message */}
          <p className="text-gray-600 mb-6">
            Thank you for registering with {organization?.name || "us"}. Your
            information has been saved successfully.
          </p>

          {/* Details */}
          <div className="bg-gray-50 rounded-md p-4 mb-6">
            <p className="text-sm text-gray-700">
              You&apos;re now part of our loyalty program! Keep an eye out for special
              offers and rewards coming your way.
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link
              href={`/${tenantId}/add-customer`}
              className="block w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              Register Another Customer
            </Link>

            <Link
              href="/"
              className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            If you have any questions, please contact{" "}
            {organization?.name || "us"}.
          </p>
        </div>
      </div>
    </main>
  );
}
