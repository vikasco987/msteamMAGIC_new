import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { paymentId, invoiceUrl } = await req.json();

    if (!paymentId || !invoiceUrl) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const updated = await prisma.payment.update({
      where: { id: paymentId },
      data: { invoiceUrl },
    });

    return NextResponse.json({ success: true, payment: updated });
  } catch (err) {
    console.error("Update invoice error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
