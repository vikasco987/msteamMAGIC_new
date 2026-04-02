import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import cloudinary from "cloudinary";

// ✅ Cloudinary Config
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ✅ Helper to extract public_id from Cloudinary URL
function extractPublicId(url: string): string | null {
  try {
    const parts = url.split("/");
    const lastPart = parts.pop()?.split(".")[0];
    const folderParts = parts.slice(parts.indexOf("upload") + 1);
    return folderParts.concat(lastPart || "").join("/");
  } catch {
    return null;
  }
}

// ✅ PATCH: Replace an attachment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { oldUrl, newUrl } = await req.json();
    if (!oldUrl || !newUrl) {
      return NextResponse.json({ error: "Missing URLs" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    if (!task.attachments.includes(oldUrl)) {
      return NextResponse.json({ error: "Old URL not found in attachments" }, { status: 400 });
    }

    const updatedAttachments = task.attachments.map((url) =>
      url === oldUrl ? newUrl : url
    );

    await prisma.task.update({
      where: { id },
      data: { attachments: updatedAttachments, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("PATCH error:", err);
    return NextResponse.json(
      { error: "Server error", details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}

// ✅ POST: Add a new attachment
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Attachment URL required" }, { status: 400 });
    }

    await prisma.task.update({
      where: { id },
      data: { attachments: { push: url }, updatedAt: new Date() },
    });

    return NextResponse.json({ message: "Attachment added" });
  } catch (err) {
    console.error("POST error:", err);
    return NextResponse.json(
      { error: "Server error", details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}

// ✅ DELETE: Remove an attachment and delete from Cloudinary
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "Attachment URL required" }, { status: 400 });
    }

    const task = await prisma.task.findUnique({ where: { id } });
    if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 });

    if (!task.attachments.includes(url)) {
      return NextResponse.json({ error: "Attachment not found in task" }, { status: 400 });
    }

    const publicId = extractPublicId(url);
    if (publicId) {
      await cloudinary.v2.uploader.destroy(publicId, { resource_type: "auto" });
    }

    const updatedAttachments = task.attachments.filter((att) => att !== url);

    await prisma.task.update({
      where: { id },
      data: { attachments: updatedAttachments, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, message: "Attachment deleted" });
  } catch (err) {
    console.error("DELETE error:", err);
    return NextResponse.json(
      { error: "Server error", details: err instanceof Error ? err.message : err },
      { status: 500 }
    );
  }
}

// ✅ Prevent Next.js from treating this as a static route
export const GET = undefined;
export const dynamic = "force-dynamic";
