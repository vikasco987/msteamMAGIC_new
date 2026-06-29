import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const items = await prisma.inventoryItem.findMany({
    where: { name: "printer" },
    orderBy: { createdAt: 'asc' }
  });

  if (items.length > 1) {
    console.log(`Found ${items.length} printers. Deleting duplicates...`);
    for (let i = 1; i < items.length; i++) {
      await prisma.inventoryItem.delete({ where: { id: items[i].id } });
      console.log(`Deleted ${items[i].id}`);
    }
  } else {
    console.log("No duplicates found.");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
