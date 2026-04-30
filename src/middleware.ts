import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ✅ Attach middleware logic
const middleware = clerkMiddleware((auth, req) => {
    const url = new URL(req.url);
    
    // ✅ Make Payment Links completely PUBLIC
    if (url.pathname.startsWith("/api/p/") || url.pathname.startsWith("/api/cashfree/")) {
        return NextResponse.next();
    }

    // ✅ Bypass redirect for payment links (old path just in case)
    if (url.pathname.startsWith("/p/")) {
        return NextResponse.next();
    }

    // ✅ Redirect '/' to '/dashboard'
    if (url.pathname === "/") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
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
