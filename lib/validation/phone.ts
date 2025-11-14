/**
 * Phone Number Validation with Database Checks
 *
 * Validates phone number format and checks for uniqueness within a tenant
 */

import { db } from "../db";
import { validateAndFormatPhone, isE164Format } from "../phone-formatter";
import type { PhoneAvailabilityResult, PhoneValidationResult } from "@/types";

/**
 * Check if a phone number is already registered for a tenant
 *
 * @param phone - Phone number in E.164 format
 * @param organizationId - Tenant ID to check within
 * @param excludeCustomerId - Optional customer ID to exclude (for updates)
 * @returns Availability result with message
 */
export async function checkPhoneAvailability(
  phone: string,
  organizationId: string,
  excludeCustomerId?: string
): Promise<PhoneAvailabilityResult> {
  try {
    // Validate E.164 format
    if (!isE164Format(phone)) {
      return {
        available: false,
        message: "Phone number must be in E.164 format",
      };
    }

    // Check if phone exists in this tenant
    const existingCustomer = await db.customer.findFirst({
      where: {
        organizationId,
        phone,
        ...(excludeCustomerId && {
          id: { not: excludeCustomerId },
        }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (existingCustomer) {
      return {
        available: false,
        message: `Phone number already registered to ${existingCustomer.firstName} ${existingCustomer.lastName}`,
      };
    }

    return {
      available: true,
      message: "Phone number is available",
    };
  } catch (error) {
    console.error("Error checking phone availability:", error);
    return {
      available: false,
      message: "Error checking phone availability",
    };
  }
}

/**
 * Validate phone format and check availability in one call
 *
 * @param phoneInput - Raw phone input from user
 * @param countryCode - Country code for validation
 * @param organizationId - Tenant ID
 * @param excludeCustomerId - Optional customer ID to exclude
 * @returns Combined validation and availability result
 */
export async function validatePhoneAndCheckAvailability(
  phoneInput: string,
  countryCode: string,
  organizationId: string,
  excludeCustomerId?: string
): Promise<PhoneValidationResult & { available?: boolean }> {
  // First validate format
  const validation = validateAndFormatPhone(phoneInput, countryCode);

  if (!validation.isValid || !validation.formatted) {
    return validation;
  }

  // Then check availability
  const availability = await checkPhoneAvailability(
    validation.formatted,
    organizationId,
    excludeCustomerId
  );

  return {
    ...validation,
    available: availability.available,
    error: !availability.available ? availability.message : undefined,
  };
}

/**
 * Get all customers with a specific phone number across all tenants
 * (Admin/debugging use only - respects tenant isolation in queries)
 *
 * @param phone - Phone number in E.164 format
 * @returns List of customers with this phone number
 */
export async function findCustomersByPhone(phone: string) {
  try {
    if (!isE164Format(phone)) {
      return [];
    }

    return await db.customer.findMany({
      where: { phone },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error finding customers by phone:", error);
    return [];
  }
}

/**
 * Validate that a phone number belongs to a specific customer
 * Used for verification flows
 *
 * @param phone - Phone number in E.164 format
 * @param customerId - Customer ID to verify
 * @param organizationId - Tenant ID
 * @returns true if phone matches customer
 */
export async function verifyCustomerPhone(
  phone: string,
  customerId: string,
  organizationId: string
): Promise<boolean> {
  try {
    const customer = await db.customer.findUnique({
      where: {
        id: customerId,
        organizationId,
      },
      select: {
        phone: true,
      },
    });

    return customer?.phone === phone;
  } catch (error) {
    console.error("Error verifying customer phone:", error);
    return false;
  }
}

/**
 * Get customer by phone number within a tenant
 *
 * @param phone - Phone number in E.164 format
 * @param organizationId - Tenant ID
 * @returns Customer record or null
 */
export async function getCustomerByPhone(
  phone: string,
  organizationId: string
) {
  try {
    if (!isE164Format(phone)) {
      return null;
    }

    return await db.customer.findFirst({
      where: {
        phone,
        organizationId,
      },
    });
  } catch (error) {
    console.error("Error getting customer by phone:", error);
    return null;
  }
}

/**
 * Validate phone input format before database check
 * Quick validation for frontend use
 *
 * @param phoneInput - Raw phone input
 * @param countryCode - Country code
 * @returns Validation result without database check
 */
export function validatePhoneFormat(
  phoneInput: string,
  countryCode: string
): PhoneValidationResult {
  return validateAndFormatPhone(phoneInput, countryCode);
}
