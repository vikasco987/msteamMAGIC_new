import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany({ select: { clerkId: true, email: true } });
  
  const employeeProfiles = await prisma.employeeProfile.findMany({ 
    where: { employmentStatus: { in: ["Active", "Notice Period"] } },
    select: { email: true, employmentStatus: true } 
  });
  const employeeEmails = new Set(employeeProfiles.map(e => e.email.toLowerCase()));

  console.log("Total employee profiles active:", employeeEmails.size);
  
  const targetDateStr = "2026-09-05";
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
  
  for (const uid of activeUserIdsThisMonth) {
    const u = allUsers.find(x => x.clerkId === uid);
    if (!u) {
       console.log(uid, "not in allUsers");
       continue;
    }
    const hasProfile = employeeEmails.has(u.email.toLowerCase());
    console.log(uid, u.email, "hasProfile:", hasProfile);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
