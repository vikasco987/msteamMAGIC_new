import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listCols() {
  const cols = await prisma.internalColumn.findMany({
    select: { label: true, id: true }
  });
  console.log(JSON.stringify(cols, null, 2));
}

listCols().finally(() => prisma.$disconnect());
