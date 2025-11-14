"use client";

/**
 * Settings Form Component
 *
 * Client component for managing organization settings
 * Handles form state, submission, and feedback
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import CountrySelector from "@/components/CountrySelector";

interface SettingsFormProps {
  tenantId: string;
  initialCountry: string;
  organizationName: string;
}

export default function SettingsForm({
  tenantId,
  initialCountry,
  organizationName,
}: SettingsFormProps) {
  const router = useRouter();
  const [country, setCountry] = useState(initialCountry);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const hasChanges = country !== initialCountry;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/${tenantId}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ country }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: "error",
          text: data.error || "Failed to update settings",
        });
        return;
      }

      setMessage({
        type: "success",
        text: "Settings updated successfully! Phone number formatting will now use the selected country format.",
      });

      // Refresh the page to ensure all data is up-to-date
      router.refresh();
    } catch (error) {
      console.error("Settings update error:", error);
      setMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setCountry(initialCountry);
    setMessage(null);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg">
      <form onSubmit={handleSubmit} className="px-6 py-8 space-y-6">
        {/* Organization Info */}
        <div className="pb-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Organization Information</h3>
          <div className="mt-4 space-y-2">
            <div>
              <span className="text-sm font-medium text-gray-500">Organization Name:</span>
              <span className="ml-2 text-sm text-gray-900">{organizationName}</span>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500">Tenant ID:</span>
              <span className="ml-2 text-sm text-gray-900 font-mono">{tenantId}</span>
            </div>
          </div>
        </div>

        {/* Feedback Messages */}
        {message && (
          <div
            className={`rounded-md p-4 ${
              message.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                {message.type === "success" ? (
                  <svg
                    className="h-5 w-5 text-green-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-red-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p
                  className={`text-sm ${
                    message.type === "success" ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Country Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Regional Settings</h3>
          <CountrySelector
            value={country}
            onChange={setCountry}
            disabled={isSubmitting}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleReset}
            disabled={!hasChanges || isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={!hasChanges || isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
