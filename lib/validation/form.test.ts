/**
 * Tests for Form Validation
 *
 * Tests customer registration form validation logic
 */

import {
  validateCustomerRegistration,
  validateName,
  validateEmail,
  validatePostalCode,
  validateBirthDate,
} from "./form";
import type { CustomerRegistrationData } from "@/types";

describe("Form Validation", () => {
  describe("validateName", () => {
    it("should accept valid names", () => {
      expect(validateName("John")).toBe(true);
      expect(validateName("Mary-Jane")).toBe(true);
      expect(validateName("O'Brien")).toBe(true);
      expect(validateName("José")).toBe(true);
    });

    it("should reject names that are too short", () => {
      expect(validateName("J")).toBe(false);
      expect(validateName("")).toBe(false);
    });

    it("should reject names that are too long", () => {
      expect(validateName("a".repeat(51))).toBe(false);
    });

    it("should reject names with numbers", () => {
      expect(validateName("John123")).toBe(false);
      expect(validateName("123John")).toBe(false);
    });

    it("should reject names with special characters", () => {
      expect(validateName("John@Doe")).toBe(false);
      expect(validateName("John#Smith")).toBe(false);
    });

    it("should handle whitespace trimming", () => {
      expect(validateName("  John  ")).toBe(true);
    });
  });

  describe("validateEmail", () => {
    it("should accept valid email addresses", () => {
      expect(validateEmail("test@example.com")).toBe(true);
      expect(validateEmail("user.name@domain.co.uk")).toBe(true);
      expect(validateEmail("user+tag@example.com")).toBe(true);
    });

    it("should reject invalid email formats", () => {
      expect(validateEmail("invalid")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user @example.com")).toBe(false);
    });

    it("should accept empty email (optional field)", () => {
      expect(validateEmail("")).toBe(true);
    });
  });

  describe("validatePostalCode", () => {
    it("should validate US postal codes", () => {
      expect(validatePostalCode("12345", "US")).toBe(true);
      expect(validatePostalCode("12345-6789", "US")).toBe(true);
      expect(validatePostalCode("1234", "US")).toBe(false);
      expect(validatePostalCode("123456", "US")).toBe(false);
    });

    it("should validate Canadian postal codes", () => {
      expect(validatePostalCode("K1A 0B1", "CA")).toBe(true);
      expect(validatePostalCode("K1A0B1", "CA")).toBe(true);
      expect(validatePostalCode("12345", "CA")).toBe(false);
    });

    it("should validate UK postal codes", () => {
      expect(validatePostalCode("SW1A 1AA", "GB")).toBe(true);
      expect(validatePostalCode("EC1A1BB", "GB")).toBe(true);
      expect(validatePostalCode("12345", "GB")).toBe(false);
    });

    it("should accept any format for other countries", () => {
      expect(validatePostalCode("12345", "FR")).toBe(true);
      expect(validatePostalCode("ABC-123", "DE")).toBe(true);
    });

    it("should accept empty postal code (optional field)", () => {
      expect(validatePostalCode("", "US")).toBe(true);
    });
  });

  describe("validateBirthDate", () => {
    it("should accept valid birth dates", () => {
      const validDate = new Date("1990-01-01");
      expect(validateBirthDate(validDate)).toBe(true);
      expect(validateBirthDate("1990-01-01")).toBe(true);
    });

    it("should reject future dates", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(validateBirthDate(futureDate)).toBe(false);
    });

    it("should reject dates that are too old", () => {
      const oldDate = new Date("1800-01-01");
      expect(validateBirthDate(oldDate)).toBe(false);
    });

    it("should accept dates from 120 years ago", () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 120);
      expect(validateBirthDate(date)).toBe(true);
    });

    it("should reject invalid date strings", () => {
      expect(validateBirthDate("invalid")).toBe(false);
    });
  });

  describe("validateCustomerRegistration", () => {
    const validData: CustomerRegistrationData = {
      firstName: "John",
      lastName: "Doe",
      phone: "+11234567890",
      birthDate: "1990-01-01",
      email: "john@example.com",
      addressLine1: "123 Main St",
      city: "New York",
      state: "NY",
      postalCode: "12345",
      country: "United States",
      consentGiven: true,
    };

    it("should validate complete valid data", () => {
      const errors = validateCustomerRegistration(validData);
      expect(errors).toHaveLength(0);
    });

    it("should validate minimal required data", () => {
      const minimalData: CustomerRegistrationData = {
        firstName: "John",
        lastName: "Doe",
        phone: "+11234567890",
        birthDate: "1990-01-01",
        consentGiven: false,
      };

      const errors = validateCustomerRegistration(minimalData);
      expect(errors).toHaveLength(0);
    });

    it("should return error for missing firstName", () => {
      const data = { ...validData, firstName: "" };
      const errors = validateCustomerRegistration(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "firstName")).toBe(true);
    });

    it("should return error for missing lastName", () => {
      const data = { ...validData, lastName: "" };
      const errors = validateCustomerRegistration(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "lastName")).toBe(true);
    });

    it("should return error for missing phone", () => {
      const data = { ...validData, phone: "" };
      const errors = validateCustomerRegistration(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "phone")).toBe(true);
    });

    it("should return error for missing birthDate", () => {
      const data = { ...validData, birthDate: "" };
      const errors = validateCustomerRegistration(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "birthDate")).toBe(true);
    });

    it("should return error for invalid name", () => {
      const data = { ...validData, firstName: "John123" };
      const errors = validateCustomerRegistration(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "firstName")).toBe(true);
    });

    it("should return error for invalid email", () => {
      const data = { ...validData, email: "invalid-email" };
      const errors = validateCustomerRegistration(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "email")).toBe(true);
    });

    it("should return error for future birth date", () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const data = { ...validData, birthDate: futureDate.toISOString().split("T")[0] };
      const errors = validateCustomerRegistration(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "birthDate")).toBe(true);
    });

    it("should return error for invalid US postal code", () => {
      const data = { ...validData, postalCode: "123", country: "United States" };
      const errors = validateCustomerRegistration(data);

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.field === "postalCode")).toBe(true);
    });

    it("should return multiple errors for multiple invalid fields", () => {
      const data = {
        ...validData,
        firstName: "",
        lastName: "",
        email: "invalid",
      };
      const errors = validateCustomerRegistration(data);

      expect(errors.length).toBeGreaterThanOrEqual(3);
      expect(errors.some((e) => e.field === "firstName")).toBe(true);
      expect(errors.some((e) => e.field === "lastName")).toBe(true);
      expect(errors.some((e) => e.field === "email")).toBe(true);
    });

    it("should trim whitespace from names", () => {
      const data = {
        ...validData,
        firstName: "  John  ",
        lastName: "  Doe  ",
      };
      const errors = validateCustomerRegistration(data);

      expect(errors).toHaveLength(0);
    });

    it("should accept optional fields as undefined", () => {
      const data: CustomerRegistrationData = {
        firstName: "John",
        lastName: "Doe",
        phone: "+11234567890",
        birthDate: "1990-01-01",
        consentGiven: false,
      };

      const errors = validateCustomerRegistration(data);
      expect(errors).toHaveLength(0);
    });
  });
});
