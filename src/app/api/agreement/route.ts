import { NextRequest, NextResponse } from "next/server";
import { generateAgreementPDF } from "@/lib/agreement";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientName } = body;

    const pdfBuffer = await generateAgreementPDF(body);
    const filename = `${clientName || "Client"}-agreement.pdf`;

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err: any) {
    console.error("Failed to generate PDF:", err);
    return NextResponse.json({ error: "Failed to generate PDF", details: err.message }, { status: 500 });
  }
}
