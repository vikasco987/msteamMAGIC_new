import { NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function GET() {
    try {
        const client = await clerkClient();
        const clerkUsersResponse = await client.users.getUserList({ limit: 500 });
        return NextResponse.json({ 
            count: clerkUsersResponse.data.length,
            totalCount: clerkUsersResponse.totalCount,
            users: clerkUsersResponse.data.map(u => u.emailAddresses[0]?.emailAddress)
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
