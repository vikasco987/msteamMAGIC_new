const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const responseCount = await prisma.formResponse.count();
    console.log('Total Responses:', responseCount);

    const firstResponse = await prisma.formResponse.findFirst();
    if (firstResponse) {
        console.log('First Response Details:');
        console.log('ID:', firstResponse.id);
        console.log('FormID:', firstResponse.formId);
        console.log('visibleToRoles:', firstResponse.visibleToRoles);
        console.log('visibleToUsers:', firstResponse.visibleToUsers);
    }

    const users = await prisma.user.findMany();
    console.log('Registered Users:', JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
