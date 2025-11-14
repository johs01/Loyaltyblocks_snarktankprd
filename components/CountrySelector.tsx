"use client";

/**
 * Country Selector Component
 *
 * Dropdown component for selecting country with all available countries
 * Countries are displayed alphabetically
 */

import { COUNTRIES } from "@/lib/countries";

interface CountrySelectorProps {
  value: string;
  onChange: (country: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function CountrySelector({
  value,
  onChange,
  disabled = false,
  error,
}: CountrySelectorProps) {
  // Sort countries alphabetically by name
  const sortedCountries = [...COUNTRIES].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div>
      <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
        Default Country
      </label>
      <select
        id="country"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`mt-1 block w-full rounded-md shadow-sm sm:text-sm ${
          error
            ? "border-red-300 focus:border-red-500 focus:ring-red-500"
            : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
        } ${disabled ? "bg-gray-100 cursor-not-allowed" : ""}`}
      >
        {sortedCountries.map((country) => (
          <option key={country.code} value={country.name}>
            {country.name} ({country.dialCode})
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      <p className="mt-2 text-sm text-gray-500">
        This setting determines the default phone number format for your organization.
        Existing customer phone numbers will be displayed according to this format.
      </p>
    </div>
  );
}
