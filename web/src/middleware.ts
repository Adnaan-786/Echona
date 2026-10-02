import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth")
  const isPublicRoute = ["/", "/login", "/register"].includes(nextUrl.pathname)
  const isAdminRoute = nextUrl.pathname.startsWith("/admin")
  const isUserRoute = nextUrl.pathname.startsWith("/dashboard")

  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  if (isAdminRoute && userRole !== "ADMIN") {
    // If a non-admin tries to access admin routes, redirect to dashboard or home
    return NextResponse.redirect(new URL(isLoggedIn ? "/dashboard" : "/login", nextUrl))
  }

  // Prevent logged-in users from accessing login/register pages
  if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
    const redirectUrl = userRole === "ADMIN" ? "/admin" : "/dashboard"
    return NextResponse.redirect(new URL(redirectUrl, nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!.+\\.[\\w]+$|_next).*)', '/', '/(api|trpc)(.*)'],
}
