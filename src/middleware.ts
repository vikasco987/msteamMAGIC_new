import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ✅ Define public routes explicitly
const isPublicRoute = createRouteMatcher([
    '/',
    '/sign-in(.*)',
    '/sign-up(.*)',
    '/shared(.*)',
    '/dispatch/track(.*)',
    '/api/cashfree(.*)',
    '/api/webhook(.*)'
]);

// ✅ Attach middleware logic
const middleware = clerkMiddleware(async (auth, req) => {
    const url = new URL(req.url);

    // ✅ Redirect '/' to '/dashboard'
    if (url.pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // ✅ Protect all non-public routes
    if (!isPublicRoute(req)) {
        await auth.protect();
    }

    return NextResponse.next();
});

// ✅ Export it properly
export default middleware;

// ✅ Apply to all routes except _next/static and files
export const config = {
    matcher: [
        "/((?!_next|.*\\..*).*)", // All pages
        "/(api|trpc)(.*)",        // API routes
    ],
};
