import { NextRequest, NextResponse } from "next/server";
import { GET } from "./src/app/api/attendance/list/route";
import { auth, clerkClient } from "@clerk/nextjs/server";

// Mock auth and clerkClient
jest.mock("@clerk/nextjs/server", () => ({
  auth: () => ({ userId: "user_master" }),
  clerkClient: () => ({
    users: {
      getUser: async () => ({
        publicMetadata: { role: "master" },
        firstName: "Master",
        lastName: "User",
        username: "master"
      })
    }
  })
}));

async function test() {
  const req = new Request("http://localhost:3000/api/attendance/list?date=2026-08-07&all=true");
  const res = await GET(req);
  const data = await res.json();
  console.log("Returned records count:", Array.isArray(data) ? data.length : data);
  if (Array.isArray(data)) {
    console.log("Sample:", data.length > 0 ? data[0] : "none");
  }
}

test().catch(console.error);
