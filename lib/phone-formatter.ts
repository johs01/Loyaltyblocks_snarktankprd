/**
 * Phone Number Formatting and Validation
 *
 * Uses libphonenumber-js for parsing, validating, and formatting phone numbers
 * Supports E.164 format for storage and country-specific formatting for display
 */

import {
  parsePhoneNumber,
  isValidPhoneNumber,
  getCountries,
  type CountryCode,
} from "libphonenumber-js";
import type { PhoneValidationResult } from "@/types";

/**
 * Validate and format a phone number to E.164 format for storage
 *
 * @param phoneInput - Raw phone input from user (can include formatting)
 * @param countryCode - ISO 3166-1 alpha-2 country code (e.g., "US", "GB")
 * @returns Validation result with formatted E.164 number if valid
 *
 * @example
 * validateAndFormatPhone("(555) 123-4567", "US")
 * // Returns: { isValid: true, formatted: "+15551234567", country: "US" }
 */
export function validateAndFormatPhone(
  phoneInput: string,
  countryCode: string
): PhoneValidationResult {
  try {
    // Clean the input (remove spaces, dashes, parentheses)
    const cleaned = phoneInput.replace(/[\s\-\(\)\.]/g, "");

    if (!cleaned) {
      return {
        isValid: false,
        error: "Phone number is required",
      };
    }

    // Check if countryCode is valid
    const validCountries = getCountries();
    if (!validCountries.includes(countryCode as CountryCode)) {
      return {
        isValid: false,
        error: "Invalid country code",
      };
    }

    // Validate the phone number
    const isValid = isValidPhoneNumber(cleaned, countryCode as CountryCode);

    if (!isValid) {
      return {
        isValid: false,
        error: "Invalid phone number for the selected country",
      };
    }

    // Parse and format to E.164
    const phoneNumber = parsePhoneNumber(cleaned, countryCode as CountryCode);

    return {
      isValid: true,
      formatted: phoneNumber.format("E.164"), // e.g., "+15551234567"
      country: phoneNumber.country || countryCode,
    };
  } catch {
    return {
      isValid: false,
      error: "Failed to parse phone number",
    };
  }
}

/**
 * Format a phone number for display based on country
 *
 * @param e164Phone - Phone number in E.164 format (e.g., "+15551234567")
 * @param format - Display format: "national", "international", or "uri"
 * @returns Formatted phone number string
 *
 * @example
 * formatPhoneForDisplay("+15551234567", "national")
 * // Returns: "(555) 123-4567"
 *
 * formatPhoneForDisplay("+15551234567", "international")
 * // Returns: "+1 555 123 4567"
 */
export function formatPhoneForDisplay(
  e164Phone: string,
  format: "national" | "international" | "uri" = "national"
): string {
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);

    switch (format) {
      case "national":
        return phoneNumber.formatNational();
      case "international":
        return phoneNumber.formatInternational();
      case "uri":
        return phoneNumber.getURI();
      default:
        return phoneNumber.formatNational();
    }
  } catch {
    // If parsing fails, return original
    return e164Phone;
  }
}

/**
 * Extract country code from E.164 phone number
 *
 * @param e164Phone - Phone number in E.164 format
 * @returns Country code or null if not found
 *
 * @example
 * getCountryFromE164("+15551234567")
 * // Returns: "US"
 */
export function getCountryFromE164(e164Phone: string): string | null {
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);
    return phoneNumber.country || null;
  } catch {
    return null;
  }
}

/**
 * Check if a phone number is in valid E.164 format
 *
 * @param phone - Phone number to check
 * @returns true if valid E.164 format
 *
 * @example
 * isE164Format("+15551234567") // true
 * isE164Format("555-123-4567") // false
 */
export function isE164Format(phone: string): boolean {
  // E.164 format: starts with +, followed by 1-15 digits
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Normalize phone input by removing non-numeric characters except +
 *
 * @param phoneInput - Raw phone input
 * @returns Normalized phone string
 *
 * @example
 * normalizePhoneInput("(555) 123-4567")
 * // Returns: "5551234567"
 */
export function normalizePhoneInput(phoneInput: string): string {
  // Keep only digits and leading +
  let normalized = phoneInput.replace(/[^\d+]/g, "");

  // Ensure only one + at the beginning
  if (normalized.includes("+")) {
    normalized = "+" + normalized.replace(/\+/g, "");
  }

  return normalized;
}

/**
 * Get national number without country code
 *
 * @param e164Phone - Phone number in E.164 format
 * @returns National number as string
 *
 * @example
 * getNationalNumber("+15551234567")
 * // Returns: "5551234567"
 */
export function getNationalNumber(e164Phone: string): string {
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);
    return phoneNumber.nationalNumber;
  } catch {
    return e164Phone.replace("+", "");
  }
}

/**
 * Compare two phone numbers for equality (ignores formatting)
 *
 * @param phone1 - First phone number (any format)
 * @param phone2 - Second phone number (any format)
 * @param countryCode - Country code for parsing (if not in E.164)
 * @returns true if numbers are the same
 */
export function arePhoneNumbersEqual(
  phone1: string,
  phone2: string,
  countryCode?: string
): boolean {
  try {
    // If both are E.164, compare directly
    if (isE164Format(phone1) && isE164Format(phone2)) {
      return phone1 === phone2;
    }

    // Otherwise parse with country code
    if (!countryCode) {
      return false;
    }

    const parsed1 = parsePhoneNumber(phone1, countryCode as CountryCode);
    const parsed2 = parsePhoneNumber(phone2, countryCode as CountryCode);

    return parsed1.format("E.164") === parsed2.format("E.164");
  } catch {
    return false;
  }
}

/**
 * Get example phone number for a country
 *
 * @param countryCode - ISO country code
 * @returns Example phone number in national format
 */
export function getExampleNumber(countryCode: string): string {
  const examples: Record<string, string> = {
    US: "(555) 123-4567",
    CA: "(555) 123-4567",
    GB: "07123 456789",
    AU: "0412 345 678",
    NZ: "021 234 5678",
    DE: "0151 23456789",
    FR: "06 12 34 56 78",
    IT: "312 345 6789",
    ES: "612 34 56 78",
    JP: "090-1234-5678",
    CN: "138 0013 8000",
    IN: "98765 43210",
  };

  return examples[countryCode] || "123456789";
}

/**
 * Validate phone number without formatting (quick check)
 *
 * @param phoneInput - Phone number input
 * @param countryCode - Country code
 * @returns true if valid
 */
export function isValidPhone(phoneInput: string, countryCode: string): boolean {
  try {
    const cleaned = phoneInput.replace(/[\s\-\(\)\.]/g, "");
    return isValidPhoneNumber(cleaned, countryCode as CountryCode);
  } catch {
    return false;
  }
}
