const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { title: { contains: 'account handling', mode: 'insensitive' } },
        { tags: { has: 'account handling' } }
      ],
      createdAt: {
        gte: threeMonthsAgo
      }
    },
    select: {
      title: true,
      createdAt: true,
      customFields: true,
      phone: true,
      customerName: true,
      assignerName: true,
      assigneeName: true,
      createdByName: true,
    }
  });

  let csvContent = 'Customer Name,Phone Number,Assigned By,Assigned To\n';
  
  for (const task of tasks) {
    const custom = typeof task.customFields === 'string' 
      ? JSON.parse(task.customFields) 
      : (task.customFields || {});
    
    const customerName = (task.customerName || custom.customerName || custom.shopName || '').toString().replace(/,/g, ' ').trim();
    const phone = (task.phone || custom.phone || '').toString().replace(/,/g, ' ').trim();
    const assigner = (task.assignerName || task.createdByName || '').toString().replace(/,/g, ' ').trim();
    const assignee = (task.assigneeName || '').toString().replace(/,/g, ' ').trim();

    csvContent += `"${customerName}","${phone}","${assigner}","${assignee}"\n`;
  }

  fs.writeFileSync('account_handling_3months.csv', csvContent);
  console.log(`Exported ${tasks.length} rows to account_handling_3months.csv`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
