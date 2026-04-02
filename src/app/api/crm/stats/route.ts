import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay } from "date-fns";

export async function GET(req: NextRequest) {
    try {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfToday = endOfDay(today);

        // Count for Today
        let todayCount = 0;
        let overdueCount = 0;

        if ((prisma as any).formRemark) {
            todayCount = await (prisma as any).formRemark.count({
                where: {
                    nextFollowUpDate: {
                        gte: startOfToday,
                        lte: endOfToday
                    },
                    followUpStatus: { not: "Closed" }
                }
            });

            // Count for Overdue
            overdueCount = await (prisma as any).formRemark.count({
                where: {
                    nextFollowUpDate: {
                        lt: startOfToday
                    },
                    followUpStatus: { not: "Closed" }
                }
            });
        } else {
            console.warn("DEBUG: prisma.formRemark is undefined in stats route. Client might be out of sync.");
        }

        return NextResponse.json({
            success: true,
            today: todayCount,
            overdue: overdueCount
        });
    } catch (error) {
        console.error("CRM Stats Error:", error);
        return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}
