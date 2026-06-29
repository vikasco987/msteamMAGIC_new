import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oldId = "user_358Zjbe5UQ7SD2snkIKh3Nnluw0";
  const newId = "user_3Ec4rZI1fs31m2RLphgE56zk3lM";

  // Check if InternalValue.value has the old clerkId
  const internalValuesWithClerkId = await prisma.internalValue.findMany({
    where: { value: { contains: oldId } }
  });
  console.log("InternalValues containing old clerkId as value:", internalValuesWithClerkId.length);

  for (const iv of internalValuesWithClerkId) {
    const newValue = iv.value.replace(new RegExp(oldId, 'g'), newId);
    await prisma.internalValue.update({
      where: { id: iv.id },
      data: { value: newValue }
    });
  }
  
  if (internalValuesWithClerkId.length > 0) {
    console.log(`Updated ${internalValuesWithClerkId.length} internal values that had clerkId inside.`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
