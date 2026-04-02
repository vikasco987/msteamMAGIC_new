import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';
import { runBackup } from "@/lib/backup/mongodb-backup";

export const dynamic = "force-dynamic"; // Ensure no caching

export async function GET(req: NextRequest) {
  const MONGODB_URI = process.env.DATABASE_URL;
  if (!MONGODB_URI) return NextResponse.json({ error: "No DB URL" }, { status: 500 });

  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();

    // 1. UPDATE PULSE IMMEDIATELY
    // Backup shuru hone se pehle hi pulse update karenge taaki pata chale signal aaya hai
    await db.collection('CronHeartbeat').updateOne(
      { id: 'backup_check' },
      { 
        $set: { 
          lastRun: new Date(), 
          status: 'running',
          error: null 
        } 
      },
      { upsert: true }
    );

    console.log("Cron Signal Received at: " + new Date().toISOString());

    // 2. RUN BACKUP
    await runBackup();

    // 3. MARK SUCCESS
    await db.collection('CronHeartbeat').updateOne(
      { id: 'backup_check' },
      { $set: { status: 'success', lastSuccess: new Date() } }
    );

    await client.close();
    return NextResponse.json({ success: true, message: "Backup finished" });

  } catch (error: any) {
    console.error("CRON TRIGGER FATAL ERROR:", error);
    
    // 4. LOG THE REAL CAUSE TO DATABASE
    try {
      const db = client.db();
      await db.collection('CronHeartbeat').updateOne(
        { id: 'backup_check' },
        { 
          $set: { 
            status: 'failed', 
            error: error.message,
            failedAt: new Date() 
          } 
        }
      );
    } catch (e) {}
    
    if (client) await client.close();
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
