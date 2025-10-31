import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";

const PUBLIC_ROUTES = [
  "/auth/signin",
  "/auth/signup",
  "/auth/verify-request",
  "/auth/error",
];

const AUTH_ROUTES = ["/auth/signin", "/auth/signup"];

const ORG_SELECTION_ROUTES = ["/select-org", "/onboarding"];

function isRoute(path: string, list: string[]) {
  return list.some((r) => path.startsWith(r));
}

function isProtectedRoute(path: string): boolean {
  return !isRoute(path, PUBLIC_ROUTES) && !isRoute(path, ORG_SELECTION_ROUTES);
}

function shouldSkip(path: string) {
  return (
    path.startsWith("/_next") ||
    path.startsWith("/api") ||
    path.startsWith("/static") ||
    path.includes(".")
  );
}

const middleware = auth(async (req) => {
  const { pathname } = req.nextUrl;
  const hasSession = Boolean(req.auth);

  if (shouldSkip(pathname)) return NextResponse.next();

  const isPublic = isRoute(pathname, PUBLIC_ROUTES);
  const isAuth = isRoute(pathname, AUTH_ROUTES);
  const isOrgSelection = isRoute(pathname, ORG_SELECTION_ROUTES);
  const isProtected = isProtectedRoute(pathname);

  if (!hasSession && !isPublic) {
    const url = new URL("/auth/signin", req.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (hasSession && isAuth) {
    return NextResponse.redirect(new URL("/select-org", req.url));
  }

  if (hasSession && pathname === "/") {
    return NextResponse.redirect(new URL("/select-org", req.url));
  }

  if (hasSession && isOrgSelection) {
    const orgId = req.auth?.selectedOrgId;

    if (orgId) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (hasSession && isProtected) {
    const orgId = req.auth?.selectedOrgId;
    const skipCheck = req.nextUrl.searchParams.get("_from_org_select") === "1";

    if (!orgId && !skipCheck) {
      return NextResponse.redirect(new URL("/select-org", req.url));
    }

    if (skipCheck && !orgId) {
      const url = new URL(req.nextUrl.pathname, req.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
});

export default middleware;

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)"],
};
