import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { clerkId: true, role: true, email: true }
    });
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));

    const recentNotifications = await prisma.notification.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
    });
    console.log('--- RECENT NOTIFICATIONS ---');
    console.log(JSON.stringify(recentNotifications, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
