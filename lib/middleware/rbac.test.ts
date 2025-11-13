/**
 * Unit tests for RBAC middleware
 */

import {
  roleHasPermission,
  roleIsAtLeast,
  canManageUsers,
  canManageSettings,
  canCreateCustomers,
  canEditCustomers,
  canDeleteCustomers,
  canViewCustomers,
  getRoleActions,
  isValidRole,
} from "./rbac";
import type { UserRole } from "@/types";

describe("RBAC Middleware", () => {
  describe("roleHasPermission", () => {
    it("should grant SUPER_ADMIN all permissions", () => {
      expect(roleHasPermission("SUPER_ADMIN", "canManageUsers")).toBe(true);
      expect(roleHasPermission("SUPER_ADMIN", "canManageSettings")).toBe(true);
      expect(roleHasPermission("SUPER_ADMIN", "canCreateCustomers")).toBe(true);
      expect(roleHasPermission("SUPER_ADMIN", "canEditCustomers")).toBe(true);
      expect(roleHasPermission("SUPER_ADMIN", "canDeleteCustomers")).toBe(true);
      expect(roleHasPermission("SUPER_ADMIN", "canViewCustomers")).toBe(true);
    });

    it("should grant MANAGER customer management permissions", () => {
      expect(roleHasPermission("MANAGER", "canManageUsers")).toBe(false);
      expect(roleHasPermission("MANAGER", "canManageSettings")).toBe(false);
      expect(roleHasPermission("MANAGER", "canCreateCustomers")).toBe(true);
      expect(roleHasPermission("MANAGER", "canEditCustomers")).toBe(true);
      expect(roleHasPermission("MANAGER", "canDeleteCustomers")).toBe(true);
      expect(roleHasPermission("MANAGER", "canViewCustomers")).toBe(true);
    });

    it("should grant VIEWER only view permissions", () => {
      expect(roleHasPermission("VIEWER", "canManageUsers")).toBe(false);
      expect(roleHasPermission("VIEWER", "canManageSettings")).toBe(false);
      expect(roleHasPermission("VIEWER", "canCreateCustomers")).toBe(false);
      expect(roleHasPermission("VIEWER", "canEditCustomers")).toBe(false);
      expect(roleHasPermission("VIEWER", "canDeleteCustomers")).toBe(false);
      expect(roleHasPermission("VIEWER", "canViewCustomers")).toBe(true);
    });
  });

  describe("roleIsAtLeast", () => {
    it("should correctly compare role hierarchy", () => {
      // SUPER_ADMIN is at least any role
      expect(roleIsAtLeast("SUPER_ADMIN", "SUPER_ADMIN")).toBe(true);
      expect(roleIsAtLeast("SUPER_ADMIN", "MANAGER")).toBe(true);
      expect(roleIsAtLeast("SUPER_ADMIN", "VIEWER")).toBe(true);

      // MANAGER is at least MANAGER or VIEWER
      expect(roleIsAtLeast("MANAGER", "SUPER_ADMIN")).toBe(false);
      expect(roleIsAtLeast("MANAGER", "MANAGER")).toBe(true);
      expect(roleIsAtLeast("MANAGER", "VIEWER")).toBe(true);

      // VIEWER is only at least VIEWER
      expect(roleIsAtLeast("VIEWER", "SUPER_ADMIN")).toBe(false);
      expect(roleIsAtLeast("VIEWER", "MANAGER")).toBe(false);
      expect(roleIsAtLeast("VIEWER", "VIEWER")).toBe(true);
    });
  });

  describe("Permission helper functions", () => {
    describe("canManageUsers", () => {
      it("should only allow SUPER_ADMIN", () => {
        expect(canManageUsers("SUPER_ADMIN")).toBe(true);
        expect(canManageUsers("MANAGER")).toBe(false);
        expect(canManageUsers("VIEWER")).toBe(false);
      });
    });

    describe("canManageSettings", () => {
      it("should only allow SUPER_ADMIN", () => {
        expect(canManageSettings("SUPER_ADMIN")).toBe(true);
        expect(canManageSettings("MANAGER")).toBe(false);
        expect(canManageSettings("VIEWER")).toBe(false);
      });
    });

    describe("canCreateCustomers", () => {
      it("should allow SUPER_ADMIN and MANAGER", () => {
        expect(canCreateCustomers("SUPER_ADMIN")).toBe(true);
        expect(canCreateCustomers("MANAGER")).toBe(true);
        expect(canCreateCustomers("VIEWER")).toBe(false);
      });
    });

    describe("canEditCustomers", () => {
      it("should allow SUPER_ADMIN and MANAGER", () => {
        expect(canEditCustomers("SUPER_ADMIN")).toBe(true);
        expect(canEditCustomers("MANAGER")).toBe(true);
        expect(canEditCustomers("VIEWER")).toBe(false);
      });
    });

    describe("canDeleteCustomers", () => {
      it("should allow SUPER_ADMIN and MANAGER", () => {
        expect(canDeleteCustomers("SUPER_ADMIN")).toBe(true);
        expect(canDeleteCustomers("MANAGER")).toBe(true);
        expect(canDeleteCustomers("VIEWER")).toBe(false);
      });
    });

    describe("canViewCustomers", () => {
      it("should allow all roles", () => {
        expect(canViewCustomers("SUPER_ADMIN")).toBe(true);
        expect(canViewCustomers("MANAGER")).toBe(true);
        expect(canViewCustomers("VIEWER")).toBe(true);
      });
    });
  });

  describe("getRoleActions", () => {
    it("should return all actions for SUPER_ADMIN", () => {
      const actions = getRoleActions("SUPER_ADMIN");
      expect(actions).toContain("canManageUsers");
      expect(actions).toContain("canManageSettings");
      expect(actions).toContain("canCreateCustomers");
      expect(actions).toContain("canEditCustomers");
      expect(actions).toContain("canDeleteCustomers");
      expect(actions).toContain("canViewCustomers");
      expect(actions.length).toBe(6);
    });

    it("should return customer actions for MANAGER", () => {
      const actions = getRoleActions("MANAGER");
      expect(actions).not.toContain("canManageUsers");
      expect(actions).not.toContain("canManageSettings");
      expect(actions).toContain("canCreateCustomers");
      expect(actions).toContain("canEditCustomers");
      expect(actions).toContain("canDeleteCustomers");
      expect(actions).toContain("canViewCustomers");
      expect(actions.length).toBe(4);
    });

    it("should return only view action for VIEWER", () => {
      const actions = getRoleActions("VIEWER");
      expect(actions).not.toContain("canManageUsers");
      expect(actions).not.toContain("canManageSettings");
      expect(actions).not.toContain("canCreateCustomers");
      expect(actions).not.toContain("canEditCustomers");
      expect(actions).not.toContain("canDeleteCustomers");
      expect(actions).toContain("canViewCustomers");
      expect(actions.length).toBe(1);
    });
  });

  describe("isValidRole", () => {
    it("should validate correct role strings", () => {
      expect(isValidRole("SUPER_ADMIN")).toBe(true);
      expect(isValidRole("MANAGER")).toBe(true);
      expect(isValidRole("VIEWER")).toBe(true);
    });

    it("should reject invalid role strings", () => {
      expect(isValidRole("ADMIN")).toBe(false);
      expect(isValidRole("USER")).toBe(false);
      expect(isValidRole("super_admin")).toBe(false);
      expect(isValidRole("")).toBe(false);
      expect(isValidRole("invalid")).toBe(false);
    });
  });

  describe("Role hierarchy enforcement", () => {
    it("should enforce that SUPER_ADMIN > MANAGER > VIEWER", () => {
      // Test minimum role requirements
      const roles: UserRole[] = ["SUPER_ADMIN", "MANAGER", "VIEWER"];

      // Super admin meets all requirements
      roles.forEach((requiredRole) => {
        expect(roleIsAtLeast("SUPER_ADMIN", requiredRole)).toBe(true);
      });

      // Manager meets MANAGER and VIEWER requirements
      expect(roleIsAtLeast("MANAGER", "SUPER_ADMIN")).toBe(false);
      expect(roleIsAtLeast("MANAGER", "MANAGER")).toBe(true);
      expect(roleIsAtLeast("MANAGER", "VIEWER")).toBe(true);

      // Viewer only meets VIEWER requirement
      expect(roleIsAtLeast("VIEWER", "SUPER_ADMIN")).toBe(false);
      expect(roleIsAtLeast("VIEWER", "MANAGER")).toBe(false);
      expect(roleIsAtLeast("VIEWER", "VIEWER")).toBe(true);
    });
  });

  describe("Permission scenarios", () => {
    it("should allow SUPER_ADMIN to do everything", () => {
      const role: UserRole = "SUPER_ADMIN";
      expect(canManageUsers(role)).toBe(true);
      expect(canManageSettings(role)).toBe(true);
      expect(canCreateCustomers(role)).toBe(true);
      expect(canEditCustomers(role)).toBe(true);
      expect(canDeleteCustomers(role)).toBe(true);
      expect(canViewCustomers(role)).toBe(true);
    });

    it("should allow MANAGER to manage customers but not users/settings", () => {
      const role: UserRole = "MANAGER";
      expect(canManageUsers(role)).toBe(false);
      expect(canManageSettings(role)).toBe(false);
      expect(canCreateCustomers(role)).toBe(true);
      expect(canEditCustomers(role)).toBe(true);
      expect(canDeleteCustomers(role)).toBe(true);
      expect(canViewCustomers(role)).toBe(true);
    });

    it("should allow VIEWER to only view customers", () => {
      const role: UserRole = "VIEWER";
      expect(canManageUsers(role)).toBe(false);
      expect(canManageSettings(role)).toBe(false);
      expect(canCreateCustomers(role)).toBe(false);
      expect(canEditCustomers(role)).toBe(false);
      expect(canDeleteCustomers(role)).toBe(false);
      expect(canViewCustomers(role)).toBe(true);
    });
  });
});
