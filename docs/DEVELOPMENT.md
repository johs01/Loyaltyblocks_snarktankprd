# LoyaltyBlocks Development Guide

Complete guide for setting up and developing LoyaltyBlocks locally.

## Prerequisites

Ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher (comes with Node.js)
- **Git**
- **PostgreSQL** (or access to Neon PostgreSQL)
- **Code Editor** (VS Code recommended)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/loyaltyblocks.git
cd loyaltyblocks

# Install dependencies
npm install

# Copy environment variables template
cp .env.example .env.local

# Edit .env.local with your credentials
nano .env.local

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

---

## Detailed Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/loyaltyblocks.git
cd loyaltyblocks
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages:
- Next.js 15+
- React 18+
- TypeScript
- Prisma ORM
- Clerk Authentication
- Tailwind CSS
- Jest & React Testing Library

### 3. Database Setup

#### Option A: Neon PostgreSQL (Recommended)

1. Create free account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy connection string
4. Add to `.env.local`:
   ```
   DATABASE_URL=postgresql://user:password@host/database?sslmode=require
   ```

#### Option B: Local PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql  # Ubuntu/Debian
brew install postgresql      # macOS

# Start PostgreSQL
sudo service postgresql start  # Ubuntu/Debian
brew services start postgresql # macOS

# Create database
createdb loyaltyblocks

# Add to .env.local
DATABASE_URL=postgresql://postgres:password@localhost:5432/loyaltyblocks
```

### 4. Clerk Authentication Setup

1. Create account at [clerk.com](https://clerk.com)
2. Create new application
3. Get API keys from dashboard
4. Add to `.env.local`:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   ```

5. Configure webhook (optional for local development):
   - Use [ngrok](https://ngrok.com) to expose local server
   - Add webhook URL: `https://your-ngrok.subdomain.ngrok.io/api/webhooks/clerk`

### 5. Environment Variables

Create `.env.local` file:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://user:password@host/database

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Note:** Never commit `.env.local` to version control.

### 6. Database Migrations

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Seed database with test data
npm run prisma:seed
```

### 7. Start Development Server

```bash
npm run dev
```

Application runs at `http://localhost:3000`

---

## Project Structure

```
loyaltyblocks/
├── app/                          # Next.js App Router
│   ├── [tenantId]/              # Multi-tenant routes
│   │   ├── add-customer/        # Public registration
│   │   ├── admin/               # Admin dashboard
│   │   │   ├── customers/       # Customer management
│   │   │   ├── users/           # User management
│   │   │   └── settings/        # Organization settings
│   │   ├── sign-in/             # Clerk sign-in
│   │   └── sign-up/             # Clerk sign-up
│   ├── api/                     # API routes
│   │   ├── [tenantId]/          # Tenant-specific APIs
│   │   │   ├── customers/       # Customer CRUD
│   │   │   └── settings/        # Settings API
│   │   └── webhooks/            # Webhook handlers
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Home page
│
├── components/                   # Reusable React components
│   ├── Navigation.tsx           # Admin navigation
│   ├── PhoneInput.tsx           # Phone input with validation
│   └── CountrySelector.tsx      # Country dropdown
│
├── lib/                         # Utility libraries
│   ├── auth.ts                  # Authentication helpers
│   ├── db.ts                    # Prisma client
│   ├── tenant-context.ts        # Tenant utilities
│   ├── countries.ts             # Country data (47 countries)
│   ├── phone-formatter.ts       # Phone formatting
│   ├── middleware/
│   │   └── rbac.ts              # Role-based access control
│   └── validation/
│       ├── phone.ts             # Phone validation
│       └── form.ts              # Form validation
│
├── types/                       # TypeScript type definitions
│   ├── index.ts                 # Shared types
│   └── clerk.ts                 # Clerk type extensions
│
├── prisma/                      # Database schema
│   └── schema.prisma            # Prisma schema
│
├── middleware.ts                # Next.js middleware
├── tailwind.config.ts           # Tailwind configuration
├── tsconfig.json                # TypeScript configuration
├── jest.config.js               # Jest test configuration
└── package.json                 # Dependencies
```

---

## Development Workflow

### Branch Strategy

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git add .
git commit -m "Add feature description"

# Push to remote
git push origin feature/your-feature-name

# Create pull request on GitHub
```

### Coding Standards

1. **TypeScript Strict Mode**: All code must pass TypeScript strict checks
2. **ESLint**: Run `npm run lint` before committing
3. **No `any` types**: Use proper type definitions
4. **Component Structure**: One component per file
5. **File Naming**:
   - Components: PascalCase (e.g., `PhoneInput.tsx`)
   - Utilities: camelCase (e.g., `phone-formatter.ts`)
   - Pages: lowercase (e.g., `page.tsx`)

### Code Style

```typescript
// Good: Explicit types
interface Props {
  name: string;
  age: number;
}

export function Component({ name, age }: Props) {
  return <div>{name}</div>;
}

// Bad: Implicit any
export function Component({ name, age }) {
  return <div>{name}</div>;
}
```

---

## Common Development Tasks

### Adding a New API Endpoint

1. Create file in `app/api/[tenantId]/[endpoint]/route.ts`
2. Implement GET, POST, PUT, DELETE handlers
3. Add RBAC checks
4. Validate input
5. Return consistent response format
6. Write tests

Example:
```typescript
// app/api/[tenantId]/example/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserByClerkId } from "@/lib/auth";
import type { ApiResponse } from "@/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params;

  // Implement logic
  return NextResponse.json<ApiResponse>({
    success: true,
    data: {}
  });
}
```

### Adding a New Page

1. Create file in `app/[tenantId]/[route]/page.tsx`
2. Add authentication checks if needed
3. Fetch data on server side
4. Return React component
5. Add to navigation if needed

### Adding a New Component

1. Create file in `components/ComponentName.tsx`
2. Define TypeScript props interface
3. Implement component logic
4. Export component
5. Write tests in `ComponentName.test.tsx`

### Adding Database Changes

1. Update `prisma/schema.prisma`
2. Create migration:
   ```bash
   npx prisma migrate dev --name add_feature
   ```
3. Generate Prisma client:
   ```bash
   npm run prisma:generate
   ```
4. Update TypeScript types if needed

---

## Running Tests

### Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test PhoneInput.test.tsx
```

### Test Structure

```typescript
// Component.test.tsx
import { render, screen } from "@testing-library/react";
import Component from "./Component";

describe("Component", () => {
  it("should render correctly", () => {
    render(<Component />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

---

## Debugging

### VS Code Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Console Logging

```typescript
// Development only
if (process.env.NODE_ENV === "development") {
  console.log("Debug info:", data);
}
```

### Database Debugging

```bash
# View database with Prisma Studio
npx prisma studio

# Check migration status
npx prisma migrate status

# View database directly
psql postgresql://user:password@host/database
```

---

## Common Issues

### "Module not found" errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Prisma client errors

```bash
# Regenerate Prisma client
npm run prisma:generate
```

### Port already in use

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### TypeScript errors

```bash
# Check for errors
npm run build

# Generate types
npm run prisma:generate
```

---

## Database Management

### Prisma Studio

Visual database browser:

```bash
npx prisma studio
```

Access at `http://localhost:5555`

### Reset Database

**⚠️ CAUTION: Deletes all data**

```bash
npm run prisma:migrate reset
```

### View Schema

```bash
npx prisma db pull  # Pull schema from database
npx prisma format   # Format schema file
```

---

## Performance Optimization

### Development Mode

- Hot Module Replacement (HMR) enabled
- Source maps included
- Development builds slower but easier to debug

### Production Build

```bash
# Build for production
npm run build

# Test production build locally
npm start
```

### Bundle Analysis

```bash
# Analyze bundle size
npm run build
# Check .next/analyze/ for reports
```

---

## Code Quality

### Linting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix
```

### Type Checking

```bash
# Check types
npx tsc --noEmit
```

### Pre-commit Hooks (Optional)

Install Husky:

```bash
npm install --save-dev husky
npx husky install

# Add pre-commit hook
npx husky add .husky/pre-commit "npm run lint && npm test"
```

---

## Environment-Specific Settings

### Development

```bash
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Staging

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://staging.your-domain.com
```

### Production

```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm start                # Start production server
npm run lint             # Run ESLint
npm test                 # Run tests

# Database
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:seed      # Seed database
npx prisma studio        # Open Prisma Studio

# Utilities
npm run type-check       # Check TypeScript types
npm run format           # Format code (if configured)
```

---

## Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **Clerk Docs**: https://clerk.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **TypeScript**: https://www.typescriptlang.org/docs

---

## Getting Help

1. Check existing documentation in `/docs`
2. Review `CLAUDE.md` for architecture decisions
3. Check `tasks/prd-loyaltyblocks-mvp.md` for requirements
4. Search issues on GitHub
5. Ask in team chat/Slack

---

## Contributing

1. Create feature branch
2. Make changes
3. Write tests
4. Run linter and tests
5. Create pull request
6. Wait for review
7. Merge after approval

Happy coding! 🚀
