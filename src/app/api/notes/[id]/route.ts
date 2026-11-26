import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { deleteExternalTaskNote } from "@/lib/multiDbTasks";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;
    
    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid or missing note ID" }, { status: 400 });
    }

    // Try deleting from primary database first
    try {
      const deletedNote = await prisma.note.delete({
        where: { id },
      });
      return NextResponse.json({ success: true, note: deletedNote });
    } catch (primaryErr: any) {
      // If not found in primary DB (P2025: Record to delete does not exist)
      // Check and delete from external CRM databases (Secondary Kravy or Third Onboarding)
      const deletedFromExternal = await deleteExternalTaskNote(id);
      if (deletedFromExternal) {
        return NextResponse.json({ success: true, message: "Note deleted from external CRM" });
      }

      throw primaryErr;
    }
  } catch (err: unknown) {
    console.error("Error deleting note:", err);
    return NextResponse.json(
      { error: "Failed to delete note", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
