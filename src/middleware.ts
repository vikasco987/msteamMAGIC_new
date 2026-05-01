import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ✅ Attach middleware logic
const middleware = clerkMiddleware((auth, req) => {
    const url = new URL(req.url);

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
