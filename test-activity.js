const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log("Recent BULK_IMPORT_UPDATE activities:");
        const activities = await prisma.formActivity.findMany({
            where: { type: "BULK_IMPORT_UPDATE" },
            orderBy: { createdAt: "desc" },
            take: 5
        });
        console.log(activities);
        
        console.log("Recent normal activities:");
        const normalActivities = await prisma.formActivity.findMany({
            orderBy: { createdAt: "desc" },
            take: 5
        });
        console.log(normalActivities);
    } catch (e) {
        console.log("Error:", e.message);
    }
}
test().finally(() => prisma.$disconnect());
