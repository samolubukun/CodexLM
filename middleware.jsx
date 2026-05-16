import { NextResponse } from "next/server";
import { stackServerApp } from "./stack";

export async function middleware(request) {
    const user = await stackServerApp.getUser();
    if (!user) {
        // If it's an API request, return 401 Unauthorized instead of redirecting
        if (request.nextUrl.pathname.startsWith('/api')) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        // For page requests, redirect to sign-in
        return NextResponse.redirect(new URL('/handler/sign-in', request.url));
    }
    return NextResponse.next();
}

export const config = {
  // Protect dashboard, workspace, and api routes
  matcher: ['/dashboard/:path*', '/workspace/:path*', '/api/:path*'],
};

  