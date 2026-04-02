import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  try {
    const count = await prisma.attendance.count()
    console.log('Successfully connected to DB. Attendance count:', count)
  } catch (e) {
    console.error('Failed to connect to DB:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
