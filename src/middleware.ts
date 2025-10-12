import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = 'nodejs';

// Define public routes that don't require authentication
const publicRoutes = [
  "/auth/signin",
  "/auth/signup",
  "/auth/verify-request",
  "/auth/error",
];

// Define auth routes (redirect to select-org if already logged in)
const authRoutes = ["/auth/signin", "/auth/signup"];

// Wrap the auth middleware with error handling
const authMiddleware = auth((req) => {
  try {
    const { pathname } = req.nextUrl;

    // Skip middleware for static files, API routes, and assets
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/api") ||
      pathname.startsWith("/static") ||
      pathname.includes(".")
    ) {
      return NextResponse.next();
    }

    // Check if current route is public
    const isPublicRoute = publicRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Check if current route is an auth route
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Check if user has a valid session using NextAuth v5
    const hasSession = !!req.auth;

    // If user is not authenticated and trying to access protected route
    if (!hasSession && !isPublicRoute) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // If user is authenticated and trying to access auth pages
    if (hasSession && isAuthRoute) {
      return NextResponse.redirect(new URL("/select-org", req.url));
    }

    // If user is authenticated and on root, redirect to select-org
    if (hasSession && pathname === "/") {
      return NextResponse.redirect(new URL("/select-org", req.url));
    }

    // Protect /select-org and /onboarding routes - require authentication
    if (
      !hasSession &&
      (pathname.startsWith("/select-org") || pathname.startsWith("/onboarding"))
    ) {
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(signInUrl);
    }

    // If user is authenticated and trying to access dashboard, check session for orgId
    if (hasSession && pathname.startsWith("/dashboard")) {
      // Check if user has selectedOrgId in session
      const selectedOrgId = req.auth?.selectedOrgId;

      if (!selectedOrgId) {
        return NextResponse.redirect(new URL("/select-org", req.url));
      }
    }

    // If user is trying to access other protected routes, check session for orgId
    const protectedRoutes = ["/contracts", "/team", "/billing", "/settings"];
    if (
      hasSession &&
      protectedRoutes.some((route) => pathname.startsWith(route))
    ) {
      // Check if user has selectedOrgId in session
      const selectedOrgId = req.auth?.selectedOrgId;

      if (!selectedOrgId) {
        return NextResponse.redirect(new URL("/select-org", req.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware error:", error);
    // In case of error, allow the request to continue
    return NextResponse.next();
  }
});

export default authMiddleware;

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - API routes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)",
  ],
};