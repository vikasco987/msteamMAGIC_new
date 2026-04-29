import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const permissions = await prisma.sidebarPermission.findMany();
  
  for (const permission of permissions) {
    if (!permission.sidebarItems.includes("Payment Portal")) {
      const updatedItems = [...permission.sidebarItems, "Payment Portal"];
      await prisma.sidebarPermission.update({
        where: { id: permission.id },
        data: { sidebarItems: updatedItems }
      });
      console.log(`Updated permissions for role: ${permission.role}`);
    }
  }
  
  console.log("Done updating permissions.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
