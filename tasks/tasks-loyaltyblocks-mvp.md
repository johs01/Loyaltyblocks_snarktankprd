# Loyaltyblocks MVP - Implementation Task List

## Relevant Files

### Core Architecture & Setup
- `app/layout.tsx` - Root layout with Clerk provider and global styles
- `app/[tenantId]/layout.tsx` - Tenant-specific layout with tenant context
- `middleware.ts` - Tenant extraction and routing middleware
- `lib/auth.ts` - Authentication and authorization utilities
- `lib/db.ts` - Database client initialization and setup
- `lib/tenant-context.ts` - Tenant context utilities and helpers
- `.env.local` - Environment variables template

### Database & Schema
- `prisma/schema.prisma` - Database schema definition (organizations, customers, users, settings)
- `prisma/migrations/` - Database migration files
- `lib/db/seed.ts` - Database seeding script for development

### Public Registration
- `app/[tenantId]/add-customer/page.tsx` - Public registration form page
- `app/[tenantId]/add-customer/components/RegistrationForm.tsx` - Reusable registration form component
- `app/[tenantId]/add-customer/success/page.tsx` - Registration success page
- `api/[tenantId]/auth/register/route.ts` - Customer registration API endpoint
- `api/[tenantId]/customers/validate-phone/route.ts` - Phone validation API endpoint
- `lib/validation/phone.ts` - Phone number validation and formatting utilities
- `lib/validation/phone.test.ts` - Unit tests for phone validation

### Internal Admin Dashboard
- `app/[tenantId]/admin/layout.tsx` - Admin dashboard layout with navigation
- `app/[tenantId]/admin/page.tsx` - Admin dashboard home page
- `app/[tenantId]/admin/customers/page.tsx` - Customer list view page
- `app/[tenantId]/admin/customers/[customerId]/page.tsx` - Customer detail page
- `app/[tenantId]/admin/settings/page.tsx` - Settings configuration page
- `app/[tenantId]/admin/users/page.tsx` - User management page
- `app/[tenantId]/admin/users/create/page.tsx` - Create/invite user form page

### Components
- `components/CustomerTable.tsx` - Reusable table component for customer list
- `components/CustomerForm.tsx` - Reusable form component for add/edit customer
- `components/PhoneInput.tsx` - Reusable phone input with real-time validation
- `components/DatePicker.tsx` - Date picker component for birthdate
- `components/ConsentCheckbox.tsx` - Consent checkbox component
- `components/ConfirmationDialog.tsx` - Confirmation dialog for delete/critical actions
- `components/CountrySelector.tsx` - Country dropdown selector component
- `components/Navigation.tsx` - Admin navigation menu

### API Routes
- `api/[tenantId]/customers/route.ts` - GET (list), POST (create) customers
- `api/[tenantId]/customers/[customerId]/route.ts` - GET (detail), PUT (update), DELETE customer
- `api/[tenantId]/settings/route.ts` - GET, PUT tenant settings
- `api/[tenantId]/users/route.ts` - GET (list), POST (create) internal users
- `api/auth/register/route.ts` - Public customer registration

### Middleware & Security
- `middleware.ts` - Tenant context extraction and routing
- `lib/middleware/rbac.ts` - Role-based access control middleware
- `lib/middleware/rbac.test.ts` - Unit tests for RBAC

### Utilities & Helpers
- `lib/countries.ts` - Countries list and phone format mappings
- `lib/countries.test.ts` - Unit tests for countries data
- `lib/phone-formatter.ts` - Phone number formatting by country
- `lib/phone-formatter.test.ts` - Unit tests for phone formatter
- `lib/validation/form.ts` - Form validation utilities
- `lib/validation/form.test.ts` - Unit tests for form validation
- `lib/database/queries.ts` - Database query helpers with tenant isolation
- `lib/database/queries.test.ts` - Unit tests for database queries

### Styling
- `styles/globals.css` - Global styles
- `tailwind.config.ts` - Tailwind CSS configuration (if using Tailwind)

### Configuration & Types
- `types/index.ts` - TypeScript type definitions
- `types/clerk.ts` - Clerk-specific types
- `next.config.js` - Next.js configuration
- `tsconfig.json` - TypeScript configuration

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `PhoneInput.tsx` and `PhoneInput.test.tsx` in the same directory).
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.
- Database migrations should be version-controlled and reviewed before deployment.

---

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

---

## Tasks

### Phase 0: Project Setup

- [x] 0.0 Create feature branch
  - [x] 0.1 Create and checkout a new branch for this feature (e.g., `git checkout -b feature/loyaltyblocks-mvp`)

### Phase 1: Multi-Tenant Architecture & Database Setup

- [x] 1.0 Set up Clerk authentication and tenant context
  - [x] 1.1 Install and configure Clerk in the Next.js project
  - [x] 1.2 Create Clerk API routes for authentication flow
  - [x] 1.3 Set up Clerk metadata schema to store tenant_id and user role
  - [x] 1.4 Create `lib/auth.ts` with utility functions for getting current user and checking roles
  - [x] 1.5 Add Clerk provider to root layout (`app/layout.tsx`)

- [x] 1.1 Design and implement database schema
  - [x] 1.1.1 Create Prisma schema with all required tables: organizations, customers, users, organization_settings
  - [x] 1.1.2 Add Row-Level Security (RLS) considerations in schema design (tenant_id on all tables)
  - [x] 1.1.3 Define relationships and foreign key constraints
  - [x] 1.1.4 Create database indexes on tenant_id for performance
  - [x] 1.1.5 Document schema design in comments

- [x] 1.2 Set up tenant context and middleware
  - [x] 1.2.1 Create `lib/tenant-context.ts` with utilities to extract and manage tenant context
  - [x] 1.2.2 Implement `middleware.ts` to extract tenant ID from URL and validate against user's tenants
  - [x] 1.2.3 Create tenant context provider/header for passing tenant ID through requests
  - [x] 1.2.4 Test middleware with multiple tenants to ensure proper isolation

- [x] 1.3 Create database connection and Prisma client
  - [x] 1.3.1 Set up Neon PostgreSQL connection string in `.env.local`
  - [x] 1.3.2 Initialize Prisma client in `lib/db.ts`
  - [x] 1.3.3 Create and run Prisma migrations to set up initial schema
  - [x] 1.3.4 Set up database seeding script for development (`lib/db/seed.ts`)

- [x] 1.4 Implement RBAC (Role-Based Access Control) system
  - [x] 1.4.1 Create `lib/middleware/rbac.ts` with role checking utilities
  - [x] 1.4.2 Implement middleware to enforce role-based access on protected routes
  - [x] 1.4.3 Create utility to check permissions for specific actions (view, edit, delete, create)
  - [x] 1.4.4 Write unit tests for RBAC logic (`lib/middleware/rbac.test.ts`)

### Phase 2: Public Customer Registration

- [x] 2.0 Implement phone number validation and formatting
  - [x] 2.0.1 Install `libphonenumber-js` library for phone validation
  - [x] 2.0.2 Create `lib/countries.ts` with list of countries and phone format mappings
  - [x] 2.0.3 Create `lib/phone-formatter.ts` with formatting and validation functions
  - [x] 2.0.4 Write unit tests for phone formatting (`lib/phone-formatter.test.ts`)
  - [x] 2.0.5 Create `lib/validation/phone.ts` with phone uniqueness check utility

- [x] 2.1 Build reusable form components
  - [x] 2.1.1 Create `components/PhoneInput.tsx` with real-time validation and formatting
  - [x] 2.1.2 Create `components/DatePicker.tsx` for birthdate selection
  - [x] 2.1.3 Create `components/ConsentCheckbox.tsx` with pre-checked state
  - [x] 2.1.4 Create `components/ConfirmationDialog.tsx` for confirmation modals
  - [x] 2.1.5 Ensure all components are mobile-responsive and accessible (WCAG 2.1 AA)

- [x] 2.2 Create public registration form and page
  - [x] 2.2.1 Create `app/[tenantId]/add-customer/components/RegistrationForm.tsx` component
  - [x] 2.2.2 Implement real-time validation for all fields (name, surname, phone, birthdate)
  - [x] 2.2.3 Add real-time phone duplicate check with visual feedback
  - [x] 2.2.4 Create `app/[tenantId]/add-customer/page.tsx` to render the form
  - [x] 2.2.5 Implement mobile-first responsive design for the registration form
  - [x] 2.2.6 Create `app/[tenantId]/add-customer/success/page.tsx` for success confirmation

- [x] 2.3 Implement registration API endpoint
  - [x] 2.3.1 Create `api/[tenantId]/auth/register/route.ts` for customer registration
  - [x] 2.3.2 Implement input validation and sanitization
  - [x] 2.3.3 Implement phone number uniqueness check at database level
  - [x] 2.3.4 Store customer data with tenant_id in database
  - [x] 2.3.5 Implement rate limiting on registration endpoint
  - [x] 2.3.6 Add error handling and user-friendly error messages

- [x] 2.4 Implement phone validation API endpoint
  - [x] 2.4.1 Create `api/[tenantId]/customers/validate-phone/route.ts` endpoint
  - [x] 2.4.2 Implement real-time phone format validation
  - [x] 2.4.3 Implement real-time duplicate phone check
  - [x] 2.4.4 Return validation status and formatted phone number
  - [x] 2.4.5 Add proper error handling and responses

### Phase 3: Admin Dashboard & Internal User Management

- [x] 3.0 Create admin dashboard layout and navigation
  - [x] 3.0.1 Create `app/[tenantId]/admin/layout.tsx` with protected routes
  - [x] 3.0.2 Add RBAC middleware to protect admin routes (require authenticated user)
  - [x] 3.0.3 Create `components/Navigation.tsx` with links to Customers, Settings, Users
  - [x] 3.0.4 Create `app/[tenantId]/admin/page.tsx` as dashboard home
  - [x] 3.0.5 Implement mobile-responsive navigation menu

- [x] 3.1 Implement first registrant as super admin logic
  - [x] 3.1.1 Modify registration API to check if first customer in tenant
  - [x] 3.1.2 Create first registrant as internal user with super admin role
  - [x] 3.1.3 Create organization record on first registration
  - [x] 3.1.4 Map Clerk user to internal user in users table
  - [x] 3.1.5 Test that subsequent registrants do not get admin privileges

- [x] 3.2 Build internal user management interface
  - [x] 3.2.1 Create `app/[tenantId]/admin/users/page.tsx` to list internal users
  - [x] 3.2.2 Create `app/[tenantId]/admin/users/create/page.tsx` for user creation form
  - [x] 3.2.3 Implement role selection dropdown (Super Admin, Manager, Viewer)
  - [x] 3.2.4 Add user list with edit/delete actions
  - [x] 3.2.5 Implement delete confirmation dialog with proper RBAC checks

- [x] 3.3 Create internal user management API
  - [x] 3.3.1 Create `api/[tenantId]/users/route.ts` for GET (list) and POST (create)
  - [x] 3.3.2 Implement role assignment in create endpoint
  - [x] 3.3.3 Add RBAC checks (only super admin can create/modify users)
  - [x] 3.3.4 Validate email format and check for duplicates within tenant
  - [x] 3.3.5 Implement user creation with Clerk integration (or email-based invitation)
  - [x] 3.3.6 Add proper error handling and validation

- [x] 3.4 Implement role-based access control on UI and routes
  - [x] 3.4.1 Create utility function to check user role from Clerk metadata
  - [x] 3.4.2 Add RBAC guards to admin routes (only authenticated users)
  - [x] 3.4.3 Conditionally render UI components based on user role (e.g., hide delete button for Viewers)
  - [x] 3.4.4 Test RBAC on all admin routes with different roles

### Phase 4: Customer Database Management

- [x] 4.0 Create customer list view
  - [x] 4.0.1 Create `components/CustomerTable.tsx` with search, sort, pagination
  - [x] 4.0.2 Implement search by name and phone number
  - [x] 4.0.3 Implement sorting by all columns (Name, Phone, Birth Date, Date Added)
  - [x] 4.0.4 Implement pagination with configurable page size (default 50)
  - [x] 4.0.5 Create `app/[tenantId]/admin/customers/page.tsx` to render the list
  - [x] 4.0.6 Add action buttons (Edit, Delete) with proper RBAC checks

- [x] 4.1 Create customer detail view
  - [x] 4.1.1 Create `app/[tenantId]/admin/customers/[customerId]/page.tsx` for detail view
  - [x] 4.1.2 Display all customer information (personal, contact, address, metadata)
  - [x] 4.1.3 Show created/modified timestamps and user information
  - [x] 4.1.4 Add edit and delete buttons with RBAC checks
  - [x] 4.1.5 Implement mobile-responsive detail layout

- [x] 4.2 Implement add customer functionality (internal)
  - [x] 4.2.1 Create `components/CustomerForm.tsx` reusable form component
  - [x] 4.2.2 Create `app/[tenantId]/admin/customers/add/page.tsx` for add customer form
  - [x] 4.2.3 Implement all form fields (name, surname, phone, birthdate, address, email)
  - [x] 4.2.4 Reuse phone validation and formatting from public registration
  - [x] 4.2.5 Add real-time validation and error messages
  - [x] 4.2.6 Implement modal or page-based form UI

- [x] 4.3 Implement edit customer functionality
  - [x] 4.3.1 Modify `components/CustomerForm.tsx` to support edit mode
  - [x] 4.3.2 Pre-populate form with existing customer data
  - [x] 4.3.3 Implement phone number uniqueness check (excluding current customer)
  - [x] 4.3.4 Add confirmation dialog before saving changes
  - [x] 4.3.5 Track modification timestamp and user who modified the record

- [x] 4.4 Implement delete customer functionality
  - [x] 4.4.1 Add delete confirmation dialog in customer detail page
  - [x] 4.4.2 Implement delete action with RBAC checks (Manager+ only)
  - [x] 4.4.3 Log deletion action with timestamp and user who deleted
  - [x] 4.4.4 Perform hard delete from database (per requirements)
  - [x] 4.4.5 Add success message and redirect after deletion

- [x] 4.5 Create customer API endpoints
  - [x] 4.5.1 Create `api/[tenantId]/customers/route.ts` for GET (list), POST (create)
  - [x] 4.5.2 Create `api/[tenantId]/customers/[customerId]/route.ts` for GET, PUT, DELETE
  - [x] 4.5.3 Implement RBAC checks on all endpoints (Viewer=read-only, Manager+=CRUD)
  - [x] 4.5.4 Implement proper pagination and filtering on GET list
  - [x] 4.5.5 Add input validation and sanitization
  - [x] 4.5.6 Implement error handling with appropriate HTTP status codes

### Phase 5: Settings & Configuration

- [x] 5.0 Implement tenant settings data model
  - [x] 5.0.1 Add `organization_settings` table to Prisma schema
  - [x] 5.0.2 Define fields: country (default: "United States"), created_at, updated_at
  - [x] 5.0.3 Create unique constraint on organization_id
  - [x] 5.0.4 Run Prisma migration for new settings table

- [x] 5.1 Create settings page and UI
  - [x] 5.1.1 Create `components/CountrySelector.tsx` dropdown component
  - [x] 5.1.2 Create `app/[tenantId]/admin/settings/page.tsx` for settings page
  - [x] 5.1.3 Load current country setting from database
  - [x] 5.1.4 Implement country dropdown with all countries (alphabetically sorted)
  - [x] 5.1.5 Add save button and success/error feedback messages
  - [x] 5.1.6 Restrict access to super admin only (RBAC)

- [x] 5.2 Create settings API endpoint
  - [x] 5.2.1 Create `api/[tenantId]/settings/route.ts` for GET and PUT
  - [x] 5.2.2 Implement GET to retrieve current tenant settings
  - [x] 5.2.3 Implement PUT to update settings (country selection)
  - [x] 5.2.4 Add RBAC check (super admin only)
  - [x] 5.2.5 Validate country value against available countries list
  - [x] 5.2.6 Add proper error handling

- [x] 5.3 Integrate settings with registration form
  - [x] 5.3.1 Fetch tenant settings in registration form (country setting)
  - [x] 5.3.2 Update phone number formatting based on selected country
  - [x] 5.3.3 Dynamically update phone validation rules based on country
  - [x] 5.3.4 Test that phone format changes immediately after settings update
  - [x] 5.3.5 Handle country change for existing registered customers (display purposes)

### Phase 6: Testing & Quality Assurance

- [x] 6.0 Write unit tests for validation and utilities
  - [x] 6.0.1 Write tests for `lib/phone-formatter.ts` (phone formatting for different countries)
  - [x] 6.0.2 Write tests for `lib/validation/phone.ts` (phone uniqueness check)
  - [x] 6.0.3 Write tests for `lib/countries.ts` (country data validation)
  - [x] 6.0.4 Write tests for `lib/middleware/rbac.ts` (role-based access control)
  - [x] 6.0.5 Write tests for database query helpers with tenant isolation

- [x] 6.1 Test multi-tenant isolation
  - [x] 6.1.1 Create test data for multiple tenants
  - [x] 6.1.2 Verify customers from one tenant cannot access another's data
  - [x] 6.1.3 Verify phone uniqueness is enforced per tenant (same phone allowed in different tenants)
  - [x] 6.1.4 Verify settings are isolated per tenant
  - [x] 6.1.5 Test user access is restricted to their assigned tenant

- [x] 6.2 Test public registration flow
  - [x] 6.2.1 Test registration with valid data (success path)
  - [x] 6.2.2 Test registration with duplicate phone number (error handling)
  - [x] 6.2.3 Test all validation error scenarios
  - [x] 6.2.4 Test real-time validation feedback
  - [x] 6.2.5 Test phone number formatting for multiple countries
  - [x] 6.2.6 Test on mobile devices/viewports

- [x] 6.3 Test admin dashboard functionality
  - [x] 6.3.1 Test customer list view (search, sort, pagination)
  - [x] 6.3.2 Test add customer functionality with all fields
  - [x] 6.3.3 Test edit customer functionality
  - [x] 6.3.4 Test delete customer with confirmation dialog
  - [x] 6.3.5 Test RBAC (different roles have different permissions)
  - [x] 6.3.6 Test first registrant becomes super admin

- [x] 6.4 Test internal user management
  - [x] 6.4.1 Test super admin can create new users
  - [x] 6.4.2 Test role assignment (Super Admin, Manager, Viewer)
  - [x] 6.4.3 Test manager cannot create users (RBAC enforcement)
  - [x] 6.4.4 Test viewer cannot create users (RBAC enforcement)
  - [x] 6.4.5 Test user deletion and access revocation

- [x] 6.5 Test settings functionality
  - [x] 6.5.1 Test country selection saves to database
  - [x] 6.5.2 Test phone format updates when country changes
  - [x] 6.5.3 Test only super admin can access settings (RBAC)
  - [x] 6.5.4 Test default country is "United States"

### Phase 7: Documentation & Deployment Preparation

- [ ] 7.0 Document API endpoints
  - [ ] 7.0.1 Document all API routes with parameters and response specifications
  - [ ] 7.0.2 Create API documentation or use tool like Swagger/OpenAPI
  - [ ] 7.0.3 Document error responses and status codes

- [ ] 7.1 Set up environment variables
  - [ ] 7.1.1 Create `.env.example` with all required variables
  - [ ] 7.1.2 Document each variable and its purpose
  - [ ] 7.1.3 Ensure `.env.local` is in `.gitignore`

- [ ] 7.2 Set up CI/CD pipeline
  - [ ] 7.2.1 Configure GitHub Actions or similar for automated testing
  - [ ] 7.2.2 Set up automated linting and type checking
  - [ ] 7.2.3 Configure deployment pipeline for production
  - [ ] 7.2.4 Set up staging environment for testing before production

- [ ] 7.3 Final review and cleanup
  - [ ] 7.3.1 Review code for security vulnerabilities (OWASP top 10)
  - [ ] 7.3.2 Ensure all error messages are user-friendly
  - [ ] 7.3.3 Remove console.log statements and debug code
  - [ ] 7.3.4 Verify all environment variables are properly configured
  - [ ] 7.3.5 Run full test suite and verify all tests pass

- [ ] 7.4 Create deployment documentation
  - [ ] 7.4.1 Document setup instructions for new developers
  - [ ] 7.4.2 Document database migration procedure
  - [ ] 7.4.3 Document deployment steps to production
  - [ ] 7.4.4 Create runbook for common issues and troubleshooting

---

## Implementation Notes

- Follow Next.js 13+ App Router best practices (not Pages Router)
- Use TypeScript for type safety across the codebase
- Implement proper error handling with user-friendly error messages
- Use environment variables for all configuration (database, Clerk API keys, etc.)
- Write unit tests for validation logic (phone number, email, etc.)
- Ensure WCAG 2.1 AA compliance for accessibility
- Use Tailwind CSS or similar for responsive design
- Implement proper logging for debugging and monitoring
- Keep components reusable and modular
- Document complex logic with code comments
