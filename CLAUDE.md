# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LoyaltyBlocks** is a multi-tenant SaaS platform that enables businesses to manage customer databases and loyalty programs. The project uses a **feature-branch-based workflow with structured AI-assisted development** - all development is guided by a detailed PRD and task breakdown.

**Current Status:** Pre-implementation (requirements and planning phase complete)

**Key Principle:** Work through tasks systematically from `tasks/tasks-loyaltyblocks-mvp.md`, marking each sub-task complete as you finish. This is not a traditional codebase yet - focus on building from the PRD specifications.

## Technology Stack

- **Frontend:** Next.js 13+ (App Router), React 18+, TypeScript, Tailwind CSS
- **Backend:** Next.js API routes, Node.js, TypeScript
- **Authentication:** Clerk (auth provider)
- **Database:** Neon PostgreSQL + Prisma ORM
- **Phone Handling:** libphonenumber-js
- **Testing:** Jest + co-located test files
- **Code Quality:** TypeScript strict mode required

## Development Commands

```bash
# Development
npm run dev              # Start dev server (http://localhost:3000)
npm run build           # Production build
npm start               # Run production server

# Code Quality
npm run lint            # Run ESLint
npm test                # Run Jest tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report

# Database
npm run prisma:migrate  # Create and apply migrations
npm run prisma:generate # Generate Prisma client types
npm run prisma:seed     # Seed database with initial data

# Running a Single Test
npm test -- PhoneInput.test.tsx     # Run specific test file
npm test -- --testNamePattern="phone validation"  # Run by test name
npm test -- --watch --testPathPattern="lib/validation"  # Watch specific folder
```

## Architecture Essentials

### Multi-Tenant Path-Based Routing

All routes follow the pattern `/[tenantId]/[route]`:
- Public registration: `/[tenantId]/add-customer`
- Admin dashboard: `/[tenantId]/admin/customers`
- API endpoints: `/api/[tenantId]/customers`

**Critical:** The `tenantId` is extracted from the URL path via middleware and must be passed to all database queries to enforce tenant isolation.

### Data Isolation Pattern

Every database table includes a `tenant_id` column. **All queries must filter by tenant_id** to prevent cross-tenant data access:

```typescript
// ✅ Correct: Always filter by tenant_id
const customers = await db.customer.findMany({
  where: { tenant_id: tenantId }
});

// ❌ Wrong: Missing tenant_id filter = data leak
const customers = await db.customer.findMany();
```

### Request Flow for Public Registration

1. User visits `/[tenantId]/add-customer`
2. RegistrationForm collects: name, surname, phone, birthdate, optional address
3. Real-time phone validation via `POST /api/[tenantId]/customers/validate-phone`
4. User submits form
5. Server creates customer record (or organization + user if first registrant)
6. Redirect to success page

### Admin Access Control

Protected admin routes require:
1. Clerk authentication (user must be logged in)
2. Role-based access (Viewer/Manager/Super Admin)

Implement RBAC middleware in `lib/middleware/rbac.ts` with checks like:
```typescript
if (!hasRole(user, 'Manager', tenantId)) {
  return forbiddenResponse();
}
```

## Key Files and Their Purpose

| File Path | Purpose |
|-----------|---------|
| `tasks/prd-loyaltyblocks-mvp.md` | Source of truth for all requirements |
| `tasks/tasks-loyaltyblocks-mvp.md` | Task checklist - mark items as you complete them |
| `ai-dev-tasks/generate-tasks.md` | Explains the AI workflow approach |
| `app/` | Next.js App Router - pages and layouts |
| `app/api/` | API routes for backend logic |
| `lib/` | Shared utilities (validation, auth, db helpers) |
| `components/` | Reusable React components |
| `prisma/schema.prisma` | Database schema (to be created) |
| `.env.local` | Environment variables (NOT in git) |

## Critical Implementation Notes

### Phone Number Handling

- Store internally in **E.164 format** (e.g., `+11234567890`)
- Validate using `libphonenumber-js`
- Display formatted based on tenant's country setting (e.g., `(123) 456-7890` for US)
- Check uniqueness per tenant (same phone can exist in different tenants)

### First Registrant Special Case

When the first customer registers:
1. Create a new organization record
2. Create user record in Clerk
3. Assign Super Admin role to that user
4. They can now access `/[tenantId]/admin`

Subsequent customers just create customer records (don't need user accounts).

### TypeScript Requirements

- Strict mode enabled in `tsconfig.json`
- No `any` types - use proper type definitions
- Export types from `types/index.ts` for reusable definitions
- Test files co-located: `Component.tsx` + `Component.test.tsx`

### Environment Variables

Required in `.env.local` (create from template):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
DATABASE_URL=postgresql://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

## Development Workflow

1. **Create feature branch:** `git checkout -b feature/loyaltyblocks-mvp`
2. **Work through phases in order** from `tasks/tasks-loyaltyblocks-mvp.md`:
   - Phase 0: Project Setup
   - Phase 1: Multi-Tenant Architecture & Database
   - Phase 2: Public Registration
   - Phase 3: Admin Dashboard
   - Phase 4: Customer Management
   - Phase 5: Settings
   - Phase 6: Testing
   - Phase 7: Documentation

3. **Mark tasks complete** in the task markdown as you finish each sub-task
4. **Create small commits** for related changes (e.g., "Add phone validation logic and tests")
5. **Write tests alongside code** - don't defer testing to the end
6. **Review the PRD** when starting a new phase to understand requirements

## Database Schema Overview

The schema (to be created in `prisma/schema.prisma`) includes:

- **organizations** - Tenant/company records
- **customers** - Public registrants + internal customer database
- **users** - Internal admin users (maps to Clerk)
- **user_roles** - Role definitions and user role assignments
- **organization_settings** - Per-tenant configuration (country, etc.)

**Key pattern:** All tables except organizations have `tenant_id` for isolation. Use Prisma's `@relation` fields to enforce referential integrity.

## Common Development Tasks

### Adding a New Admin Feature

1. Create page in `app/[tenantId]/admin/[feature]/page.tsx`
2. Add RBAC check in page or middleware
3. Create component(s) in `components/`
4. Add API route(s) in `app/api/[tenantId]/...`
5. Ensure API routes filter queries by tenant_id
6. Write tests for API logic and RBAC
7. Update task list in `tasks/tasks-loyaltyblocks-mvp.md`

### Adding Form Validation

1. Create validator in `lib/validation/[feature].ts`
2. Add test file `lib/validation/[feature].test.ts`
3. Use in component with real-time feedback
4. Add server-side re-validation in API route
5. Return validation errors in API response

### Testing Multi-Tenant Isolation

Create tests that verify:
1. User from tenant A cannot access tenant B data
2. API returns 403 when filtering by wrong tenant_id
3. Database queries always include tenant_id filter
4. Admin pages redirect unauthenticated users

## Debugging Tips

- **Phone validation issues:** Check `libphonenumber-js` format and tenant's country setting
- **Tenant data leaks:** Search for database queries missing `tenant_id` filter
- **Auth issues:** Verify Clerk configuration and `useUser()` hook usage
- **Type errors:** Enable TypeScript strict mode - no `any` types allowed
- **RBAC failures:** Check that user has role assigned for current tenant

## Important Constraints

- **No hardcoded tenant IDs** in code - always extract from URL/request context
- **No unprotected admin endpoints** - all admin routes need Clerk auth + RBAC
- **E.164 for phones** - never change storage format, only display format changes
- **Immutable first registrant role** - cannot downgrade super admin once assigned
- **Clean git history** - commit messages should reference task IDs where applicable

## References

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Clerk Documentation](https://clerk.com/docs)
- [Prisma ORM Guide](https://www.prisma.io/docs/)
- [libphonenumber-js](https://github.com/catamphetamine/libphonenumber-js)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Jest Documentation](https://jestjs.io/docs/getting-started)

See `tasks/prd-loyaltyblocks-mvp.md` for complete feature specifications and requirements.
