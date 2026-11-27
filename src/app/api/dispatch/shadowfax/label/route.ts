import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { awbNumber, fileType = "pdf", size, includeProductDetails, includeGstNumber } = body;

    if (!awbNumber || typeof awbNumber !== "string") {
      return NextResponse.json({ error: "AWB Number is required" }, { status: 400 });
    }

    const cleanAwb = awbNumber.trim();
    const SHADOWFAX_API_TOKEN =
      process.env.SHADOWFAX_API_TOKEN || "50b54c53d49eea0930d97763c8f57fe5a3d6357d";

    if (!SHADOWFAX_API_TOKEN) {
      return NextResponse.json(
        { error: "Shadowfax API Token not configured" },
        { status: 500 }
      );
    }

    const payload: Record<string, any> = {
      awb_number: cleanAwb,
      file_type: fileType === "prn" ? "prn" : "pdf",
    };

    if (size) payload.size = size;
    if (typeof includeProductDetails === "boolean") {
      payload.include_product_details = includeProductDetails;
    }
    if (typeof includeGstNumber === "boolean") {
      payload.include_gst_number = includeGstNumber;
    }

    const sfxRes = await fetch("https://dale.shadowfax.in/api/client/generate_label/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Token ${SHADOWFAX_API_TOKEN}`,
      },
      body: JSON.stringify(payload),
    });

    const sfxData = await sfxRes.json();

    if (!sfxRes.ok || !sfxData?.data?.label_url) {
      const errMsg =
        sfxData?.message ||
        sfxData?.error ||
        "Failed to generate shipping label from Shadowfax";
      return NextResponse.json(
        { error: errMsg, details: sfxData },
        { status: sfxRes.status >= 400 ? sfxRes.status : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: sfxData.message || "Label generated successfully",
      labelUrl: sfxData.data.label_url,
      awbNumber: cleanAwb,
    });
  } catch (error: any) {
    console.error("Shadowfax Generate Label API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
