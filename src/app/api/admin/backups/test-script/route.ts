import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs";

export async function POST() {
  try {
    const scriptPath = path.resolve(process.cwd(), "scripts/backup/run-cron-backup.sh");
    
    if (!fs.existsSync(scriptPath)) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Ensure it's executable
    try {
      fs.chmodSync(scriptPath, "755");
    } catch(e) {}

    return new Promise((resolve) => {
      exec(`bash ${scriptPath}`, (error, stdout, stderr) => {
        resolve(NextResponse.json({
          status: error ? "failed" : "success",
          stdout,
          stderr,
          error: error?.message
        }));
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
