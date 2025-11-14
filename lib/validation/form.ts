/**
 * Form Validation Utilities
 *
 * Validation functions for customer registration and other forms
 */

import type { ValidationError } from "@/types";

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationError | null {
  if (!email) {
    return null; // Email is optional
  }

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      field: "email",
      message: "Please enter a valid email address",
    };
  }

  return null;
}

/**
 * Validate name (first name or last name)
 */
export function validateName(
  name: string,
  fieldName: "firstName" | "lastName"
): ValidationError | null {
  if (!name || name.trim().length === 0) {
    return {
      field: fieldName,
      message: `${fieldName === "firstName" ? "First" : "Last"} name is required`,
    };
  }

  if (name.trim().length < 2) {
    return {
      field: fieldName,
      message: `${fieldName === "firstName" ? "First" : "Last"} name must be at least 2 characters`,
    };
  }

  if (name.length > 100) {
    return {
      field: fieldName,
      message: `${fieldName === "firstName" ? "First" : "Last"} name must be less than 100 characters`,
    };
  }

  // Only allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) {
    return {
      field: fieldName,
      message: `${fieldName === "firstName" ? "First" : "Last"} name can only contain letters, spaces, hyphens, and apostrophes`,
    };
  }

  return null;
}

/**
 * Validate birthdate
 */
export function validateBirthDate(birthDate: Date | string): ValidationError | null {
  if (!birthDate) {
    return {
      field: "birthDate",
      message: "Birth date is required",
    };
  }

  const date = birthDate instanceof Date ? birthDate : new Date(birthDate);

  // Check if valid date
  if (isNaN(date.getTime())) {
    return {
      field: "birthDate",
      message: "Please enter a valid date",
    };
  }

  // Check if date is in the past
  const today = new Date();
  if (date >= today) {
    return {
      field: "birthDate",
      message: "Birth date must be in the past",
    };
  }

  // Check if date is reasonable (not more than 150 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  if (date < minDate) {
    return {
      field: "birthDate",
      message: "Please enter a valid birth date",
    };
  }

  // Check if person is at least reasonable age (optional, depends on requirements)
  // For now, just ensure the date is valid

  return null;
}

/**
 * Validate postal code (basic validation, varies by country)
 */
export function validatePostalCode(
  postalCode: string,
  countryCode?: string
): ValidationError | null {
  if (!postalCode) {
    return null; // Postal code is optional
  }

  // Basic validation - at least 3 characters, max 10
  if (postalCode.length < 3 || postalCode.length > 10) {
    return {
      field: "postalCode",
      message: "Please enter a valid postal code",
    };
  }

  // Country-specific validation
  if (countryCode === "US") {
    const usZipRegex = /^\d{5}(-\d{4})?$/;
    if (!usZipRegex.test(postalCode)) {
      return {
        field: "postalCode",
        message: "Please enter a valid US ZIP code (e.g., 12345 or 12345-6789)",
      };
    }
  } else if (countryCode === "CA") {
    const caPostalRegex = /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/;
    if (!caPostalRegex.test(postalCode)) {
      return {
        field: "postalCode",
        message: "Please enter a valid Canadian postal code (e.g., A1A 1A1)",
      };
    }
  } else if (countryCode === "GB") {
    const ukPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
    if (!ukPostcodeRegex.test(postalCode)) {
      return {
        field: "postalCode",
        message: "Please enter a valid UK postcode",
      };
    }
  }

  return null;
}

/**
 * Validate address line
 */
export function validateAddressLine(
  address: string,
  fieldName: "addressLine1" | "addressLine2"
): ValidationError | null {
  if (!address) {
    return null; // Address is optional
  }

  if (address.length < 3) {
    return {
      field: fieldName,
      message: "Address must be at least 3 characters",
    };
  }

  if (address.length > 200) {
    return {
      field: fieldName,
      message: "Address must be less than 200 characters",
    };
  }

  return null;
}

/**
 * Validate city name
 */
export function validateCity(city: string): ValidationError | null {
  if (!city) {
    return null; // City is optional
  }

  if (city.trim().length < 2) {
    return {
      field: "city",
      message: "City must be at least 2 characters",
    };
  }

  if (city.length > 100) {
    return {
      field: "city",
      message: "City must be less than 100 characters",
    };
  }

  // Allow letters, spaces, hyphens, apostrophes, and periods
  const cityRegex = /^[a-zA-Z\s\-'.]+$/;
  if (!cityRegex.test(city)) {
    return {
      field: "city",
      message: "City can only contain letters, spaces, hyphens, apostrophes, and periods",
    };
  }

  return null;
}

/**
 * Validate state/province
 */
export function validateState(state: string): ValidationError | null {
  if (!state) {
    return null; // State is optional
  }

  if (state.trim().length < 2) {
    return {
      field: "state",
      message: "State must be at least 2 characters",
    };
  }

  if (state.length > 100) {
    return {
      field: "state",
      message: "State must be less than 100 characters",
    };
  }

  return null;
}

/**
 * Validate consent checkbox
 */
export function validateConsent(consentGiven: boolean): ValidationError | null {
  if (!consentGiven) {
    return {
      field: "consentGiven",
      message: "You must agree to the terms to continue",
    };
  }

  return null;
}

/**
 * Validate all required fields for customer registration
 */
export function validateCustomerRegistration(data: {
  firstName: string;
  lastName: string;
  phone: string;
  birthDate: Date | string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  consentGiven: boolean;
}): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  const firstNameError = validateName(data.firstName, "firstName");
  if (firstNameError) errors.push(firstNameError);

  const lastNameError = validateName(data.lastName, "lastName");
  if (lastNameError) errors.push(lastNameError);

  const birthDateError = validateBirthDate(data.birthDate);
  if (birthDateError) errors.push(birthDateError);

  const consentError = validateConsent(data.consentGiven);
  if (consentError) errors.push(consentError);

  // Note: Phone validation is done separately with phone formatter

  // Optional fields
  if (data.email) {
    const emailError = validateEmail(data.email);
    if (emailError) errors.push(emailError);
  }

  if (data.addressLine1) {
    const addressError = validateAddressLine(data.addressLine1, "addressLine1");
    if (addressError) errors.push(addressError);
  }

  if (data.addressLine2) {
    const addressError = validateAddressLine(data.addressLine2, "addressLine2");
    if (addressError) errors.push(addressError);
  }

  if (data.city) {
    const cityError = validateCity(data.city);
    if (cityError) errors.push(cityError);
  }

  if (data.state) {
    const stateError = validateState(data.state);
    if (stateError) errors.push(stateError);
  }

  if (data.postalCode) {
    const postalError = validatePostalCode(data.postalCode, data.country);
    if (postalError) errors.push(postalError);
  }

  return errors;
}
