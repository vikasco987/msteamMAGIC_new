import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const employees = await prisma.employeeProfile.findMany({
    select: { name: true, email: true }
  });
  
  const targetDate = new Date();
  const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
  const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

  const attendances = await prisma.attendance.findMany({
    where: {
      date: {
        gte: startOfMonth.toISOString(),
        lte: endOfMonth.toISOString(),
      },
    },
    select: { userId: true, employeeName: true, date: true, status: true }
  });

  const users = await prisma.user.findMany({
    select: { clerkId: true, name: true, email: true }
  });

  console.log("=== EMPLOYEES (From EmployeeProfile) ===");
  console.log(JSON.stringify(employees, null, 2));

  console.log("=== USERS (From Clerk) ===");
  console.log(JSON.stringify(users.slice(0, 5), null, 2)); // limit to 5

  console.log("=== ATTENDANCES THIS MONTH ===");
  console.log(JSON.stringify(attendances, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
