"use client";

/**
 * Registration Form Component
 *
 * Client-side form with real-time validation for customer registration
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCountryByName } from "@/lib/countries";

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: string;
  email: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  consentGiven: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export default function RegistrationForm({
  tenantId,
  organizationName,
  defaultCountry,
}: {
  tenantId: string;
  organizationName: string;
  defaultCountry: string;
}) {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    consentGiven: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneValidating, setPhoneValidating] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);

  // Get country code from country name
  const countryCode = getCountryByName(defaultCountry)?.code || "US";

  // Validate phone number with API (debounced)
  useEffect(() => {
    if (!formData.phone || formData.phone.length < 7) {
      setPhoneAvailable(null);
      return;
    }

    const timer = setTimeout(async () => {
      setPhoneValidating(true);
      try {
        const response = await fetch(`/api/${tenantId}/customers/validate-phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone: formData.phone,
            countryCode,
          }),
        });

        const result = await response.json();
        setPhoneAvailable(result.success);

        if (!result.success) {
          setErrors((prev) => ({
            ...prev,
            phone: result.data?.error || result.error || "Invalid phone number",
          }));
        } else {
          setErrors((prev) => {
            const newErrors = { ...prev };
            delete newErrors.phone;
            return newErrors;
          });
        }
      } catch (error) {
        console.error("Phone validation error:", error);
      } finally {
        setPhoneValidating(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [formData.phone, tenantId, countryCode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic client-side validation
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    if (!formData.birthDate) {
      newErrors.birthDate = "Birth date is required";
    }
    if (!formData.consentGiven) {
      newErrors.consentGiven = "You must agree to continue";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Check phone is available
    if (phoneAvailable === false) {
      setErrors({ phone: "This phone number is already registered" });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/${tenantId}/customers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          country: defaultCountry,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to success page
        router.push(`/${tenantId}/add-customer/success`);
      } else {
        // Handle validation errors
        if (result.details) {
          const apiErrors: FormErrors = {};
          Object.entries(result.details).forEach(([field, messages]) => {
            apiErrors[field] = (messages as string[])[0];
          });
          setErrors(apiErrors);
        } else {
          setErrors({ submit: result.error });
        }
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ submit: "An error occurred. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error message */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{errors.submit}</p>
        </div>
      )}

      {/* Personal Information */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Personal Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              }`}
              required
            />
            {errors.lastName && (
              <p className="text-sm text-red-600 mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Contact Information
        </h2>

        {/* Phone */}
        <div className="mb-4">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="(555) 123-4567"
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.phone
                ? "border-red-500"
                : phoneAvailable === true
                ? "border-green-500"
                : "border-gray-300"
            }`}
            required
          />
          {phoneValidating && (
            <p className="text-sm text-gray-500 mt-1">Validating...</p>
          )}
          {phoneAvailable === true && !phoneValidating && (
            <p className="text-sm text-green-600 mt-1">✓ Phone number available</p>
          )}
          {errors.phone && (
            <p className="text-sm text-red-600 mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email (Optional)
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Birth Date */}
        <div>
          <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700 mb-1">
            Birth Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            id="birthDate"
            name="birthDate"
            value={formData.birthDate}
            onChange={handleChange}
            max={new Date().toISOString().split("T")[0]}
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.birthDate ? "border-red-500" : "border-gray-300"
            }`}
            required
          />
          {errors.birthDate && (
            <p className="text-sm text-red-600 mt-1">{errors.birthDate}</p>
          )}
        </div>
      </div>

      {/* Address (Optional) */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Address (Optional)
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="addressLine1" className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 1
            </label>
            <input
              type="text"
              id="addressLine1"
              name="addressLine1"
              value={formData.addressLine1}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="addressLine2" className="block text-sm font-medium text-gray-700 mb-1">
              Address Line 2
            </label>
            <input
              type="text"
              id="addressLine2"
              name="addressLine2"
              value={formData.addressLine2}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                State/Province
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code
              </label>
              <input
                type="text"
                id="postalCode"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Consent */}
      <div>
        <label className="flex items-start">
          <input
            type="checkbox"
            name="consentGiven"
            checked={formData.consentGiven}
            onChange={handleChange}
            className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            required
          />
          <span className="ml-2 text-sm text-gray-700">
            I agree to have my information stored for {organizationName}&apos;s loyalty
            program and marketing purposes. <span className="text-red-500">*</span>
          </span>
        </label>
        {errors.consentGiven && (
          <p className="text-sm text-red-600 mt-1">{errors.consentGiven}</p>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || phoneValidating || phoneAvailable === false}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? "Registering..." : "Register"}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        <span className="text-red-500">*</span> Required fields
      </p>
    </form>
  );
}
