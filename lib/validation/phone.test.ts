/**
 * Tests for Phone Validation with Database
 *
 * Tests phone validation, uniqueness checking, and database integration
 */

import {
  checkPhoneAvailability,
  validatePhoneAndCheckAvailability,
  verifyCustomerPhone,
  getCustomerByPhone,
} from "../validation/phone";
import { db } from "../db";

// Mock the database
jest.mock("../db", () => ({
  db: {
    customer: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  },
}));

// Mock phone formatter
jest.mock("../phone-formatter", () => ({
  validateAndFormatPhone: jest.fn((phone) => {
    if (phone === "+11234567890") {
      return { isValid: true, formatted: "+11234567890" };
    }
    if (phone === "1234567890") {
      return { isValid: true, formatted: "+11234567890" };
    }
    if (phone === "invalid") {
      return { isValid: false, error: "Invalid phone number" };
    }
    return { isValid: true, formatted: `+1${phone}` };
  }),
  isE164Format: jest.fn((phone) => phone.startsWith("+")),
}));

describe("Phone Validation with Database", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkPhoneAvailability", () => {
    it("should return available when phone is not registered", async () => {
      (db.customer.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await checkPhoneAvailability("+11234567890", "org-123");

      expect(result.available).toBe(true);
      expect(result.message).toBe("Phone number is available");
      expect(db.customer.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: "org-123",
          phone: "+11234567890",
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });
    });

    it("should return unavailable when phone is already registered", async () => {
      (db.customer.findFirst as jest.Mock).mockResolvedValue({
        id: "customer-1",
        firstName: "John",
        lastName: "Doe",
      });

      const result = await checkPhoneAvailability("+11234567890", "org-123");

      expect(result.available).toBe(false);
      expect(result.message).toBe("Phone number already registered to John Doe");
    });

    it("should exclude specific customer when checking availability", async () => {
      (db.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await checkPhoneAvailability("+11234567890", "org-123", "customer-exclude");

      expect(db.customer.findFirst).toHaveBeenCalledWith({
        where: {
          organizationId: "org-123",
          phone: "+11234567890",
          id: { not: "customer-exclude" },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      });
    });

    it("should reject non-E164 format", async () => {
      const result = await checkPhoneAvailability("1234567890", "org-123");

      expect(result.available).toBe(false);
      expect(result.message).toBe("Phone number must be in E.164 format");
      expect(db.customer.findFirst).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      (db.customer.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await checkPhoneAvailability("+11234567890", "org-123");

      expect(result.available).toBe(false);
      expect(result.message).toBe("Error checking phone availability");
    });
  });

  describe("validatePhoneAndCheckAvailability", () => {
    it("should validate and check availability successfully", async () => {
      (db.customer.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await validatePhoneAndCheckAvailability(
        "1234567890",
        "US",
        "org-123"
      );

      expect(result.isValid).toBe(true);
      expect(result.available).toBe(true);
      expect(result.formatted).toBe("+11234567890");
    });

    it("should return error when phone format is invalid", async () => {
      const result = await validatePhoneAndCheckAvailability(
        "invalid",
        "US",
        "org-123"
      );

      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Invalid phone number");
      expect(db.customer.findFirst).not.toHaveBeenCalled();
    });

    it("should return error when phone is not available", async () => {
      (db.customer.findFirst as jest.Mock).mockResolvedValue({
        id: "customer-1",
        firstName: "Jane",
        lastName: "Smith",
      });

      const result = await validatePhoneAndCheckAvailability(
        "1234567890",
        "US",
        "org-123"
      );

      expect(result.isValid).toBe(true);
      expect(result.available).toBe(false);
      expect(result.error).toBe("Phone number already registered to Jane Smith");
    });

    it("should exclude customer ID when provided", async () => {
      (db.customer.findFirst as jest.Mock).mockResolvedValue(null);

      await validatePhoneAndCheckAvailability(
        "1234567890",
        "US",
        "org-123",
        "customer-exclude"
      );

      expect(db.customer.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            id: { not: "customer-exclude" },
          }),
        })
      );
    });
  });

  describe("verifyCustomerPhone", () => {
    it("should verify matching phone number", async () => {
      (db.customer.findUnique as jest.Mock).mockResolvedValue({
        phone: "+11234567890",
      });

      const result = await verifyCustomerPhone(
        "+11234567890",
        "customer-1",
        "org-123"
      );

      expect(result).toBe(true);
      expect(db.customer.findUnique).toHaveBeenCalledWith({
        where: {
          id: "customer-1",
          organizationId: "org-123",
        },
        select: {
          phone: true,
        },
      });
    });

    it("should return false for non-matching phone", async () => {
      (db.customer.findUnique as jest.Mock).mockResolvedValue({
        phone: "+19876543210",
      });

      const result = await verifyCustomerPhone(
        "+11234567890",
        "customer-1",
        "org-123"
      );

      expect(result).toBe(false);
    });

    it("should return false when customer not found", async () => {
      (db.customer.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await verifyCustomerPhone(
        "+11234567890",
        "customer-1",
        "org-123"
      );

      expect(result).toBe(false);
    });

    it("should handle database errors gracefully", async () => {
      (db.customer.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await verifyCustomerPhone(
        "+11234567890",
        "customer-1",
        "org-123"
      );

      expect(result).toBe(false);
    });
  });

  describe("getCustomerByPhone", () => {
    it("should find customer by phone number", async () => {
      const mockCustomer = {
        id: "customer-1",
        firstName: "John",
        phone: "+11234567890",
      };

      (db.customer.findFirst as jest.Mock).mockResolvedValue(mockCustomer);

      const result = await getCustomerByPhone("+11234567890", "org-123");

      expect(result).toEqual(mockCustomer);
      expect(db.customer.findFirst).toHaveBeenCalledWith({
        where: {
          phone: "+11234567890",
          organizationId: "org-123",
        },
      });
    });

    it("should return null when customer not found", async () => {
      (db.customer.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await getCustomerByPhone("+11234567890", "org-123");

      expect(result).toBeNull();
    });

    it("should reject non-E164 format", async () => {
      const result = await getCustomerByPhone("1234567890", "org-123");

      expect(result).toBeNull();
      expect(db.customer.findFirst).not.toHaveBeenCalled();
    });

    it("should handle database errors gracefully", async () => {
      (db.customer.findFirst as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getCustomerByPhone("+11234567890", "org-123");

      expect(result).toBeNull();
    });
  });
});
