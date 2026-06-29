import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const oldEmail = "dipti.magicscale@gmail.com";
  
  // Find any FormResponse where this email might be stored in the response values
  const responses = await prisma.responseValue.findMany({
    where: { value: { contains: oldEmail } }
  });
  console.log("ResponseValues with old email:", responses.length);

  const internalValues = await prisma.internalValue.findMany({
    where: { value: { contains: oldEmail } }
  });
  console.log("InternalValues with old email:", internalValues.length);

  const customers = await prisma.customer.findMany({
    where: { email: oldEmail }
  });
  console.log("Customers with old email:", customers.length);
}

main().catch(console.error).finally(() => prisma.$disconnect());
