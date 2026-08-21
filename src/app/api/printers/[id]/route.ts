import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const printerId = params.id;

    // Use await to get params properties in modern NextJS, but since params.id is just accessed, we could await params.
    const { id } = await params;

    const printer = await prisma.serialNumber.findUnique({
      where: { id },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dispatches: {
          include: {
            task: {
              select: {
                id: true,
                title: true,
                status: true,
                customFields: true
              }
            }
          },
          orderBy: {
            dispatchDate: "desc"
          }
        }
      }
    });

    if (!printer) {
      return NextResponse.json({ error: "Printer not found" }, { status: 404 });
    }

    return NextResponse.json({ printer });

  } catch (err: any) {
    console.error(`❌ GET /api/printers/[id] error:`, err);
    return NextResponse.json(
      { error: "Failed to fetch printer details", details: err.message },
      { status: 500 }
    );
  }
}
