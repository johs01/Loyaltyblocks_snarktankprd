# LoyaltyBlocks - Complete Recreation Guide (PRD)

**Product Requirements Document**
**Version:** 1.0
**Last Updated:** November 2024
**Status:** Complete Implementation Reference

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technology Stack Setup](#3-technology-stack-setup)
4. [Database Schema Design](#4-database-schema-design)
5. [Multi-Tenant Architecture](#5-multi-tenant-architecture)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Phone Number System](#7-phone-number-system)
8. [Public Customer Registration](#8-public-customer-registration)
9. [Admin Dashboard](#9-admin-dashboard)
10. [Customer Management (CRUD)](#10-customer-management-crud)
11. [User Management](#11-user-management)
12. [Settings Management](#12-settings-management)
13. [API Endpoints](#13-api-endpoints)
14. [Testing Strategy](#14-testing-strategy)
15. [Deployment](#15-deployment)

---

## 1. Executive Summary

### 1.1 Product Overview
LoyaltyBlocks is a multi-tenant SaaS platform that enables businesses to:
- Collect and manage customer databases
- Allow public customer self-registration
- Manage internal admin users with role-based permissions
- Handle international phone numbers with validation
- Isolate data completely between organizations (tenants)

### 1.2 Core Principles
- **Multi-Tenancy**: Complete data isolation between organizations
- **Path-Based Routing**: All routes follow `/[tenantId]/...` pattern
- **E.164 Phone Storage**: International phone numbers stored in standard format
- **Role-Based Access**: 3-tier permission system (Super Admin, Manager, Viewer)
- **First Registrant Rule**: First customer becomes Super Admin automatically

### 1.3 Key Features
1. Public customer registration forms
2. Admin dashboard with customer CRUD operations
3. Internal user management
4. International phone validation (47+ countries)
5. Organization settings (country selection)
6. Webhook-based user provisioning

---

## 2. System Architecture Overview

### 2.1 Architecture Pattern
```
Multi-Tenant SaaS Architecture
├── Frontend: Next.js 15+ (App Router)
├── Backend: Next.js API Routes
├── Database: PostgreSQL (Neon) + Prisma ORM
├── Auth: Clerk Authentication
└── Phone: libphonenumber-js
```

### 2.2 Request Flow

**2.2.1 Public Registration Flow**
```
User → /{tenantId}/add-customer
  → Middleware extracts tenantId
  → Form validates phone (debounced)
  → API: POST /api/{tenantId}/customers/register
  → Creates organization (if first customer)
  → Creates customer record
  → Redirects to success page
```

**2.2.2 Admin Dashboard Flow**
```
User → /{tenantId}/admin
  → Middleware checks authentication
  → Gets internal user record
  → Validates tenant access
  → Renders admin dashboard
```

### 2.3 Data Isolation Strategy
Every database query MUST include:
```typescript
where: {
  organizationId: organization.id,
  // ... other conditions
}
```

---

## 3. Technology Stack Setup

### 3.1 Initialize Next.js Project
```bash
# Step 1: Create Next.js app
npx create-next-app@latest loyaltyblocks-saas
  ✓ TypeScript: Yes
  ✓ ESLint: Yes
  ✓ Tailwind CSS: Yes
  ✓ App Router: Yes
  ✓ Import alias: @/*

# Step 2: Navigate to project
cd loyaltyblocks-saas
```

### 3.2 Install Core Dependencies
```bash
# Step 3: Install authentication
npm install @clerk/nextjs

# Step 4: Install database tools
npm install @prisma/client
npm install -D prisma

# Step 5: Install phone validation
npm install libphonenumber-js

# Step 6: Install webhook verification
npm install svix
```

### 3.3 Install Development Tools
```bash
# Step 7: Install testing framework
npm install -D jest @testing-library/react @testing-library/jest-dom
npm install -D jest-environment-jsdom @types/jest

# Step 8: Install TypeScript helpers
npm install -D ts-node @types/node
```

### 3.4 Project Configuration Files

**3.4.1 TypeScript Configuration (tsconfig.json)**
```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

**3.4.2 Tailwind Configuration (tailwind.config.ts)**
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
export default config;
```

**3.4.3 Jest Configuration (jest.config.js)**
```javascript
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}

module.exports = createJestConfig(customJestConfig)
```

### 3.5 Environment Variables

**3.5.1 Create .env.local**
```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx

# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Clerk Webhook (optional for production)
CLERK_WEBHOOK_SECRET=whsec_xxx
```

### 3.6 Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "prisma:migrate": "prisma migrate dev",
    "prisma:generate": "prisma generate",
    "prisma:studio": "prisma studio"
  }
}
```

---

## 4. Database Schema Design

### 4.1 Initialize Prisma

```bash
# Step 1: Initialize Prisma
npx prisma init

# Step 2: This creates:
# - prisma/schema.prisma
# - .env (with DATABASE_URL placeholder)
```

### 4.2 Complete Schema Definition

**prisma/schema.prisma**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// 4.2.1 Organizations Table
// Purpose: Represents tenants in multi-tenant architecture
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique // Used in URL: /{slug}/...
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  customers Customer[]
  users     User[]
  settings  OrganizationSettings?

  @@map("organizations")
}

// 4.2.2 Customers Table
// Purpose: Public registrants and customer database
model Customer {
  id             String   @id @default(cuid())
  organizationId String   @map("organization_id")

  // Personal Information (Required)
  firstName String @map("first_name")
  lastName  String @map("last_name")
  phone     String // E.164 format: +15551234567
  birthDate DateTime @map("birth_date")

  // Contact Information (Optional)
  email        String?
  addressLine1 String? @map("address_line1")
  addressLine2 String? @map("address_line2")
  city         String?
  state        String?
  postalCode   String? @map("postal_code")
  country      String?

  // Metadata
  consentGiven Boolean  @default(true) @map("consent_given")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")
  createdBy    String?  @map("created_by") // User who created
  updatedBy    String?  @map("updated_by") // User who last updated

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  creator      User?        @relation("CustomerCreator", fields: [createdBy], references: [id], onDelete: SetNull)
  updater      User?        @relation("CustomerUpdater", fields: [updatedBy], references: [id], onDelete: SetNull)

  // Constraints
  @@unique([organizationId, phone]) // Phone unique per tenant
  @@index([organizationId])
  @@index([phone])
  @@index([organizationId, lastName])
  @@map("customers")
}

// 4.2.3 Users Table
// Purpose: Internal admin users who access dashboard
model User {
  id             String   @id @default(cuid())
  organizationId String   @map("organization_id")
  clerkUserId    String   @unique @map("clerk_user_id")

  // User Information
  email     String
  firstName String @map("first_name")
  lastName  String @map("last_name")
  role      UserRole

  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  organization      Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  customersCreated  Customer[]   @relation("CustomerCreator")
  customersUpdated  Customer[]   @relation("CustomerUpdater")

  @@unique([organizationId, email])
  @@index([organizationId])
  @@index([clerkUserId])
  @@map("users")
}

// 4.2.4 User Roles Enum
enum UserRole {
  SUPER_ADMIN // Full access
  MANAGER     // Customer CRUD, no user/settings management
  VIEWER      // Read-only access
}

// 4.2.5 Organization Settings Table
// Purpose: Per-tenant configuration
model OrganizationSettings {
  id             String @id @default(cuid())
  organizationId String @unique @map("organization_id")

  // Settings
  country String @default("United States")

  // Metadata
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@map("organization_settings")
}
```

### 4.3 Create Database Migration

```bash
# Step 3: Create and run initial migration
npx prisma migrate dev --name init

# Step 4: Generate Prisma Client
npx prisma generate
```

### 4.4 Database Client Setup

**lib/db.ts**

```typescript
import { PrismaClient } from "@prisma/client";

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

---

## 5. Multi-Tenant Architecture

### 5.1 URL Structure
All routes follow the pattern: `/{tenantId}/{route}`

Examples:
- Public: `/acme/add-customer`
- Admin: `/acme/admin/customers`
- API: `/api/acme/customers`

### 5.2 Middleware Implementation

**middleware.ts (Root)**

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 5.2.1 Define protected routes
const isProtectedRoute = createRouteMatcher([
  "/(.+)/admin(.*)", // All admin routes
]);

// 5.2.2 Define public routes
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/health",
]);

// 5.2.3 Extract tenant slug from path
function extractTenantSlug(pathname: string): string | null {
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/_") ||
    pathname.includes(".")
  ) {
    return null;
  }

  const segments = pathname.replace(/^\//, "").split("/");
  const tenantSlug = segments[0];

  if (!tenantSlug || tenantSlug.startsWith("_")) {
    return null;
  }

  return tenantSlug;
}

// 5.2.4 Main middleware
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  const tenantSlug = extractTenantSlug(pathname);

  if (tenantSlug) {
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-organization-slug", tenantSlug);
    requestHeaders.set("x-pathname", pathname);

    // Protect admin routes
    if (isProtectedRoute(req)) {
      const { userId } = await auth();

      if (!userId) {
        const signInUrl = new URL(`/${tenantSlug}/sign-in`, req.url);
        signInUrl.searchParams.set("redirect_url", pathname);
        return NextResponse.redirect(signInUrl);
      }

      requestHeaders.set("x-clerk-user-id", userId);
    }

    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
```

### 5.3 Tenant Context Utilities

**lib/tenant-context.ts**

```typescript
import { db } from "./db";
import { headers } from "next/headers";

// 5.3.1 Get organization by slug
export async function getOrganizationBySlug(slug: string) {
  return await db.organization.findUnique({
    where: { slug },
    include: { settings: true },
  });
}

// 5.3.2 Create new organization (for first customer)
export async function createOrganization(data: {
  name: string;
  slug: string;
}) {
  return await db.organization.create({
    data: {
      name: data.name,
      slug: data.slug,
      settings: {
        create: { country: "United States" },
      },
    },
    include: { settings: true },
  });
}

// 5.3.3 Get organization settings
export async function getOrganizationSettings(organizationId: string) {
  let settings = await db.organizationSettings.findUnique({
    where: { organizationId },
  });

  // Auto-create if missing
  if (!settings) {
    settings = await db.organizationSettings.create({
      data: { organizationId, country: "United States" },
    });
  }

  return settings;
}
```

### 5.4 Type Definitions

**types/index.ts**

```typescript
export type UserRole = "SUPER_ADMIN" | "MANAGER" | "VIEWER";

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

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: Record<string, string[]>;
}
```

---

## 6. Authentication & Authorization

### 6.1 Clerk Setup

**6.1.1 Install Clerk**
```bash
npm install @clerk/nextjs
```

**6.1.2 Root Layout with ClerkProvider**

**app/layout.tsx**

```typescript
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### 6.2 Authentication Utilities

**lib/auth.ts**

```typescript
import { auth } from "@clerk/nextjs/server";
import { db } from "./db";
import type { UserRole } from "@/types";

// 6.2.1 Get current authenticated user
export async function getCurrentUser() {
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) return null;

  const user = await db.user.findUnique({
    where: { clerkUserId },
  });

  if (!user) return null;

  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as UserRole,
    organizationId: user.organizationId,
  };
}

// 6.2.2 Check role hierarchy
export function hasMinimumRole(userRole: UserRole, minimumRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    SUPER_ADMIN: 3,
    MANAGER: 2,
    VIEWER: 1,
  };

  return hierarchy[userRole] >= hierarchy[minimumRole];
}

// 6.2.3 Check if first user in organization
export async function isFirstUserInOrganization(organizationId: string): Promise<boolean> {
  const count = await db.user.count({
    where: { organizationId },
  });
  return count === 0;
}
```

### 6.3 Clerk Webhook Handler

**app/api/webhooks/clerk/route.ts**

```typescript
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { Webhook } from "svix";
import { db } from "@/lib/db";
import { isFirstUserInOrganization } from "@/lib/auth";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(request: Request) {
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  // 6.3.1 Get and verify webhook signature
  const headersList = await headers();
  const svixId = headersList.get("svix-id");
  const svixTimestamp = headersList.get("svix-timestamp");
  const svixSignature = headersList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "Missing headers" }, { status: 400 });
  }

  const payload = await request.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);
  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    });
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // 6.3.2 Handle user.created event
  if (evt.type === "user.created") {
    const { id: clerkUserId, email_addresses, first_name, last_name, public_metadata } = evt.data;

    const email = email_addresses?.[0]?.email_address;
    const organizationSlug = public_metadata?.organizationSlug;

    if (!organizationSlug || !email) {
      return NextResponse.json({ received: true });
    }

    const organization = await db.organization.findUnique({
      where: { slug: organizationSlug },
    });

    if (!organization) {
      return NextResponse.json({ received: true });
    }

    // 6.3.3 Determine role (first user = SUPER_ADMIN)
    const isFirstUser = await isFirstUserInOrganization(organization.id);
    const role = isFirstUser ? "SUPER_ADMIN" : "VIEWER";

    // 6.3.4 Create internal user
    await db.user.create({
      data: {
        clerkUserId,
        email,
        firstName: first_name || email.split("@")[0],
        lastName: last_name || "",
        role,
        organizationId: organization.id,
      },
    });
  }

  return NextResponse.json({ received: true });
}
```

### 6.4 Sign In/Up Pages

**app/[tenantId]/sign-in/page.tsx**

```typescript
import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
        redirectUrl={`/${tenantId}/admin`}
      />
    </div>
  );
}
```

**app/[tenantId]/sign-up/page.tsx**

```typescript
import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
          },
        }}
        redirectUrl={`/${tenantId}/admin`}
      />
    </div>
  );
}
```

---

## 7. Phone Number System

### 7.1 Country Data

**lib/countries.ts**

```typescript
export interface CountryInfo {
  code: string;        // "US"
  name: string;        // "United States"
  dialCode: string;    // "+1"
  format?: string;     // "(###) ###-####"
}

export const COUNTRIES: CountryInfo[] = [
  { code: "US", name: "United States", dialCode: "+1", format: "(###) ###-####" },
  { code: "CA", name: "Canada", dialCode: "+1", format: "(###) ###-####" },
  { code: "GB", name: "United Kingdom", dialCode: "+44", format: "#### ### ####" },
  { code: "AU", name: "Australia", dialCode: "+61", format: "#### ### ###" },
  // ... 43 more countries
].sort((a, b) => a.name.localeCompare(b.name));

export function getCountryByName(name: string) {
  return COUNTRIES.find(c => c.name === name);
}

export function getCountryByCode(code: string) {
  return COUNTRIES.find(c => c.code === code);
}
```

### 7.2 Phone Formatter

**lib/phone-formatter.ts**

```typescript
import {
  parsePhoneNumber,
  isValidPhoneNumber,
  type CountryCode,
} from "libphonenumber-js";

// 7.2.1 Validate and format to E.164
export function validateAndFormatPhone(
  phoneInput: string,
  countryCode: string
) {
  try {
    const cleaned = phoneInput.replace(/[\s\-\(\)\.]/g, "");

    if (!cleaned) {
      return { isValid: false, error: "Phone number is required" };
    }

    const isValid = isValidPhoneNumber(cleaned, countryCode as CountryCode);

    if (!isValid) {
      return { isValid: false, error: "Invalid phone number" };
    }

    const phoneNumber = parsePhoneNumber(cleaned, countryCode as CountryCode);

    return {
      isValid: true,
      formatted: phoneNumber.format("E.164"), // +15551234567
      country: phoneNumber.country || countryCode,
    };
  } catch {
    return { isValid: false, error: "Failed to parse phone number" };
  }
}

// 7.2.2 Format for display
export function formatPhoneForDisplay(
  e164Phone: string,
  format: "national" | "international" = "national"
): string {
  try {
    const phoneNumber = parsePhoneNumber(e164Phone);
    return format === "national"
      ? phoneNumber.formatNational()
      : phoneNumber.formatInternational();
  } catch {
    return e164Phone;
  }
}

// 7.2.3 Check E.164 format
export function isE164Format(phone: string): boolean {
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}
```

### 7.3 Phone Validation with Database

**lib/validation/phone.ts**

```typescript
import { db } from "../db";
import { validateAndFormatPhone, isE164Format } from "../phone-formatter";

// 7.3.1 Check phone availability
export async function checkPhoneAvailability(
  phone: string,
  organizationId: string,
  excludeCustomerId?: string
) {
  if (!isE164Format(phone)) {
    return { available: false, message: "Invalid format" };
  }

  const existingCustomer = await db.customer.findFirst({
    where: {
      organizationId,
      phone,
      ...(excludeCustomerId && { id: { not: excludeCustomerId } }),
    },
    select: { id: true, firstName: true, lastName: true },
  });

  if (existingCustomer) {
    return {
      available: false,
      message: `Already registered to ${existingCustomer.firstName} ${existingCustomer.lastName}`,
    };
  }

  return { available: true, message: "Available" };
}

// 7.3.2 Validate and check availability
export async function validatePhoneAndCheckAvailability(
  phoneInput: string,
  countryCode: string,
  organizationId: string,
  excludeCustomerId?: string
) {
  const validation = validateAndFormatPhone(phoneInput, countryCode);

  if (!validation.isValid || !validation.formatted) {
    return validation;
  }

  const availability = await checkPhoneAvailability(
    validation.formatted,
    organizationId,
    excludeCustomerId
  );

  return {
    ...validation,
    available: availability.available,
    error: !availability.available ? availability.message : undefined,
  };
}
```

### 7.4 Phone Input Component

**components/PhoneInput.tsx**

```typescript
"use client";

import { useState, useEffect } from "react";
import { getCountryByName } from "@/lib/countries";

interface PhoneInputProps {
  value: string;
  onChange: (value: string, isValid: boolean) => void;
  defaultCountry: string;
  tenantId: string;
  skipAvailabilityCheck?: boolean;
  error?: string;
}

export default function PhoneInput({
  value,
  onChange,
  defaultCountry,
  tenantId,
  skipAvailabilityCheck = false,
  error,
}: PhoneInputProps) {
  const [phoneValidating, setPhoneValidating] = useState(false);
  const [phoneAvailable, setPhoneAvailable] = useState<boolean | null>(null);
  const [validationError, setValidationError] = useState<string | undefined>(error);

  const countryCode = getCountryByName(defaultCountry)?.code || "US";

  // 7.4.1 Debounced validation
  useEffect(() => {
    if (!value || value.length < 7 || skipAvailabilityCheck) {
      setPhoneAvailable(null);
      setValidationError(undefined);
      return;
    }

    const timer = setTimeout(async () => {
      setPhoneValidating(true);
      try {
        const response = await fetch(`/api/${tenantId}/customers/validate-phone`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: value, countryCode }),
        });

        const result = await response.json();
        setPhoneAvailable(result.success);

        if (!result.success) {
          setValidationError(result.data?.error || result.error);
          onChange(value, false);
        } else {
          setValidationError(undefined);
          onChange(value, true);
        }
      } catch {
        setValidationError("Failed to validate");
        onChange(value, false);
      } finally {
        setPhoneValidating(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [value, tenantId, countryCode, skipAvailabilityCheck, onChange]);

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Phone Number *
      </label>
      <div className="relative">
        <input
          type="tel"
          value={value}
          onChange={(e) => onChange(e.target.value, false)}
          className={`w-full px-4 py-2 border rounded-md ${
            validationError ? "border-red-500" : "border-gray-300"
          }`}
          placeholder="(555) 123-4567"
        />
        {phoneValidating && (
          <div className="absolute right-3 top-2.5">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
        {!phoneValidating && phoneAvailable === true && (
          <div className="absolute right-3 top-2.5 text-green-500">✓</div>
        )}
      </div>
      {validationError && (
        <p className="mt-1 text-sm text-red-600">{validationError}</p>
      )}
    </div>
  );
}
```

---

## 8. Public Customer Registration

### 8.1 Registration Page

**app/[tenantId]/add-customer/page.tsx**

```typescript
import { getOrganizationBySlug } from "@/lib/tenant-context";
import RegistrationForm from "./RegistrationForm";

export default async function AddCustomerPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const organization = await getOrganizationBySlug(tenantId);

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-md rounded-lg px-8 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {organization?.name || "Customer"} Registration
            </h1>
            <p className="text-gray-600">
              Please fill out the form below to register.
            </p>
          </div>

          <RegistrationForm
            tenantId={tenantId}
            organizationName={organization?.name || tenantId}
            defaultCountry={organization?.settings?.country || "United States"}
          />
        </div>
      </div>
    </main>
  );
}
```

### 8.2 Registration Form Component

**app/[tenantId]/add-customer/RegistrationForm.tsx**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhoneInput from "@/components/PhoneInput";

interface RegistrationFormProps {
  tenantId: string;
  organizationName: string;
  defaultCountry: string;
}

export default function RegistrationForm({
  tenantId,
  organizationName,
  defaultCountry,
}: RegistrationFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    birthDate: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: defaultCountry,
    consentGiven: true,
  });

  const [phoneValid, setPhoneValid] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/${tenantId}/customers/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/${tenantId}/add-customer/success`);
      } else {
        setError(result.error || "Registration failed");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isFormValid = () => {
    return (
      formData.firstName &&
      formData.lastName &&
      phoneValid &&
      formData.birthDate &&
      formData.consentGiven
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* First Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          First Name *
        </label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      {/* Last Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Last Name *
        </label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      {/* Phone Input */}
      <PhoneInput
        value={formData.phone}
        onChange={(value, isValid) => {
          setFormData({ ...formData, phone: value });
          setPhoneValid(isValid);
        }}
        defaultCountry={defaultCountry}
        tenantId={tenantId}
      />

      {/* Birth Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Birth Date *
        </label>
        <input
          type="date"
          value={formData.birthDate}
          onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      {/* Email (Optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Consent */}
      <div className="flex items-start">
        <input
          type="checkbox"
          checked={formData.consentGiven}
          onChange={(e) => setFormData({ ...formData, consentGiven: e.target.checked })}
          className="mt-1 h-4 w-4"
          required
        />
        <label className="ml-2 text-sm text-gray-700">
          I consent to {organizationName} storing my information *
        </label>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!isFormValid() || submitting}
        className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {submitting ? "Registering..." : "Register"}
      </button>
    </form>
  );
}
```

### 8.3 Registration API Endpoint

**app/api/[tenantId]/customers/register/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getOrganizationBySlug, createOrganization } from "@/lib/tenant-context";
import { validatePhoneAndCheckAvailability } from "@/lib/validation/phone";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const body = await request.json();

    // 8.3.1 Get or create organization
    let organization = await getOrganizationBySlug(tenantId);
    let isFirstCustomer = false;

    if (!organization) {
      const orgName = tenantId.charAt(0).toUpperCase() + tenantId.slice(1);
      organization = await createOrganization({
        name: orgName,
        slug: tenantId,
      });

      if (!organization) {
        return NextResponse.json(
          { success: false, error: "Failed to create organization" },
          { status: 500 }
        );
      }

      isFirstCustomer = true;
    }

    // 8.3.2 Validate phone
    const phoneValidation = await validatePhoneAndCheckAvailability(
      body.phone,
      organization.settings?.country || "United States",
      organization.id
    );

    if (!phoneValidation.isValid || phoneValidation.available === false) {
      return NextResponse.json(
        { success: false, error: phoneValidation.error || "Invalid phone" },
        { status: 400 }
      );
    }

    // 8.3.3 Create customer
    const customer = await db.customer.create({
      data: {
        organizationId: organization.id,
        firstName: body.firstName.trim(),
        lastName: body.lastName.trim(),
        phone: phoneValidation.formatted!,
        birthDate: new Date(body.birthDate),
        email: body.email?.trim() || null,
        addressLine1: body.addressLine1?.trim() || null,
        addressLine2: body.addressLine2?.trim() || null,
        city: body.city?.trim() || null,
        state: body.state?.trim() || null,
        postalCode: body.postalCode?.trim() || null,
        country: body.country || null,
        consentGiven: body.consentGiven,
        createdBy: null,
        updatedBy: null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          customerId: customer.id,
          isFirstCustomer,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 8.4 Phone Validation API

**app/api/[tenantId]/customers/validate-phone/route.ts**

```typescript
import { NextResponse } from "next/server";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { validatePhoneAndCheckAvailability } from "@/lib/validation/phone";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const { phone, countryCode } = await request.json();

    const organization = await getOrganizationBySlug(tenantId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const result = await validatePhoneAndCheckAvailability(
      phone,
      countryCode || organization.settings?.country || "United States",
      organization.id
    );

    if (!result.isValid || result.available === false) {
      return NextResponse.json({
        success: false,
        data: { error: result.error },
      });
    }

    return NextResponse.json({
      success: true,
      data: { formatted: result.formatted },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Validation failed" },
      { status: 500 }
    );
  }
}
```

### 8.5 Success Page

**app/[tenantId]/add-customer/success/page.tsx**

```typescript
import Link from "next/link";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Registration Successful!
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for registering. Your information has been saved.
        </p>

        <Link
          href={`/${tenantId}/add-customer`}
          className="inline-block bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700"
        >
          Register Another Customer
        </Link>
      </div>
    </main>
  );
}
```

---

## 9. Admin Dashboard

### 9.1 Admin Layout

**app/[tenantId]/admin/layout.tsx**

```typescript
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import Navigation from "@/components/Navigation";
import { UserButton } from "@clerk/nextjs";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  // 9.1.1 Check authentication
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect(`/${tenantId}/sign-in?redirect_url=/${tenantId}/admin`);
  }

  // 9.1.2 Get organization
  const organization = await getOrganizationBySlug(tenantId);

  if (!organization) {
    redirect("/");
  }

  // 9.1.3 Get internal user
  const internalUser = await getUserByClerkId(clerkUserId);

  if (!internalUser || internalUser.organizationId !== organization.id) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p>You do not have permission to access this organization.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-sm fixed h-full">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold">{organization.name}</h1>
          <p className="text-xs text-gray-500 mt-1">Admin Dashboard</p>
        </div>
        <Navigation tenantId={tenantId} userRole={internalUser.role} />
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <header className="bg-white shadow-sm border-b sticky top-0 z-10">
          <div className="px-8 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Welcome, {internalUser.firstName}!
              </h2>
              <p className="text-sm text-gray-500">{internalUser.role}</p>
            </div>
            <UserButton afterSignOutUrl={`/${tenantId}`} />
          </div>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
```

### 9.2 Navigation Component

**components/Navigation.tsx**

```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationProps {
  tenantId: string;
  userRole: string;
}

export default function Navigation({ tenantId, userRole }: NavigationProps) {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: `/${tenantId}/admin`,
      icon: "📊",
      roles: ["SUPER_ADMIN", "MANAGER", "VIEWER"],
    },
    {
      name: "Customers",
      href: `/${tenantId}/admin/customers`,
      icon: "👥",
      roles: ["SUPER_ADMIN", "MANAGER", "VIEWER"],
    },
    {
      name: "Users",
      href: `/${tenantId}/admin/users`,
      icon: "🔐",
      roles: ["SUPER_ADMIN"],
    },
    {
      name: "Settings",
      href: `/${tenantId}/admin/settings`,
      icon: "⚙️",
      roles: ["SUPER_ADMIN"],
    },
  ];

  const visibleItems = navItems.filter((item) =>
    item.roles.includes(userRole)
  );

  return (
    <nav className="py-4">
      {visibleItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
              active
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
```

### 9.3 Dashboard Home Page

**app/[tenantId]/admin/page.tsx**

```typescript
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { db } from "@/lib/db";

export default async function AdminDashboardPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;
  const organization = await getOrganizationBySlug(tenantId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Get statistics
  const [totalCustomers, totalUsers, recentCustomers] = await Promise.all([
    db.customer.count({ where: { organizationId: organization.id } }),
    db.user.count({ where: { organizationId: organization.id } }),
    db.customer.findMany({
      where: { organizationId: organization.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        createdAt: true,
      },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard Overview</h1>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Total Customers
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalCustomers}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Internal Users
          </div>
          <div className="text-3xl font-bold text-gray-900">{totalUsers}</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500 mb-1">
            Recent Registrations
          </div>
          <div className="text-3xl font-bold text-gray-900">
            {recentCustomers.length}
          </div>
        </div>
      </div>

      {/* Recent Customers */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Recent Customers</h2>
        </div>
        <div className="divide-y">
          {recentCustomers.map((customer) => (
            <div key={customer.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {customer.firstName} {customer.lastName}
                </p>
                <p className="text-sm text-gray-500">{customer.phone}</p>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(customer.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## 10. Customer Management (CRUD)

### 10.1 Customer List Page

**app/[tenantId]/admin/customers/page.tsx**

```typescript
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import CustomerListClient from "./CustomerListClient";

export default async function CustomersPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenantId: string }>;
  searchParams: Promise<{ page?: string; search?: string; sortBy?: string; sortOrder?: string }>;
}) {
  const { tenantId } = await params;
  const sp = await searchParams;

  const organization = await getOrganizationBySlug(tenantId);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  // Pagination
  const page = parseInt(sp.page || "1");
  const pageSize = 20;
  const skip = (page - 1) * pageSize;

  // Search
  const search = sp.search || "";
  const searchFilter = search
    ? {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
    : {};

  // Sort
  const sortBy = sp.sortBy || "createdAt";
  const sortOrder = sp.sortOrder || "desc";

  // Fetch customers
  const [customers, totalCount] = await Promise.all([
    db.customer.findMany({
      where: {
        organizationId: organization.id,
        ...searchFilter,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: pageSize,
      include: {
        creator: {
          select: { firstName: true, lastName: true },
        },
      },
    }),
    db.customer.count({
      where: {
        organizationId: organization.id,
        ...searchFilter,
      },
    }),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <CustomerListClient
      tenantId={tenantId}
      customers={customers}
      currentPage={page}
      totalPages={totalPages}
      totalCount={totalCount}
      searchQuery={search}
    />
  );
}
```

### 10.2 Customer List Client Component

**app/[tenantId]/admin/customers/CustomerListClient.tsx**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatPhoneForDisplay } from "@/lib/phone-formatter";

export default function CustomerListClient({
  tenantId,
  customers,
  currentPage,
  totalPages,
  totalCount,
  searchQuery,
}: any) {
  const router = useRouter();
  const [search, setSearch] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/${tenantId}/admin/customers?search=${search}&page=1`);
  };

  const handleDelete = async (customerId: string, customerName: string) => {
    if (!confirm(`Delete ${customerName}?`)) return;

    const response = await fetch(`/api/${tenantId}/customers/${customerId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      router.refresh();
    } else {
      alert("Failed to delete customer");
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers ({totalCount})</h1>
        <Link
          href={`/${tenantId}/admin/customers/create`}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Add Customer
        </Link>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="px-4 py-2 border rounded-md w-full md:w-96"
        />
      </form>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Birth Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Registered
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {customers.map((customer: any) => (
              <tr key={customer.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Link
                    href={`/${tenantId}/admin/customers/${customer.id}`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {customer.firstName} {customer.lastName}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {formatPhoneForDisplay(customer.phone, "national")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(customer.birthDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    href={`/${tenantId}/admin/customers/${customer.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() =>
                      handleDelete(
                        customer.id,
                        `${customer.firstName} ${customer.lastName}`
                      )
                    }
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            {currentPage > 1 && (
              <Link
                href={`/${tenantId}/admin/customers?page=${currentPage - 1}&search=${search}`}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={`/${tenantId}/admin/customers?page=${currentPage + 1}&search=${search}`}
                className="px-4 py-2 border rounded-md hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 10.3 Customer Detail Page

**app/[tenantId]/admin/customers/[customerId]/page.tsx**

```typescript
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { db } from "@/lib/db";
import { formatPhoneForDisplay } from "@/lib/phone-formatter";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ tenantId: string; customerId: string }>;
}) {
  const { tenantId, customerId } = await params;
  const organization = await getOrganizationBySlug(tenantId);

  if (!organization) {
    notFound();
  }

  const customer = await db.customer.findUnique({
    where: {
      id: customerId,
      organizationId: organization.id,
    },
    include: {
      creator: true,
      updater: true,
    },
  });

  if (!customer) {
    notFound();
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          {customer.firstName} {customer.lastName}
        </h1>
        <Link
          href={`/${tenantId}/admin/customers/${customerId}/edit`}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Edit Customer
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Personal Information */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">First Name</label>
              <p className="mt-1">{customer.firstName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Last Name</label>
              <p className="mt-1">{customer.lastName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Phone</label>
              <p className="mt-1">{formatPhoneForDisplay(customer.phone, "national")}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Birth Date</label>
              <p className="mt-1">{new Date(customer.birthDate).toLocaleDateString()}</p>
            </div>
            {customer.email && (
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1">{customer.email}</p>
              </div>
            )}
          </div>
        </div>

        {/* Address (if present) */}
        {(customer.addressLine1 || customer.city) && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Address</h2>
            <div className="space-y-2">
              {customer.addressLine1 && <p>{customer.addressLine1}</p>}
              {customer.addressLine2 && <p>{customer.addressLine2}</p>}
              <p>
                {customer.city}
                {customer.state && `, ${customer.state}`}{" "}
                {customer.postalCode}
              </p>
              {customer.country && <p>{customer.country}</p>}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Metadata</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <label className="font-medium text-gray-500">Registered</label>
              <p className="mt-1">{new Date(customer.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <label className="font-medium text-gray-500">Last Updated</label>
              <p className="mt-1">{new Date(customer.updatedAt).toLocaleString()}</p>
            </div>
            {customer.creator && (
              <div>
                <label className="font-medium text-gray-500">Created By</label>
                <p className="mt-1">
                  {customer.creator.firstName} {customer.creator.lastName}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 10.4 Customer API Endpoints

**app/api/[tenantId]/customers/[customerId]/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { validatePhoneAndCheckAvailability } from "@/lib/validation/phone";

// GET single customer
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; customerId: string }> }
) {
  try {
    const { tenantId, customerId } = await params;
    const organization = await getOrganizationBySlug(tenantId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    const customer = await db.customer.findUnique({
      where: {
        id: customerId,
        organizationId: organization.id,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: customer });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
}

// PUT update customer
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; customerId: string }> }
) {
  try {
    const { tenantId, customerId } = await params;
    const body = await request.json();

    // Require authentication
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check permissions (MANAGER or above)
    if (user.role === "VIEWER") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const organization = await getOrganizationBySlug(tenantId);

    if (!organization || user.organizationId !== organization.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Get existing customer
    const existingCustomer = await db.customer.findUnique({
      where: {
        id: customerId,
        organizationId: organization.id,
      },
    });

    if (!existingCustomer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    // Validate phone if changed
    if (body.phone && body.phone !== existingCustomer.phone) {
      const phoneValidation = await validatePhoneAndCheckAvailability(
        body.phone,
        organization.settings?.country || "United States",
        organization.id,
        customerId // Exclude current customer
      );

      if (!phoneValidation.isValid || !phoneValidation.available) {
        return NextResponse.json(
          { success: false, error: phoneValidation.error || "Invalid phone" },
          { status: 400 }
        );
      }

      body.phone = phoneValidation.formatted;
    }

    // Update customer
    const updatedCustomer = await db.customer.update({
      where: { id: customerId },
      data: {
        ...body,
        birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
        updatedBy: user.id,
      },
    });

    return NextResponse.json({ success: true, data: updatedCustomer });
  } catch {
    return NextResponse.json(
      { success: false, error: "Update failed" },
      { status: 500 }
    );
  }
}

// DELETE customer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ tenantId: string; customerId: string }> }
) {
  try {
    const { tenantId, customerId } = await params;

    const user = await getCurrentUser();
    if (!user || user.role === "VIEWER") {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const organization = await getOrganizationBySlug(tenantId);

    if (!organization || user.organizationId !== organization.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    await db.customer.delete({
      where: {
        id: customerId,
        organizationId: organization.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 }
    );
  }
}
```

---

## 11. User Management

### 11.1 Users List Page

**app/[tenantId]/admin/users/page.tsx**

```typescript
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { getOrganizationUsers, getCurrentUser } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function UsersPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  // Only SUPER_ADMIN can access
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    redirect(`/${tenantId}/admin`);
  }

  const organization = await getOrganizationBySlug(tenantId);

  if (!organization) {
    redirect("/");
  }

  const users = await getOrganizationUsers(organization.id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Internal Users ({users.length})</h1>
        <Link
          href={`/${tenantId}/admin/users/create`}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          + Invite User
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {user.firstName} {user.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      user.role === "SUPER_ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : user.role === "MANAGER"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role.replace("_", " ")}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 11.2 Create User Page

**app/[tenantId]/admin/users/create/page.tsx**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateUserPage({
  params,
}: {
  params: { tenantId: string };
}) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    role: "VIEWER",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // In production, this would create a Clerk invitation
    // For now, show success message
    alert("User invitation feature requires Clerk configuration");

    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Invite New User</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">First Name *</label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Last Name *</label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full px-4 py-2 border rounded-md"
            >
              <option value="VIEWER">Viewer (Read-only)</option>
              <option value="MANAGER">Manager (Full customer access)</option>
              <option value="SUPER_ADMIN">Super Admin (Full access)</option>
            </select>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              {submitting ? "Sending..." : "Send Invitation"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-200 px-6 py-2 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

---

## 12. Settings Management

### 12.1 Settings Page

**app/[tenantId]/admin/settings/page.tsx**

```typescript
import { getOrganizationBySlug, getOrganizationSettings } from "@/lib/tenant-context";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ tenantId: string }>;
}) {
  const { tenantId } = await params;

  // Only SUPER_ADMIN can access
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "SUPER_ADMIN") {
    redirect(`/${tenantId}/admin`);
  }

  const organization = await getOrganizationBySlug(tenantId);

  if (!organization) {
    redirect("/");
  }

  const settings = await getOrganizationSettings(organization.id);

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Organization Settings</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <SettingsForm
          tenantId={tenantId}
          initialCountry={settings?.country || "United States"}
        />
      </div>
    </div>
  );
}
```

### 12.2 Settings Form

**app/[tenantId]/admin/settings/SettingsForm.tsx**

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CountrySelector from "@/components/CountrySelector";

export default function SettingsForm({
  tenantId,
  initialCountry,
}: {
  tenantId: string;
  initialCountry: string;
}) {
  const router = useRouter();
  const [country, setCountry] = useState(initialCountry);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const hasChanges = country !== initialCountry;

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch(`/api/${tenantId}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });

      const result = await response.json();

      if (result.success) {
        setMessage("Settings saved successfully!");
        router.refresh();
      } else {
        setMessage(result.error || "Failed to save");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4">Regional Settings</h2>
        <CountrySelector value={country} onChange={setCountry} />
        <p className="mt-2 text-sm text-gray-500">
          This determines phone number formatting for customer registration
        </p>
      </div>

      {message && (
        <div
          className={`p-4 rounded-md ${
            message.includes("success")
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <div>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
```

### 12.3 Country Selector Component

**components/CountrySelector.tsx**

```typescript
"use client";

import { COUNTRIES } from "@/lib/countries";

interface CountrySelectorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

export default function CountrySelector({
  value,
  onChange,
  disabled = false,
  error,
}: CountrySelectorProps) {
  const sortedCountries = [...COUNTRIES].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Country
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`w-full px-4 py-2 border rounded-md ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        {sortedCountries.map((country) => (
          <option key={country.code} value={country.name}>
            {country.name} ({country.dialCode})
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

### 12.4 Settings API

**app/api/[tenantId]/settings/route.ts**

```typescript
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getOrganizationBySlug } from "@/lib/tenant-context";
import { COUNTRIES } from "@/lib/countries";

// GET settings
export async function GET(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const organization = await getOrganizationBySlug(tenantId);

    if (!organization) {
      return NextResponse.json(
        { success: false, error: "Organization not found" },
        { status: 404 }
      );
    }

    let settings = await db.organizationSettings.findUnique({
      where: { organizationId: organization.id },
    });

    if (!settings) {
      settings = await db.organizationSettings.create({
        data: { organizationId: organization.id, country: "United States" },
      });
    }

    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

// PUT update settings
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  try {
    const { tenantId } = await params;
    const { country } = await request.json();

    const user = await getCurrentUser();
    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Only Super Admin can update settings" },
        { status: 403 }
      );
    }

    const organization = await getOrganizationBySlug(tenantId);

    if (!organization || user.organizationId !== organization.id) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    // Validate country
    const validCountry = COUNTRIES.find((c) => c.name === country);
    if (!validCountry) {
      return NextResponse.json(
        { success: false, error: "Invalid country" },
        { status: 400 }
      );
    }

    const settings = await db.organizationSettings.upsert({
      where: { organizationId: organization.id },
      update: { country },
      create: { organizationId: organization.id, country },
    });

    return NextResponse.json({ success: true, data: settings });
  } catch {
    return NextResponse.json(
      { success: false, error: "Update failed" },
      { status: 500 }
    );
  }
}
```

---

## 13. API Endpoints

### 13.1 Complete API Reference

| Method | Endpoint | Description | Auth | RBAC |
|--------|----------|-------------|------|------|
| POST | `/api/[tenantId]/customers/register` | Public customer registration | No | Public |
| POST | `/api/[tenantId]/customers/validate-phone` | Validate phone availability | No | Public |
| GET | `/api/[tenantId]/customers` | List all customers | Yes | All |
| POST | `/api/[tenantId]/customers/create` | Create customer (admin) | Yes | MANAGER+ |
| GET | `/api/[tenantId]/customers/[id]` | Get customer details | Yes | All |
| PUT | `/api/[tenantId]/customers/[id]` | Update customer | Yes | MANAGER+ |
| DELETE | `/api/[tenantId]/customers/[id]` | Delete customer | Yes | MANAGER+ |
| GET | `/api/[tenantId]/settings` | Get organization settings | Yes | All |
| PUT | `/api/[tenantId]/settings` | Update settings | Yes | SUPER_ADMIN |
| POST | `/api/webhooks/clerk` | Clerk user.created webhook | No | Webhook |

### 13.2 Standard Response Format

**Success Response:**
```json
{
  "success": true,
  "data": {
    // ... response data
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message",
  "details": {
    "field1": ["Validation error 1"],
    "field2": ["Validation error 2"]
  }
}
```

---

## 14. Testing Strategy

### 14.1 Test File Structure

Place test files alongside source files:
```
lib/
├── phone-formatter.ts
├── phone-formatter.test.ts
├── validation/
│   ├── phone.ts
│   └── phone.test.ts
components/
├── PhoneInput.tsx
└── PhoneInput.test.tsx
```

### 14.2 Sample Unit Test

**lib/phone-formatter.test.ts**

```typescript
import { validateAndFormatPhone, isE164Format } from "./phone-formatter";

describe("Phone Formatter", () => {
  describe("validateAndFormatPhone", () => {
    it("should validate US phone number", () => {
      const result = validateAndFormatPhone("(555) 123-4567", "US");
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe("+15551234567");
    });

    it("should reject invalid phone number", () => {
      const result = validateAndFormatPhone("123", "US");
      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("isE164Format", () => {
    it("should validate E.164 format", () => {
      expect(isE164Format("+15551234567")).toBe(true);
      expect(isE164Format("5551234567")).toBe(false);
      expect(isE164Format("+1 555 123 4567")).toBe(false);
    });
  });
});
```

### 14.3 Sample Component Test

**components/PhoneInput.test.tsx**

```typescript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PhoneInput from "./PhoneInput";

global.fetch = jest.fn();

describe("PhoneInput", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render phone input", () => {
    render(
      <PhoneInput
        value=""
        onChange={jest.fn()}
        defaultCountry="United States"
        tenantId="test"
      />
    );

    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
  });

  it("should call onChange when input changes", () => {
    const handleChange = jest.fn();
    render(
      <PhoneInput
        value=""
        onChange={handleChange}
        defaultCountry="United States"
        tenantId="test"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5551234567" } });

    expect(handleChange).toHaveBeenCalled();
  });

  it("should debounce validation", async () => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ success: true }),
    });

    render(
      <PhoneInput
        value=""
        onChange={jest.fn()}
        defaultCountry="United States"
        tenantId="test"
      />
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "5551234567" } });

    expect(global.fetch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(500);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    jest.useRealTimers();
  });
});
```

### 14.4 Run Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Generate coverage
npm run test:coverage
```

---

## 15. Deployment

### 15.1 Vercel Deployment (Recommended)

**Step 1: Install Vercel CLI**
```bash
npm install -g vercel
```

**Step 2: Deploy**
```bash
vercel --prod
```

**Step 3: Set Environment Variables**

In Vercel dashboard:
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx
CLERK_SECRET_KEY=sk_live_xxx
DATABASE_URL=postgresql://xxx
NEXT_PUBLIC_APP_URL=https://your-domain.com
CLERK_WEBHOOK_SECRET=whsec_xxx
```

### 15.2 Database Migrations

```bash
# Production migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

### 15.3 Clerk Webhook Setup

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint: `https://your-domain.com/api/webhooks/clerk`
3. Subscribe to: `user.created`
4. Copy signing secret to `CLERK_WEBHOOK_SECRET`

### 15.4 Docker Deployment

**Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

**Build and Run**

```bash
docker build -t loyaltyblocks .
docker run -p 3000:3000 --env-file .env.production loyaltyblocks
```

---

## 16. Conclusion

This PRD provides a complete step-by-step guide to recreate the LoyaltyBlocks application from scratch. Key implementation principles:

1. **Multi-Tenancy First**: Every query filters by organizationId
2. **E.164 Phone Storage**: Store in standard format, display with formatting
3. **Role-Based Access**: Three tiers with strict permission checks
4. **First Registrant Rule**: Automatic super admin for organization creator
5. **Type Safety**: TypeScript strict mode throughout
6. **Testing**: Co-located tests with source files
7. **API Consistency**: Standard response format across all endpoints

Follow these sections in order to build a production-ready multi-tenant SaaS application.

---

**End of PRD**
