import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("Starting employee sync...");
  
  // Get all unique users who have marked attendance
  const attendances = await prisma.attendance.findMany({
    select: { userId: true, employeeName: true }
  });

  const uniqueUserIds = new Set<string>();
  attendances.forEach(a => {
    if (a.userId) uniqueUserIds.add(a.userId);
  });

  console.log(`Found ${uniqueUserIds.size} unique users who have marked attendance.`);

  let createdCount = 0;
  let existingCount = 0;
  let skippedCount = 0;

  for (const clerkId of uniqueUserIds) {
    // Attempt to find the User record to get the email
    let user = await prisma.user.findUnique({
      where: { clerkId }
    });

    if (!user) {
      console.log(`[SKIP] No User record found in database for Clerk ID: ${clerkId}`);
      skippedCount++;
      continue;
    }

    if (!user.email) {
      console.log(`[SKIP] User record has no email: ${clerkId}`);
      skippedCount++;
      continue;
    }

    // Check if EmployeeProfile already exists
    const existingProfile = await prisma.employeeProfile.findUnique({
      where: { email: user.email }
    });

    if (existingProfile) {
      existingCount++;
      continue;
    }

    // Create EmployeeProfile safely
    try {
      await prisma.employeeProfile.create({
        data: {
          email: user.email,
          name: user.name || "Unknown",
          department: "Sales",
          baseSalary: 0,
        }
      });
      console.log(`[CREATED] Added ${user.name || "Unknown"} (${user.email}) to Employee Directory.`);
      createdCount++;
    } catch (e) {
      console.error(`[ERROR] Failed to create profile for ${user.email}:`, e);
    }
  }

  console.log("\n--- Sync Summary ---");
  console.log(`Created: ${createdCount}`);
  console.log(`Already Existing: ${existingCount}`);
  console.log(`Skipped (No valid user/email): ${skippedCount}`);
  console.log("--------------------");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
