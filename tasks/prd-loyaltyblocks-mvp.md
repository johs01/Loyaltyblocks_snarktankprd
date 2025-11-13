# Product Requirements Document (PRD)
## Loyaltyblocks MVP - Multi-Tenant SaaS Platform

---

## 1. Introduction/Overview

**Loyaltyblocks** is a multi-tenant Software-as-a-Service (SaaS) platform designed to help businesses manage customer databases and loyalty programs. The MVP focuses on establishing a robust foundation for customer registration and management with multi-tenant path-based tenancy architecture.

The platform will be built using **Next.js** with **Clerk** for authentication and **Neon** for database management, following industry best practices for multi-tenant applications. The initial focus is on creating a frictionless customer registration experience while providing internal users with full CRUD capabilities over the customer database.

**Problem Solved:** Businesses need a secure, scalable, and easy-to-use platform to collect and manage customer information while maintaining data isolation across multiple tenants.

---

## 2. Goals

1. **Establish Multi-Tenant Architecture:** Implement a secure, path-based multi-tenant structure that isolates data by organization while using a single database.
2. **Streamline Customer Registration:** Create a frictionless public-facing registration flow requiring minimal information (name, surname, phone, birthdate) with pre-checked consent.
3. **Enable Internal User Management:** Allow the first registrant to become a super admin and manage additional internal users with role-based access.
4. **Ensure Data Integrity:** Implement real-time phone number validation, uniqueness checks, and country-specific formatting based on tenant settings.
5. **Provide Administrative Control:** Allow admins to manage customer data with full CRUD operations and configure tenant-specific settings (country selection, phone number formats).

---

## 3. User Stories

### Story 1: Customer Self-Registration (Public-Facing)
**As a** customer
**I want to** quickly register with minimal information
**So that** I can join the loyalty program without friction

**Acceptance Criteria:**
- Registration form requires only: name, surname, phone number, and birthdate
- Consent checkbox is pre-checked
- Form provides real-time validation as I type
- Phone number format updates based on tenant's country setting
- Duplicate phone numbers are prevented with real-time feedback
- After successful registration, customer is added to the database

### Story 2: Tenant Settings Configuration
**As a** super admin
**I want to** configure my tenant's country setting
**So that** phone numbers are formatted correctly and comply with local regulations

**Acceptance Criteria:**
- Settings route displays a dropdown with all countries
- Default country is "United States"
- Selection is saved to the tenant configuration
- Phone number formatting on public form updates immediately after country change
- Address fields support country-specific variations

### Story 3: Internal User Management (Super Admin)
**As a** first registrant (super admin)
**I want to** create internal users with different permission levels
**So that** my team can manage customer data appropriately

**Acceptance Criteria:**
- Super Admin can create new internal users with assigned roles
- Available roles: Super Admin, Manager (can add/edit customers), Viewer (read-only)
- Each user can be assigned to one role
- Super Admin can modify or revoke user access
- User creation includes assignment of email and password/authentication method

### Story 4: Customer Database Management (Internal)
**As a** manager
**I want to** perform full CRUD operations on customer records
**So that** I can maintain accurate customer information

**Acceptance Criteria:**
- View all customers in a searchable, sortable list
- Add new customers (matching registration form requirements)
- Edit existing customer records
- Delete customer records (with confirmation)
- View detailed customer information including full address and optional fields
- All changes are logged and associated with the user who made them

### Story 5: First Registrant Becomes Super Admin
**As a** business owner registering on Loyaltyblocks
**I want to** automatically become the super admin of my tenant
**So that** I have full control of my account from day one

**Acceptance Criteria:**
- The first customer to register in a new tenant is marked as super admin
- Super Admin has access to both public and internal dashboards
- Super Admin can immediately access the Settings and User Management routes
- Subsequent registrants via public form do not have admin privileges

---

## 4. Functional Requirements

### 4.1 Public-Facing Customer Registration

1. **Customer Registration Form** (`/add-customer` route)
   - Display a clean, mobile-responsive form requiring:
     - First Name (required, text input)
     - Surname (required, text input)
     - Cell Phone Number (required, with country-specific masking)
     - Birth Date (required, date picker)
     - Consent Checkbox (required, pre-checked with text: "I consent to provide this information")

2. **Real-Time Phone Number Validation**
   - As the user types, validate phone number format against the tenant's country setting
   - Display validation message in real-time (green checkmark for valid, red X for invalid)
   - Check for duplicate phone numbers in the database with real-time feedback
   - If duplicate detected, show error: "This phone number is already registered"
   - Allow user to correct and re-validate without page reload

3. **Country-Specific Phone Masking**
   - Retrieve the tenant's country setting from Settings route
   - Apply country-specific phone number mask (e.g., (XXX) XXX-XXXX for US, different formats for other countries)
   - Format and validate according to international phone number standards

4. **Form Validation**
   - Real-time validation as user types (not just on submit)
   - Display inline error messages for each field
   - Prevent form submission if any validation fails
   - Clear error messages when user corrects input

5. **Successful Registration**
   - On successful submission, store customer data in the database with tenant ID
   - Show success message and redirect to a confirmation page (or email confirmation if email exists)
   - Do not require login for public registrants

6. **Address Fields (Optional)**
   - Include optional fields for full address:
     - Street Address
     - City
     - State/Province
     - Postal Code
     - Country
   - These fields are optional but should be present for MVP

### 4.2 Settings Route (Admin)

7. **Country Selection Dropdown**
   - Display dropdown menu with all countries in the world (alphabetically sorted)
   - Default selection: "United States"
   - On selection change, save to tenant configuration immediately
   - Dynamically update phone number formatting on `/add-customer` form

8. **Settings Persistence**
   - Store selected country in tenant settings table
   - Ensure settings are retrieved on every request for `/add-customer` form
   - Allow only authenticated super admin users to access Settings route

### 4.3 Internal User Management

9. **Super Admin Dashboard Access**
   - First registrant automatically assigned super admin role
   - Super admin can access `/admin`, `/settings`, and customer management routes
   - Super admin sees an "Invite User" button in the UI

10. **Create Internal Users**
    - Super admin can invite internal users via email or manual creation
    - Assign each user to one of three roles:
      - **Super Admin:** Full access to all features and user management
      - **Manager:** Can perform full CRUD on customer records, view settings
      - **Viewer:** Read-only access to customer records and reports
    - Store user role with tenant ID to ensure proper access control

11. **User Authentication via Clerk**
    - Internal users authenticate via Clerk
    - Clerk integration ensures secure session management
    - Tenant context derived from URL path (path-based tenancy)

12. **Role-Based Access Control (RBAC)**
    - Implement middleware/guards to check user role before allowing access
    - Super Admin: Full access
    - Manager: Can view/add/edit/delete customers
    - Viewer: View-only access to customers
    - Enforce RBAC on both API routes and UI components

### 4.4 Customer Database Management (Internal)

13. **Customer List View**
    - Display all customers in a table format with columns:
      - Name (surname, first name)
      - Phone Number
      - Birth Date
      - Email (if provided)
      - Date Added
      - Actions (Edit, Delete)
    - Include search functionality (search by name or phone)
    - Include sorting by any column
    - Pagination for lists exceeding 50 customers

14. **Customer Detail View**
    - Display all customer information:
      - Personal: Name, Surname, Phone, Birth Date
      - Contact: Email (if provided)
      - Address: Street, City, State, Postal Code, Country (if provided)
      - Metadata: Date Created, Date Modified, Created By, Last Modified By
    - Show edit and delete options

15. **Add Customer (Internal)**
    - Manager/Super Admin can add customers via an internal form
    - Form mirrors the public registration form but accessible only to authenticated users
    - Allow adding optional email and address fields

16. **Edit Customer**
    - Manager/Super Admin can edit any customer field
    - Validate phone number uniqueness on edit (excluding the current customer)
    - Track modification timestamp and user who modified the record
    - Show a confirmation dialog before saving changes

17. **Delete Customer**
    - Manager/Super Admin can delete customer records
    - Show confirmation dialog: "Are you sure you want to delete this customer?"
    - Log deletion action with timestamp and user who deleted it
    - Customer data is permanently removed from the database

---

## 5. Non-Goals (Out of Scope)

1. **Email Verification:** Customer registration does not require email confirmation in MVP.
2. **Multi-Language Support:** The interface is English-only for MVP (can be added in future phases).
3. **Advanced Loyalty Features:** No loyalty points, redemption systems, or tiered membership in MVP.
4. **SMS/Email Notifications:** No automated notifications to customers for MVP.
5. **Audit Trails & History:** While we log user actions, no detailed audit UI in MVP.
6. **API Access for External Integrations:** No public API in MVP.
7. **Custom Branding:** White-labeling and custom branding are future features.
8. **Advanced Reporting & Analytics:** MVP focuses on basic customer management, not advanced reporting.
9. **Two-Factor Authentication:** Basic Clerk authentication without 2FA for MVP.

---

## 6. Design Considerations

### UI/UX Requirements

1. **Public Registration Form (`/add-customer`)**
   - Mobile-first, responsive design
   - Minimal fields, clean interface
   - Real-time validation feedback with clear icons and messages
   - Single-column layout for mobile
   - Estimated completion time: < 2 minutes
   - Call-to-action: "Register Now" or "Join Our Program"

2. **Settings Route**
   - Simple, clean dropdown for country selection
   - Save feedback (e.g., "Settings saved successfully")
   - Only accessible to authenticated super admin

3. **Internal Admin Dashboard**
   - Navigation menu with links to: Customers, Settings, User Management
   - Customer table with search, sort, and pagination
   - Modal dialogs for add/edit customer forms
   - Confirmation dialogs for delete actions

4. **Responsive Design**
   - All forms and tables must work seamlessly on mobile, tablet, and desktop
   - Phone number input should use HTML5 tel input type for mobile keyboard support

### Component Reusability

- Create reusable form components for phone number, date picker, and consent checkbox
- Use consistent styling with a design system (Tailwind CSS recommended)
- Ensure accessibility (WCAG 2.1 AA compliance) with proper labels and ARIA attributes

---

## 7. Technical Considerations

### Multi-Tenant Architecture (Path-Based Tenancy)

1. **URL Structure:** Routes follow pattern `/[tenantId]/...`
   - Public form: `/[tenantId]/add-customer`
   - Admin: `/[tenantId]/admin`
   - Settings: `/[tenantId]/admin/settings`
   - User Management: `/[tenantId]/admin/users`

2. **Tenant Identification**
   - Extract tenant ID from URL path in middleware
   - Pass tenant context to all database queries
   - Ensure no cross-tenant data leakage

3. **Database Architecture (Neon PostgreSQL)**
   - Use Row-Level Security (RLS) with tenant_id column for data isolation
   - Tables: `organizations`, `customers`, `users`, `user_roles`, `organization_settings`
   - Foreign key constraints to maintain data integrity
   - Indexes on tenant_id for query performance

4. **Authentication with Clerk**
   - Integrate Clerk for user authentication
   - Map Clerk user to internal users table
   - Store tenant_id with each user record
   - Use Clerk metadata to store user role and tenant assignment

5. **Phone Number Handling**
   - Use library like `libphonenumber-js` for validation and formatting
   - Store phone numbers in E.164 international format (e.g., +1234567890)
   - Display formatted based on tenant's country setting
   - Enforce uniqueness at database level with unique constraint on (tenant_id, phone_number)

6. **API Routes**
   - `/api/[tenantId]/customers` - GET (list), POST (create)
   - `/api/[tenantId]/customers/[customerId]` - GET (detail), PUT (update), DELETE
   - `/api/[tenantId]/customers/validate-phone` - POST (real-time validation/duplicate check)
   - `/api/[tenantId]/settings` - GET, PUT
   - `/api/[tenantId]/users` - GET (list), POST (create)
   - `/api/auth/register` - POST (customer registration, public)

7. **Security Measures**
   - Implement RBAC middleware on protected routes
   - Validate tenant context from URL against user's assigned tenants
   - Use environment variables for sensitive configuration
   - Implement rate limiting on registration endpoint
   - CSRF protection on all forms
   - Input sanitization and validation on all endpoints

8. **Database Migrations**
   - Use a migration tool (e.g., Prisma, Knex) for schema management
   - Version control all database changes
   - Document schema design following multi-tenant best practices

---

## 8. Success Metrics

1. **Registration Conversion:** At least 80% of users who land on `/add-customer` complete registration (measure by tracking session drops).
2. **Data Quality:** 95% of registered customers have valid, unique phone numbers (measure by validation rate).
3. **Time to Register:** Average registration completion time < 90 seconds (measure with client-side analytics).
4. **System Reliability:** 99.9% uptime for registration and admin endpoints.
5. **Admin User Adoption:** 100% of super admins complete at least one internal user creation (future tracking).
6. **Phone Validation Accuracy:** Real-time duplicate detection catch 100% of duplicate phone submissions.
7. **Form Error Rate:** < 5% of submissions fail on first attempt (measure by real-time validation feedback).

---

## 9. Open Questions

1. **Email Notifications:** Should customers receive a confirmation email after registration, and if so, what should it contain?
2. **Phone Number International Dialing:** Should the form include a country code selector in addition to the country setting in Settings?
3. **Pagination Defaults:** What is the preferred default page size for the customer list (25, 50, 100 rows)?
4. **Deletion Soft-Delete:** Should deleted customers be soft-deleted (marked as deleted but retained) or hard-deleted from the database?
5. **Birthdate Privacy:** Is there any age restriction for registration, or should the birthdate field have validation?
6. **User Invitation Method:** Should internal users be invited via email link (auto-signup) or just notified with credentials?
7. **Default Tenant Setup:** When a user registers, should a tenant be created automatically, or is there an admin signup process?
8. **Phone Number Formats:** Should we support extensions or special characters in phone numbers, or enforce strict formatting?

---

## 10. Implementation Notes for Developers

- Follow Next.js 13+ App Router best practices (not Pages Router)
- Use TypeScript for type safety across the codebase
- Implement proper error handling with user-friendly error messages
- Use environment variables for all configuration (database, Clerk API keys, etc.)
- Write unit tests for validation logic (phone number, email, etc.)
- Document API endpoints with clear parameter and response specifications
- Use Prisma ORM or similar for type-safe database access
- Implement proper logging for debugging and monitoring
- Set up CI/CD pipeline for automated testing and deployment

---

**Document Version:** 1.0
**Last Updated:** November 13, 2024
**Status:** Ready for Development