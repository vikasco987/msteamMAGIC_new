import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const date = "2026-09-05";
  const startDate = new Date(`${date}T00:00:00.000Z`);
  const endDate = new Date(`${date}T23:59:59.999Z`);
  const where = { date: { gte: startDate, lte: endDate } };

  const records = await prisma.attendance.findMany({ where, select: { userId: true, employeeName: true, date: true } });
  
  const presentIds = new Set(records.map(r => r.userId));
  console.log("Present today:", presentIds.size);
  console.log(Array.from(presentIds));
  
  const allUsers = await prisma.user.findMany({ select: { clerkId: true, name: true, email: true } });
  
  const employeeProfiles = await prisma.employeeProfile.findMany({ 
    select: { email: true, employmentStatus: true } 
  });
  const employeeEmails = new Set(
    employeeProfiles
      .filter(e => e.employmentStatus === "Active" || e.employmentStatus === "Notice Period")
      .map(e => e.email.toLowerCase())
  );
  
  const currentMonthStart = new Date(date);
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
  
  console.log("---");
  for (const u of allUsers) {
    if (!employeeEmails.has(u.email.toLowerCase())) continue;
    
    if (presentIds.has(u.clerkId)) {
       console.log(`✅ Present: ${u.name || u.email}`);
    } else if (activeUserIdsThisMonth.has(u.clerkId)) {
       console.log(`❌ Absent (Punched this month): ${u.name || u.email}`);
    } else {
       console.log(`⚠️  Absent (NO punches this month): ${u.name || u.email}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
