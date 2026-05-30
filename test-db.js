const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const links = await prisma.shortLink.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5
  });
  console.log(links);
}
main().finally(() => prisma.$disconnect());
