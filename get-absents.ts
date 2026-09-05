import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const targetDateStr = "2026-09-05"; // today
  
  // 1. Get all active employee profiles
  const employeeProfiles = await prisma.employeeProfile.findMany({ 
    select: { email: true, employmentStatus: true } 
  });
  const employeeEmails = new Set(
    employeeProfiles
      .filter(e => e.employmentStatus === "Active" || e.employmentStatus === "Notice Period")
      .map(e => e.email.toLowerCase())
  );

  // 2. Get active users this month
  const currentMonthStart = new Date(targetDateStr);
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const endOfCurrentMonth = new Date(currentMonthStart);
  endOfCurrentMonth.setMonth(endOfCurrentMonth.getMonth() + 1);

  const thisMonthAttendances = await prisma.attendance.findMany({
    where: { date: { gte: currentMonthStart, lt: endOfCurrentMonth } },
    select: { userId: true },
    distinct: ['userId']
  });
  const activeUserIdsThisMonth = new Set(thisMonthAttendances.map(a => a.userId));

  // 3. Get all users
  const allUsers = await prisma.user.findMany({
    select: { clerkId: true, name: true, email: true }
  });

  // 4. Get present users today
  const targetDate = new Date(targetDateStr);
  targetDate.setHours(0, 0, 0, 0);
  const targetNext = new Date(targetDate);
  targetNext.setDate(targetNext.getDate() + 1);

  const todayAttendances = await prisma.attendance.findMany({
    where: { date: { gte: targetDate, lt: targetNext } },
    select: { userId: true }
  });
  const presentUserIds = new Set(todayAttendances.map(a => a.userId));

  // 5. Calculate absents
  const absentUsers = allUsers.filter(u => 
    !presentUserIds.has(u.clerkId) && 
    employeeEmails.has(u.email.toLowerCase()) &&
    activeUserIdsThisMonth.has(u.clerkId)
  );

  console.log(`Total absents today (${targetDateStr}): ${absentUsers.length}`);
  console.log("Names:", absentUsers.map(u => u.name).join(", "));
}

main().catch(console.error).finally(() => prisma.$disconnect());
