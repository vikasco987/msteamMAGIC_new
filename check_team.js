const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const tl = await prisma.user.findFirst({ where: { name: { contains: "himanshu", mode: "insensitive" } } });
    if (!tl) { console.log("TL not found"); return; }
    console.log("TL:", tl.name, tl.clerkId);
    
    const members = await prisma.user.findMany({ where: { leaderIds: { has: tl.clerkId } } });
    console.log("Members count:", members.length);
    const teamUserIds = members.map(m => m.clerkId);
    
    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    
    const tasks = await prisma.task.findMany({
        where: {
            createdAt: { gte: startOfCurrentMonth, lte: endOfCurrentMonth },
            OR: [
                { createdByClerkId: { in: teamUserIds } },
                { assigneeId: { in: teamUserIds } },
                { assigneeIds: { hasSome: teamUserIds } }
            ]
        }
    });
    
    let totalAll = 0;
    let totalCreatedByMembers = 0;
    
    for (const t of tasks) {
        totalAll += (t.amount || 0);
        if (teamUserIds.includes(t.createdByClerkId)) {
            totalCreatedByMembers += (t.amount || 0);
        }
    }
    
    console.log("Total Fetched (All tasks):", totalAll);
    console.log("Total Created By Members:", totalCreatedByMembers);
}

main().finally(() => prisma.$disconnect());
