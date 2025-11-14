// Clerk-specific type definitions and metadata schemas

import { UserRole } from "./index";

/**
 * Custom metadata stored in Clerk user object
 * This metadata links Clerk users to our internal user records
 */
export interface ClerkUserMetadata {
  // Public metadata (visible to user)
  publicMetadata: {
    // Currently empty - could add display preferences here
  };

  // Private metadata (only visible server-side)
  privateMetadata: {
    internalUserId?: string; // Our internal User.id
    organizationId?: string; // Organization they belong to
    role?: UserRole; // Their role in the organization
  };

  // Unsafe metadata (can be set from frontend - use with caution)
  unsafeMetadata: {
    // Not used for security-critical data
  };
}

/**
 * Extended Clerk user type with our custom metadata
 */
export interface ClerkUserWithMetadata {
  id: string; // Clerk user ID
  emailAddresses: Array<{
    id: string;
    emailAddress: string;
  }>;
  firstName: string | null;
  lastName: string | null;
  publicMetadata: ClerkUserMetadata["publicMetadata"];
  privateMetadata: ClerkUserMetadata["privateMetadata"];
  unsafeMetadata: ClerkUserMetadata["unsafeMetadata"];
}
