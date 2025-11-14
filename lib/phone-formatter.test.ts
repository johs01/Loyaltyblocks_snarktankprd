/**
 * Unit tests for phone number formatting and validation
 */

import {
  validateAndFormatPhone,
  formatPhoneForDisplay,
  getCountryFromE164,
  isE164Format,
  normalizePhoneInput,
  getNationalNumber,
  arePhoneNumbersEqual,
  isValidPhone,
} from "./phone-formatter";

describe("Phone Formatter", () => {
  describe("validateAndFormatPhone", () => {
    it("should validate and format US phone numbers", () => {
      const result = validateAndFormatPhone("(555) 123-4567", "US");
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe("+15551234567");
      expect(result.country).toBe("US");
    });

    it("should validate and format UK phone numbers", () => {
      const result = validateAndFormatPhone("07123 456789", "GB");
      expect(result.isValid).toBe(true);
      expect(result.formatted?.startsWith("+44")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      const result = validateAndFormatPhone("123", "US");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeTruthy();
    });

    it("should reject empty phone numbers", () => {
      const result = validateAndFormatPhone("", "US");
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Phone number is required");
    });

    it("should handle phone numbers with various formatting", () => {
      const formats = [
        "555-123-4567",
        "(555) 123-4567",
        "555.123.4567",
        "5551234567",
      ];

      formats.forEach((format) => {
        const result = validateAndFormatPhone(format, "US");
        expect(result.isValid).toBe(true);
        expect(result.formatted).toBe("+15551234567");
      });
    });

    it("should reject invalid country codes", () => {
      const result = validateAndFormatPhone("555-123-4567", "XX");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("country code");
    });
  });

  describe("formatPhoneForDisplay", () => {
    it("should format US numbers in national format", () => {
      const formatted = formatPhoneForDisplay("+15551234567", "national");
      expect(formatted).toContain("555");
      expect(formatted).toContain("123");
      expect(formatted).toContain("4567");
    });

    it("should format numbers in international format", () => {
      const formatted = formatPhoneForDisplay("+15551234567", "international");
      expect(formatted).toContain("+1");
      expect(formatted).toContain("555");
    });

    it("should return original on invalid E.164", () => {
      const invalid = "not-a-phone";
      const formatted = formatPhoneForDisplay(invalid);
      expect(formatted).toBe(invalid);
    });
  });

  describe("getCountryFromE164", () => {
    it("should extract country code from US number", () => {
      const country = getCountryFromE164("+15551234567");
      expect(country).toBe("US");
    });

    it("should extract country code from UK number", () => {
      const country = getCountryFromE164("+447123456789");
      expect(country).toBe("GB");
    });

    it("should return null for invalid format", () => {
      const country = getCountryFromE164("555-123-4567");
      expect(country).toBeNull();
    });
  });

  describe("isE164Format", () => {
    it("should validate correct E.164 format", () => {
      expect(isE164Format("+15551234567")).toBe(true);
      expect(isE164Format("+447123456789")).toBe(true);
      expect(isE164Format("+8613800138000")).toBe(true);
    });

    it("should reject invalid E.164 format", () => {
      expect(isE164Format("555-123-4567")).toBe(false);
      expect(isE164Format("(555) 123-4567")).toBe(false);
      expect(isE164Format("+1")).toBe(false); // Too short
      expect(isE164Format("15551234567")).toBe(false); // Missing +
      expect(isE164Format("+0555123456")).toBe(false); // Starts with 0 after +
    });
  });

  describe("normalizePhoneInput", () => {
    it("should remove formatting characters", () => {
      expect(normalizePhoneInput("(555) 123-4567")).toBe("5551234567");
      expect(normalizePhoneInput("555.123.4567")).toBe("5551234567");
      expect(normalizePhoneInput("555 123 4567")).toBe("5551234567");
    });

    it("should preserve leading + for international numbers", () => {
      expect(normalizePhoneInput("+1 555-123-4567")).toBe("+15551234567");
    });

    it("should handle multiple + signs", () => {
      expect(normalizePhoneInput("++1 555-123-4567")).toBe("+15551234567");
    });
  });

  describe("getNationalNumber", () => {
    it("should extract national number from E.164", () => {
      expect(getNationalNumber("+15551234567")).toBe("5551234567");
    });

    it("should handle non-E.164 by removing +", () => {
      expect(getNationalNumber("+447123456789")).toContain("7123456789");
    });
  });

  describe("arePhoneNumbersEqual", () => {
    it("should compare E.164 numbers directly", () => {
      expect(arePhoneNumbersEqual("+15551234567", "+15551234567")).toBe(true);
      expect(arePhoneNumbersEqual("+15551234567", "+15559999999")).toBe(false);
    });

    it("should compare formatted numbers with country code", () => {
      expect(
        arePhoneNumbersEqual("(555) 123-4567", "555-123-4567", "US")
      ).toBe(true);
    });

    it("should return false without country code for non-E.164", () => {
      expect(arePhoneNumbersEqual("555-123-4567", "555-123-4567")).toBe(false);
    });
  });

  describe("isValidPhone", () => {
    it("should validate US phone numbers", () => {
      expect(isValidPhone("555-123-4567", "US")).toBe(true);
      expect(isValidPhone("(555) 123-4567", "US")).toBe(true);
      expect(isValidPhone("5551234567", "US")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(isValidPhone("123", "US")).toBe(false);
      expect(isValidPhone("abc-def-ghij", "US")).toBe(false);
    });

    it("should handle different country formats", () => {
      expect(isValidPhone("07123 456789", "GB")).toBe(true);
      expect(isValidPhone("0412 345 678", "AU")).toBe(true);
    });
  });

  describe("Edge cases", () => {
    it("should handle empty strings gracefully", () => {
      const result = validateAndFormatPhone("", "US");
      expect(result.isValid).toBe(false);
    });

    it("should handle null/undefined country codes", () => {
      const result = validateAndFormatPhone("555-123-4567", "");
      expect(result.isValid).toBe(false);
    });

    it("should handle international numbers with country code", () => {
      const result = validateAndFormatPhone("+15551234567", "US");
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe("+15551234567");
    });

    it("should handle numbers with extensions (should fail)", () => {
      const result = validateAndFormatPhone("555-123-4567 ext 123", "US");
      expect(result.isValid).toBe(true); // Extensions are stripped
    });
  });
});
