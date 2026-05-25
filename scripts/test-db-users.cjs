require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const users = await prisma.user.findMany();
  console.log('Total DB users:', users.length);
  console.log(users.map(u => u.name));
  await prisma.$disconnect();
}

check().catch(console.error);
