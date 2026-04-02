const path = require('path');
const fs = require('fs');
const envPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
}
const { exec } = require('child_process');
const zlib = require('zlib');
const readline = require('readline');
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require("@aws-sdk/client-s3");
const { MongoClient, BSON } = require('mongodb');
const { EJSON } = BSON;

// Configuration
const MONGODB_URI = process.env.DATABASE_URL;
const S3_BUCKET_NAME = process.env.AWS_S3_BACKUP_BUCKET;
const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
const RESTORE_DIR = process.env.NODE_ENV === 'production' ? '/tmp/temp-restore' : path.join(__dirname, 'temp-restore');

// Initialize S3 Client
const s3Client = new S3Client({
    region: AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

async function runRestore() {
    console.log('🔄 Starting Kravy POS Database Restore Process...');

    if (!MONGODB_URI) {
        console.error('❌ Error: DATABASE_URL is not defined in .env');
        process.exit(1);
    }

    // 1. List backups from S3
    console.log('🔍 Fetching available backups from S3...');
    try {
        const listCommand = new ListObjectsV2Command({
            Bucket: S3_BUCKET_NAME,
            Prefix: 'backups/',
        });

        const response = await s3Client.send(listCommand);
        
        if (!response.Contents || response.Contents.length === 0) {
            console.log('⚠️ No backups found in the bucket.');
            return;
        }

        // Sort by last modified (latest first)
        const backups = response.Contents.sort((a, b) => b.LastModified - a.LastModified);
        const latestBackup = backups[0];

        console.log(`📦 Latest backup found: ${latestBackup.Key} (Modified: ${latestBackup.LastModified})`);

        // 2. Download the backup
        if (!fs.existsSync(RESTORE_DIR)) {
            fs.mkdirSync(RESTORE_DIR, { recursive: true });
        }

        const filename = path.basename(latestBackup.Key);
        const localFilePath = path.join(RESTORE_DIR, filename);

        console.log(`📡 Downloading ${filename}...`);
        
        const getCommand = new GetObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: latestBackup.Key,
        });

        const { Body } = await s3Client.send(getCommand);
        const writer = fs.createWriteStream(localFilePath);
        
        await new Promise((resolve, reject) => {
            Body.pipe(writer);
            Body.on('error', reject);
            writer.on('finish', () => resolve());
        });

        console.log('✅ Download complete.');

        // 3. Run restore based on file format
        console.log('🛡️ Restoring database (This will overwrite existing data)...');

        if (filename.endsWith('.json.gz')) {
            console.log("Reading pure-JS archive (.json.gz)...");
            const client = new MongoClient(MONGODB_URI);
            try {
                await client.connect();
                const db = client.db();

                // Drop all existing collections safely
                const collections = await db.listCollections().toArray();
                for (const col of collections) {
                    if (col.name.startsWith('system.')) continue;
                    await db.dropCollection(col.name);
                }

                const readStream = fs.createReadStream(localFilePath).pipe(zlib.createGunzip());
                const rl = readline.createInterface({ input: readStream });

                let currentCollection = null;
                let currentBatch = [];
                
                for await (const line of rl) {
                    if (!line.trim()) continue;
                    const parsed = EJSON.parse(line);
                    const colName = parsed.__collection__;
                    
                    if (currentCollection !== colName) {
                        if (currentCollection && currentBatch.length > 0) {
                            try { await db.collection(currentCollection).insertMany(currentBatch, { ordered: false }); } catch(e){}
                            currentBatch = [];
                        }
                        console.log(`   - Restoring collection: ${colName}...`);
                        currentCollection = colName;
                    }
                    
                    currentBatch.push(parsed.doc);
                    if (currentBatch.length >= 2000) {
                        try { await db.collection(currentCollection).insertMany(currentBatch, { ordered: false }); } catch(e){}
                        currentBatch = [];
                    }
                }
                
                if (currentCollection && currentBatch.length > 0) {
                    try { await db.collection(currentCollection).insertMany(currentBatch, { ordered: false }); } catch(e){}
                }

                console.log('✨ Pure-JS Database Restore successfully!');
            } finally {
                await client.close();
            }
        } else {
            console.log("Reading legacy archive (.gz) via mongorestore...");
            // Try to find mongorestore if not in PATH
            let restoreBin = 'mongorestore';
            const commonPaths = ['/usr/bin/mongorestore', '/usr/local/bin/mongorestore', '/opt/homebrew/bin/mongorestore'];
            for (const p of commonPaths) {
                if (fs.existsSync(p)) {
                    restoreBin = p;
                    break;
                }
            }

            // Using --drop to clear existing collections before restore
            const restoreCommand = `${restoreBin} --uri="${MONGODB_URI}" --archive="${localFilePath}" --gzip --drop`;

            await new Promise((resolve, reject) => {
                exec(restoreCommand, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ mongorestore error: ${error.message}`);
                        reject(error);
                        return;
                    }
                    console.log('✨ Database restored via mongorestore successfully!');
                    resolve();
                });
            });
        }
        
        // 4. Cleanup
        if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        console.log('🧹 Local temporary file cleaned up.');
        console.log('🏁 Restore process completed.');

    } catch (err) {
        console.error('❌ Error during restore process:', err);
        process.exit(1);
    }
}

runRestore();
