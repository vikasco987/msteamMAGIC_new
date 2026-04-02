import { NextRequest, NextResponse } from "next/server";
import { MongoClient } from 'mongodb';

export async function GET() {
  try {
    const client = new MongoClient(process.env.DATABASE_URL!);
    await client.connect();
    const db = client.db();
    
    const heartbeat = await db.collection('CronHeartbeat').findOne({ id: 'backup_check' });
    
    await client.close();
    
    return NextResponse.json({ 
      lastRun: heartbeat?.lastRun || null,
      status: heartbeat?.status || 'inactive'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
