const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

  const tasks = await prisma.task.findMany({
    where: {
      title: {
        contains: 'account handling',
        mode: 'insensitive'
      },
      createdAt: {
        gte: threeMonthsAgo
      }
    },
    select: {
      title: true,
      createdAt: true,
      customFields: true,
      phone: true,
      assignerName: true,
      assigneeName: true,
    }
  });

  let csvContent = 'Customer Name,Phone Number,Assigned By,Assigned To,Created At\n';
  
  for (const task of tasks) {
    const custom = typeof task.customFields === 'string' ? JSON.parse(task.customFields) : task.customFields || {};
    const customerName = (custom.customerName || '').replace(/,/g, '');
    const phone = (task.phone || custom.phone || '').replace(/,/g, '');
    const assigner = (task.assignerName || '').replace(/,/g, '');
    const assignee = (task.assigneeName || '').replace(/,/g, '');
    const createdAt = task.createdAt ? task.createdAt.toISOString().split('T')[0] : '';
    
    csvContent += `${customerName},${phone},${assigner},${assignee},${createdAt}\n`;
  }

  fs.writeFileSync('account_handling_data.csv', csvContent);
  console.log(`Exported ${tasks.length} rows to account_handling_data.csv`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
