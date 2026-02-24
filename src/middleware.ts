import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
    const isAuth = request.cookies.has("authjs.session-token") || request.cookies.has("__Secure-authjs.session-token")

    // Redirect to login if accessing dashboard without session
    if (!isAuth && request.nextUrl.pathname.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/login", request.url))
    }

    // Redirect to dashboard if trying to access auth pages with active session
    if (isAuth && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
        return NextResponse.redirect(new URL("/dashboard", request.url))
    }

    return NextResponse.next()
}

export const config = {
    // Matcher ensures this runs only on the targeted routes
    matcher: ["/dashboard/:path*", "/login", "/register"],
}
