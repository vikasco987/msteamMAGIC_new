import { NextRequest, NextResponse } from "next/server";
import { runBackup } from "@/lib/backup/mongodb-backup";

export async function POST(req: NextRequest) {
  try {
    console.log("Starting manual backup via direct TS module call...");
    
    // Call the logic directly!
    await runBackup();
    
    return NextResponse.json({ 
      message: "Backup completed successfully"
    });

  } catch (error: any) {
    console.error("Manual backup trigger error:", error);
    return NextResponse.json({ error: "Failed to trigger backup", details: error.message }, { status: 500 });
  }
}
