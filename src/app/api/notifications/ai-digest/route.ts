
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const googleProvider = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY || "",
});

export async function GET(req: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Calculate Time Ranges (Yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. CRM Stats (FormRemarks)
        const crmRemarks = await (prisma as any).formRemark.findMany({
            where: {
                createdAt: { gte: yesterday, lt: today }
            }
        });

        // 2. Financial Stats (PaymentRemarks)
        const collections = await prisma.paymentRemark.findMany({
            where: {
                createdAt: { gte: yesterday, lt: today }
            }
        });

        // 3. High Priority / Missed Leads
        const missedLeads = await (prisma as any).formRemark.findMany({
            where: {
                followUpStatus: { in: ["Missed", "missed"] },
                createdAt: { gte: yesterday }
            },
            take: 5
        });

        const stats = {
            followUps: crmRemarks.length,
            revenue: collections.reduce((acc, curr) => acc + (curr.amountReceived || 0), 0),
            missedCount: missedLeads.length,
            details: missedLeads.map((m: any) => m.remark).join(", ")
        };

        const prompt = `You are a Smart Business CRM AI. 
        Analyze these stats from yesterday and provide a motivational but practical "Daily Digest" for the user.
        
        Stats:
        - Follow-ups Done: ${stats.followUps}
        - Total Collection: ₹${stats.revenue}
        - Critical Leads Missed: ${stats.missedCount}
        - Missed Context: ${stats.details}

        Constraint: Use a concise, premium "Sales Coach" tone.
        
        Return ONLY a JSON object:
        {
          "summary": "Short 2 sentence recap of yesterday",
          "priority": "The #1 task for today",
          "isPositive": true/false (based on performance)
        }`;

        const { text } = await generateText({
            model: googleProvider("gemini-1.5-flash"),
            prompt: prompt,
            maxRetries: 0,
        });

        const cleanedJson = (text || "{}").replace(/```json/gi, "").replace(/```/g, "").trim();
        const digest = JSON.parse(cleanedJson);

        return NextResponse.json(digest);
    } catch (error: any) {
        console.error("AI DIGEST EXCEPTION:", error);
        return NextResponse.json({
            summary: "Performance history scanned. CRM systems operational.",
            priority: "Focus on re-engaging missed follow-ups from yesterday.",
            isPositive: true
        });
    }
}
