import { auth } from "@/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/signin", "/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthApiRoute = nextUrl.pathname.startsWith("/api/auth");
  const isRegisterApiRoute = nextUrl.pathname === "/api/register";

  if (isAuthApiRoute || isRegisterApiRoute) {
    return NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/signin", nextUrl));
  }

  if (isLoggedIn && isPublicRoute) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};