import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get("custom_auth_token")?.value;

        if (token) {
            return NextResponse.json({ token });
        }

        return NextResponse.json({ token: null }, { status: 401 });
    } catch (error) {
        console.error("Error retrieving custom token:", error);
        return NextResponse.json({ token: null }, { status: 500 });
    }
}
