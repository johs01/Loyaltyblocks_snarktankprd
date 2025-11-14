// Core type definitions for LoyaltyBlocks application
// These types complement Prisma-generated types and provide additional type safety

/**
 * User roles with hierarchical permissions
 */
export type UserRole = "SUPER_ADMIN" | "MANAGER" | "VIEWER";

/**
 * Permission levels mapped to roles
 */
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canManageUsers: true,
    canManageSettings: true,
    canCreateCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    canViewCustomers: true,
  },
  MANAGER: {
    canManageUsers: false,
    canManageSettings: false,
    canCreateCustomers: true,
    canEditCustomers: true,
    canDeleteCustomers: true,
    canViewCustomers: true,
  },
  VIEWER: {
    canManageUsers: false,
    canManageSettings: false,
    canCreateCustomers: false,
    canEditCustomers: false,
    canDeleteCustomers: false,
    canViewCustomers: true,
  },
} as const;

/**
 * Customer registration form data
 */
export interface CustomerRegistrationData {
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
}

/**
 * Customer update data (for internal admin use)
 */
export interface CustomerUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  birthDate?: Date | string;
  email?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string | null;
}

/**
 * User creation data
 */
export interface UserCreationData {
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
}

/**
 * Organization settings data
 */
export interface OrganizationSettingsData {
  country: string;
}

/**
 * Tenant context that flows through requests
 */
export interface TenantContext {
  organizationId: string;
  organizationSlug: string;
}

/**
 * Authenticated user context (from Clerk + our DB)
 */
export interface AuthenticatedUser {
  id: string; // Our internal user ID
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
}

/**
 * API response wrapper for success
 */
export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * API response wrapper for errors
 */
export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: Record<string, string[]>; // Validation errors
}

/**
 * Combined API response type
 */
export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

/**
 * Customer list filters
 */
export interface CustomerFilters {
  search?: string; // Search by name or phone
  sortBy?: "firstName" | "lastName" | "phone" | "birthDate" | "createdAt";
  sortOrder?: "asc" | "desc";
}

/**
 * Phone validation result
 */
export interface PhoneValidationResult {
  isValid: boolean;
  formatted?: string; // E.164 format
  country?: string;
  error?: string;
}

/**
 * Phone availability check result
 */
export interface PhoneAvailabilityResult {
  available: boolean;
  message?: string;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Supported countries for phone formatting
 */
export interface CountryInfo {
  code: string; // ISO 3166-1 alpha-2 code (e.g., "US")
  name: string; // Display name (e.g., "United States")
  dialCode: string; // International dial code (e.g., "+1")
  format?: string; // Display format pattern (e.g., "(###) ###-####")
}
