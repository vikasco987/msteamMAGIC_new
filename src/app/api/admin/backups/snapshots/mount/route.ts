import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import zlib from "zlib";
import readline from "readline";
import { promisify } from "util";
import { MongoClient, BSON } from "mongodb";

const execPromise = promisify(exec);
const { EJSON } = BSON;

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function POST(req: NextRequest) {
  try {
    const { fileName } = await req.json();
    const MONGODB_URI = process.env.DATABASE_URL;
    const S3_BUCKET = process.env.AWS_S3_BACKUP_BUCKET;

    if (!MONGODB_URI || !S3_BUCKET || !fileName) {
      return NextResponse.json({ error: "Missing configuration or filename" }, { status: 400 });
    }

    // 1. Create a unique Temp DB Name
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
    const tempDbName = `snap_${sanitizedName}`;

    // 2. Local paths
    const tempDir = process.env.NODE_ENV === "production" ? "/tmp/temp-mounts" : path.join(process.cwd(), "tmp-mounts");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    const localFilePath = path.join(tempDir, fileName);

    console.log(`📡 Mounting snapshot: ${fileName} as ${tempDbName}`);

    // 3. Download from S3
    const getCommand = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: `backups/${fileName}`,
    });

    const response = await s3Client.send(getCommand);
    const stream = response.Body as any;
    const fileWriter = fs.createWriteStream(localFilePath);
    
    await new Promise((resolve, reject) => {
      stream.pipe(fileWriter);
      stream.on("error", reject);
      fileWriter.on("finish", () => resolve(true));
    });

    console.log("✅ Downloaded. Now restoring to ghost database...");

    // 4. Restore Logic based on file type
    if (fileName.endsWith('.json.gz')) {
        // Pure JS restore for new backups
        console.log("Reading pure-JS archive (.json.gz)...");
        const client = new MongoClient(MONGODB_URI);
        try {
            await client.connect();
            const tempDb = client.db(tempDbName);

            // Clean the db in case of re-mount
            const collections = await tempDb.listCollections().toArray();
            for (const col of collections) {
                await tempDb.dropCollection(col.name);
            }

            const readStream = fs.createReadStream(localFilePath).pipe(zlib.createGunzip());
            const rl = readline.createInterface({ input: readStream });

            let currentCollection = null;
            let currentBatch: any[] = [];
            
            for await (const line of rl) {
                if (!line.trim()) continue;
                const parsed = EJSON.parse(line);
                const colName = parsed.__collection__;
                
                if (currentCollection !== colName) {
                    if (currentCollection && currentBatch.length > 0) {
                        try { await tempDb.collection(currentCollection).insertMany(currentBatch, { ordered: false }); } catch(e){}
                        currentBatch = [];
                    }
                    currentCollection = colName;
                }
                
                currentBatch.push(parsed.doc);
                if (currentBatch.length >= 2000) {
                    try { await tempDb.collection(currentCollection).insertMany(currentBatch, { ordered: false }); } catch(e){}
                    currentBatch = [];
                }
            }
            if (currentCollection && currentBatch.length > 0) {
                try { await tempDb.collection(currentCollection).insertMany(currentBatch, { ordered: false }); } catch(e){}
            }

            console.log("✅ Pure-JS Restore successful!");
        } finally {
            await client.close();
        }

    } else {
        // Legacy mongorestore
        console.log("Reading legacy archive (.gz) via mongorestore...");
        const urlParts = MONGODB_URI.split("/");
        const originalDbName = urlParts[3]?.split("?")[0] || "clickup_clone";

        let restoreCmd = null;
        const commonPaths = ["/usr/bin/mongorestore", "/usr/local/bin/mongorestore", "/opt/homebrew/bin/mongorestore", "mongorestore"];
        for (const p of commonPaths) {
            try {
                // If it's just 'mongorestore', execSync will find it in PATH or throw
                if (p === 'mongorestore') {
                   require('child_process').execSync('which mongorestore', { stdio: 'ignore' });
                   restoreCmd = p;
                   break;
                }
                if (fs.existsSync(p)) {
                    restoreCmd = p;
                    break;
                }
            } catch(e) {}
        }

        if (!restoreCmd) {
            throw new Error(`This server does not have 'mongorestore' installed. Legacy backups (.gz) cannot be mounted here. Please download it and restore locally, or use the new Backup system (.json.gz) which works perfectly here.`);
        }

        const command = `${restoreCmd} --uri="${MONGODB_URI}" --archive="${localFilePath}" --gzip --nsInclude="${originalDbName}.*" --nsFrom="${originalDbName}.*" --nsTo="${tempDbName}.*" --drop`;
        
        try {
            await execPromise(command);
        } catch (execError: any) {
            throw new Error(`mongorestore failed: ${execError.message}`);
        }
    }

    // 5. Cleanup local file
    try { fs.unlinkSync(localFilePath); } catch(e){}

    console.log(`🏁 Snapshot mounted successfully. DB: ${tempDbName}`);
    return NextResponse.json({ success: true, tempDbName });

  } catch (error: any) {
    console.error("Mount error:", error);
    return NextResponse.json({ error: "Mounting failed", details: error.message }, { status: 500 });
  }
}
