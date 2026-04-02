import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
    const { userId, sessionClaims } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
    const userRole = String(dbUser?.role || "user").toLowerCase();
    const isAdmin = userRole === "admin" || userRole === "master";

    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");
        const page = parseInt(searchParams.get("page") || "1");
        const skip = (page - 1) * limit;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const isTL = (dbUser as any)?.isTeamLeader || userRole === "tl";
        let teamMemberIds: string[] = [];
        if (isTL) {
            const members = await prisma.user.findMany({
                where: { leaderId: userId } as any,
                select: { clerkId: true }
            });
            teamMemberIds = members.map(m => m.clerkId);
        }

        const where: any = {};
        if (!isAdmin) {
            if (isTL) {
                where.authorId = { in: [userId, ...teamMemberIds] };
            } else {
                where.authorId = userId;
            }
        }

        const [activities, total, todayCount, typeDistribution] = await Promise.all([
            prisma.activity.findMany({
                where,
                include: {
                    task: {
                        select: {
                            title: true,
                        }
                    }
                },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            }),
            prisma.activity.count({ where }),
            prisma.activity.count({
                where: {
                    ...where,
                    createdAt: { gte: todayStart }
                }
            }),
            prisma.activity.groupBy({
                by: ['type'],
                where,
                _count: {
                    type: true
                }
            })
        ]);

        return NextResponse.json({
            activities,
            total,
            stats: {
                todayCount,
                typeDistribution: typeDistribution.reduce((acc: any, curr) => {
                    acc[curr.type] = curr._count.type;
                    return acc;
                }, {})
            },
            page,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error("Failed to fetch activities:", error);
        return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
    }
}
