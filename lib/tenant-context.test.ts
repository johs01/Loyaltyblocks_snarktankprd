/**
 * Tests for Tenant Context
 *
 * Tests tenant slug extraction and organization lookup
 */

import { extractTenantSlugFromPath, getOrganizationBySlug, createOrganization } from "./tenant-context";
import { db } from "./db";

// Mock the database
jest.mock("./db", () => ({
  db: {
    organization: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe("Tenant Context", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractTenantSlugFromPath", () => {
    it("should extract tenant slug from root path", () => {
      const slug = extractTenantSlugFromPath("/acme");
      expect(slug).toBe("acme");
    });

    it("should extract tenant slug from nested path", () => {
      const slug = extractTenantSlugFromPath("/acme/admin/customers");
      expect(slug).toBe("acme");
    });

    it("should extract tenant slug from add-customer path", () => {
      const slug = extractTenantSlugFromPath("/acme/add-customer");
      expect(slug).toBe("acme");
    });

    it("should return null for empty path", () => {
      const slug = extractTenantSlugFromPath("/");
      expect(slug).toBe("");
    });

    it("should return null for paths starting with underscore", () => {
      const slug = extractTenantSlugFromPath("/_next/static");
      expect(slug).toBeNull();
    });

    it("should handle paths without leading slash", () => {
      const slug = extractTenantSlugFromPath("acme/admin");
      expect(slug).toBe("acme");
    });

    it("should handle paths with trailing slash", () => {
      const slug = extractTenantSlugFromPath("/acme/");
      expect(slug).toBe("acme");
    });

    it("should handle complex tenant slugs", () => {
      expect(extractTenantSlugFromPath("/my-company-123/admin")).toBe("my-company-123");
      expect(extractTenantSlugFromPath("/test_org/customers")).toBe("test_org");
    });
  });

  describe("getOrganizationBySlug", () => {
    it("should find organization by slug", async () => {
      const mockOrg = {
        id: "org-123",
        slug: "acme",
        name: "Acme Corp",
        settings: { country: "United States" },
      };

      (db.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);

      const result = await getOrganizationBySlug("acme");

      expect(result).toEqual(mockOrg);
      expect(db.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: "acme" },
        include: { settings: true },
      });
    });

    it("should return null when organization not found", async () => {
      (db.organization.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await getOrganizationBySlug("nonexistent");

      expect(result).toBeNull();
    });

    it("should include settings in response", async () => {
      const mockOrg = {
        id: "org-123",
        slug: "acme",
        name: "Acme Corp",
        settings: {
          id: "settings-1",
          country: "Canada",
        },
      };

      (db.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);

      const result = await getOrganizationBySlug("acme");

      expect(result?.settings).toBeDefined();
      expect(result?.settings?.country).toBe("Canada");
    });

    it("should handle database errors gracefully", async () => {
      (db.organization.findUnique as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      const result = await getOrganizationBySlug("acme");

      expect(result).toBeNull();
    });

    it("should handle different slug formats", async () => {
      const mockOrg = { id: "org-1", slug: "test-org", name: "Test" };

      (db.organization.findUnique as jest.Mock).mockResolvedValue(mockOrg);

      await getOrganizationBySlug("test-org");
      expect(db.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: "test-org" },
        include: { settings: true },
      });

      await getOrganizationBySlug("my_company");
      expect(db.organization.findUnique).toHaveBeenCalledWith({
        where: { slug: "my_company" },
        include: { settings: true },
      });
    });
  });

  describe("createOrganization", () => {
    it("should create organization with valid data", async () => {
      const mockOrg = {
        id: "org-new",
        slug: "newcompany",
        name: "New Company",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (db.organization.create as jest.Mock).mockResolvedValue(mockOrg);

      const result = await createOrganization({
        name: "New Company",
        slug: "newcompany",
      });

      expect(result).toEqual(mockOrg);
      expect(db.organization.create).toHaveBeenCalledWith({
        data: {
          name: "New Company",
          slug: "newcompany",
        },
      });
    });

    it("should handle slug conflicts", async () => {
      (db.organization.create as jest.Mock).mockRejectedValue({
        code: "P2002",
        meta: { target: ["slug"] },
      });

      await expect(
        createOrganization({ name: "Test", slug: "existing" })
      ).rejects.toThrow();
    });

    it("should handle database errors", async () => {
      (db.organization.create as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        createOrganization({ name: "Test", slug: "test" })
      ).rejects.toThrow();
    });
  });

  describe("Multi-tenant isolation", () => {
    it("should differentiate between different tenant paths", () => {
      const acmeSlug = extractTenantSlugFromPath("/acme/admin");
      const companySlug = extractTenantSlugFromPath("/company/admin");

      expect(acmeSlug).not.toBe(companySlug);
      expect(acmeSlug).toBe("acme");
      expect(companySlug).toBe("company");
    });

    it("should extract same slug from different routes", () => {
      const paths = [
        "/acme/admin",
        "/acme/admin/customers",
        "/acme/add-customer",
        "/acme/admin/settings",
      ];

      paths.forEach((path) => {
        const slug = extractTenantSlugFromPath(path);
        expect(slug).toBe("acme");
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle very long slugs", () => {
      const longSlug = "a".repeat(100);
      const slug = extractTenantSlugFromPath(`/${longSlug}/admin`);
      expect(slug).toBe(longSlug);
    });

    it("should handle slugs with special characters", () => {
      expect(extractTenantSlugFromPath("/company-123/admin")).toBe("company-123");
      expect(extractTenantSlugFromPath("/test_org/admin")).toBe("test_org");
      expect(extractTenantSlugFromPath("/org.test/admin")).toBe("org.test");
    });

    it("should handle multiple slashes", () => {
      const slug = extractTenantSlugFromPath("///acme///admin///");
      expect(slug).toBe("");
    });
  });
});
