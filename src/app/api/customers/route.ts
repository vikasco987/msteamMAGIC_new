// import { NextResponse } from "next/server"
// import { PrismaClient } from "@prisma/client"

// const prisma = new PrismaClient()

// export async function GET() {
//   try {
//     const customers = await prisma.Customer.findMany({
//       orderBy: { createdAt: "desc" },
//     })
//     return NextResponse.json(customers, { status: 200 })
//   } catch (err: any) {
//     console.error("Error fetching customers:", err)
//     return NextResponse.json({ error: err.message || "Failed to fetch customers" }, { status: 500 })
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const body = await req.json()
//     const { name, phone, email, remark } = body

//     if (!name || !phone) {
//       return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
//     }

//     const customer = await prisma.Customer.create({  // ✅ Capital C
//       data: { name, phone, email, remark },
//     })

//     return NextResponse.json(customer, { status: 200 })
//   } catch (err: any) {
//     console.error("Error creating customer:", err)
//     return NextResponse.json({ error: err.message || "Failed to save customer" }, { status: 500 })
//   }
// }






import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {

    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    })
    return NextResponse.json(customers, { status: 200 })
  } catch (err: any) {
    console.error("Error fetching customers:", err)
    return NextResponse.json({ error: err.message || "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, phone, email, remark } = body

    if (!name || !phone) {
      return NextResponse.json({ error: "Name and phone are required" }, { status: 400 })
    }

    const customer = await prisma.customer.create({
      data: { name, phone, email, remark },
    })

    return NextResponse.json(customer, { status: 200 })
  } catch (err: any) {
    console.error("Error creating customer:", err)
    return NextResponse.json({ error: err.message || "Failed to save customer" }, { status: 500 })
  }
}