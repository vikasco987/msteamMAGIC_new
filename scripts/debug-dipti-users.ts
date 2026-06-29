import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { 
      OR: [
        { email: { contains: "dipti", mode: 'insensitive' } },
        { name: { contains: "dipti", mode: 'insensitive' } }
      ]
    }
  });
  console.log("Users with name/email dipti:");
  console.log(users.map(u => ({ email: u.email, name: u.name, id: u.id, clerkId: u.clerkId })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
