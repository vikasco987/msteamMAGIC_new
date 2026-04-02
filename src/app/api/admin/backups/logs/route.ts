import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const primaryLogPath = path.resolve(process.cwd(), "scripts/backup/backup.log");
    const fallbackLogPath = "/tmp/backup.log";
    
    let logPath = primaryLogPath;
    
    if (!fs.existsSync(logPath) && fs.existsSync(fallbackLogPath)) {
      logPath = fallbackLogPath;
    } else if (!fs.existsSync(logPath)) {
      return NextResponse.json({ logs: "No logs found yet. Check if cron is running." });
    }

    const content = fs.readFileSync(logPath, "utf-8");
    // Get last 150 lines for better debugging context
    const lines = content.split("\n").slice(-150).join("\n");
    
    return NextResponse.json({ 
      logs: lines,
      location: logPath 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
