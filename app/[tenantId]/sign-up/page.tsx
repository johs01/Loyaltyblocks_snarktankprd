/**
 * Sign Up Page
 *
 * Clerk authentication sign-up page for new admin users
 */

import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">LoyaltyBlocks</h1>
          <p className="text-gray-600 mt-2">Create your admin account</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "shadow-md",
            },
          }}
        />
      </div>
    </div>
  );
}
