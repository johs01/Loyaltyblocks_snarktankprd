"use client";

/**
 * Phone Input Component
 *
 * Reusable phone input with validation and availability checking
 */

import { useState, useEffect } from "react";
import { getCountryByName } from "@/lib/countries";

interface PhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  defaultCountry: string;
  tenantId: string;
  skipAvailabilityCheck?: boolean;
  error?: string;
}

export default function PhoneInput({
  value,
  onChange,
  defaultCountry,
  tenantId,
  skipAvailabilityCheck = false,
  error,
}: PhoneInputProps) {
  const [phoneValidating, setPhoneValidating] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | undefined>(error);

  // Get country code from country name
  const countryCode = getCountryByName(defaultCountry)?.code || "US";

  // Validate phone number with API (debounced)
  useEffect(() => {
    if (!value || value.length < 7) {
      setPhoneAvailable(null);
      setValidationError(undefined);
      return;
    }

    if (skipAvailabilityCheck) {
      // For edit forms, skip availability check
      return;
    }

    const timer = setTimeout(async () => {
      setPhoneValidating(true);
      try {
        const response = await fetch(`/api/${tenantId}/customers/validate-phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: value,
            countryCode,
          }),
        });

        const result = await response.json();
        setPhoneAvailable(result.success);

        if (!result.success) {
          setValidationError(result.data?.error || result.error || "Invalid phone number");
          onChange(value, false);
        } else {
          setValidationError(undefined);
          onChange(value, true);
        }
      } catch (err) {
        console.error("Phone validation error:", err);
        setValidationError("Failed to validate phone number");
        onChange(value, false);
      } finally {
        setPhoneValidating(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [value, tenantId, countryCode, skipAvailabilityCheck, onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue, true); // Assume valid until validation runs
  };

  const displayError = error || validationError;

  return (
    <div className="relative">
      <input
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder="(555) 123-4567"
        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
          displayError
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        }`}
      />
      {phoneValidating && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg
            className="animate-spin h-4 w-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}
      {phoneAvailable === true && !skipAvailabilityCheck && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      )}
      {displayError && <p className="mt-1 text-sm text-red-600">{displayError}</p>}
    </div>
  );
}
