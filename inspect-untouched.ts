import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function inspectUntouched() {
  const leads = await prisma.formResponse.findMany({
    where: { isTouched: false },
    take: 10,
    include: {
      values: true,
      internalValues: true,
      remarks: true
    }
  });
  
  console.log(JSON.stringify(leads, null, 2));
}

inspectUntouched().finally(() => prisma.$disconnect());
