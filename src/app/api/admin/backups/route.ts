import { NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

// We now fetch history directly from S3 to avoid using MongoDB storage for backup metadata.
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bucket = process.env.AWS_S3_BACKUP_BUCKET;
    if (!bucket) {
      console.warn("Cloud Backup: AWS_S3_BACKUP_BUCKET not found in env.");
      return NextResponse.json({ error: 'Cloud storage not configured' }, { status: 500 });
    }

    // List all backup archives from the S3 bucket's backups/ prefix
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'backups/',
    });

    const response = await s3Client.send(command);
    
    // Map S3 objects to the dashboard-compatible 'Backup' interface
    const backups = (response.Contents || [])
      .filter(item => item.Key && item.Key !== 'backups/' && (item.Key.endsWith('.gz') || item.Key.endsWith('.json.gz')))
      .map(item => {
        const fileName = item.Key!.replace('backups/', '');
        return {
          id: item.ETag?.replace(/"/g, '') || item.Key!,
          fileName: fileName,
          date: item.LastModified?.toISOString() || new Date().toISOString(),
          sizeMB: parseFloat(((item.Size || 0) / (1024 * 1024)).toFixed(2)),
          status: "success",
          s3Url: `https://${bucket}.s3.amazonaws.com/${item.Key}`,
          error: null
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(backups);
  } catch (error: any) {
    console.error('Cloud Backup History Error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync with cloud store', 
      details: error.message 
    }, { status: 500 });
  }
}

