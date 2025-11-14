/**
 * Next.js Middleware
 *
 * This middleware runs on every request and handles:
 * 1. Tenant extraction from URL path (/[tenantId]/...)
 * 2. Tenant validation (organization exists)
 * 3. Setting tenant context headers for API routes and server components
 * 4. Clerk authentication for protected admin routes
 */

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/(.+)/admin(.*)", // All admin routes require auth
]);

// Define public routes that don't require tenant validation
const isPublicRoute = createRouteMatcher([
  "/",
  "/api/health",
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

/**
 * Extract tenant slug from URL path
 */
function extractTenantSlug(pathname: string): string | null {
  // Skip Next.js internal routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/_") ||
    pathname.includes(".")
  ) {
    return null;
  }

  // Extract first segment as tenant slug
  const segments = pathname.replace(/^\//, "").split("/");
  const tenantSlug = segments[0];

  if (!tenantSlug || tenantSlug.startsWith("_")) {
    return null;
  }

  return tenantSlug;
}

/**
 * Main middleware function
 */
export default clerkMiddleware(async (auth, req: NextRequest) => {
  const { pathname } = req.nextUrl;

  // Skip middleware for public routes (root, health check, etc.)
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // Extract tenant slug from URL
  const tenantSlug = extractTenantSlug(pathname);

  // If we have a tenant slug, validate and set context
  if (tenantSlug) {
    // For now, we'll just set the tenant slug in headers
    // In production, you'd want to validate the tenant exists in the database
    // but we can't do async DB calls in middleware without edge runtime
    // So we'll validate in API routes and server components using getTenantContext()

    const requestHeaders = new Headers(req.headers);
    requestHeaders.set("x-organization-slug", tenantSlug);
    requestHeaders.set("x-pathname", pathname);

    // For protected admin routes, require authentication
    if (isProtectedRoute(req)) {
      const { userId } = await auth();

      if (!userId) {
        // Redirect to sign-in if not authenticated
        const signInUrl = new URL(`/${tenantSlug}/sign-in`, req.url);
        signInUrl.searchParams.set("redirect_url", pathname);
        return NextResponse.redirect(signInUrl);
      }

      // Set clerk user ID in headers for downstream use
      requestHeaders.set("x-clerk-user-id", userId);
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // No tenant slug found, continue normally
  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
