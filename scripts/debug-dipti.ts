import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { email: { contains: "dipti", mode: 'insensitive' } }
  });
  console.log("Users with dipti:", users.map(u => u.email));
}

main().catch(console.error).finally(() => prisma.$disconnect());
