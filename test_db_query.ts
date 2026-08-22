import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const t = await prisma.task.findMany({ where: { id: "6a830f22f059d9b7320314f7" } })
  console.log("Tasks:", t)
}
main().finally(() => prisma.$disconnect())
