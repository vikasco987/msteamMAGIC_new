const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const responses = await prisma.responseValue.findMany({
    where: {
      value: { contains: '4631' }
    },
    include: {
      response: {
        include: {
          values: {
            include: { field: true }
          }
        }
      }
    }
  });

  console.log(`Found ${responses.length} responses with 4631`);
  if (responses.length > 0) {
    responses.forEach(r => {
      console.log(`Response ID: ${r.responseId}`);
      r.response.values.forEach(v => {
        console.log(`  ${v.field.label}: ${v.value}`);
      });
    });
  }

  // Also check internal values
  const internalValues = await prisma.internalValue.findMany({
    where: { value: { contains: '4631' } },
    include: {
      response: {
        include: {
          internalValues: { include: { column: true } },
          values: { include: { field: true } }
        }
      }
    }
  });

  console.log(`Found ${internalValues.length} internal values with 4631`);
  if (internalValues.length > 0) {
    internalValues.forEach(r => {
      console.log(`Response ID: ${r.responseId}`);
      r.response.internalValues.forEach(v => {
        console.log(`  ${v.column.label}: ${v.value}`);
      });
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
