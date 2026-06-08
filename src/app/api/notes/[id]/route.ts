import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing note ID" }, { status: 400 });
    }

    const deletedNote = await prisma.note.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, note: deletedNote });
  } catch (err: unknown) {
    console.error("Error deleting note:", err);
    return NextResponse.json(
      { error: "Failed to delete note", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
