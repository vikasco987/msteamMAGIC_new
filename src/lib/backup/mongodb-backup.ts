import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { MongoClient, BSON } from 'mongodb';

const { EJSON } = BSON;

export async function runBackup() {
    console.log('🚀 Starting Kravy POS Serverless-Safe Backup...');

    const MONGODB_URI = process.env.DATABASE_URL;
    const S3_BUCKET_NAME = process.env.AWS_S3_BACKUP_BUCKET;
    const AWS_REGION = process.env.AWS_REGION || 'ap-south-1';
    
    // In serverless, we MUST use /tmp
    const BACKUP_DIR = '/tmp/temp-backups';

    if (!MONGODB_URI) {
        throw new Error('DATABASE_URL is not defined');
    }

    if (!S3_BUCKET_NAME) {
        throw new Error('AWS_S3_BACKUP_BUCKET is not defined');
    }

    // Initialize S3 Client
    const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
    });

    // 1. Create local temp directory
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    // 2. Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `kravy-pos-backup-${timestamp}.json.gz`;
    const localFilePath = path.join(BACKUP_DIR, filename);

    console.log(`📦 Generating backup: ${filename}...`);

    let client: MongoClient | null = null;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db();

        // 3. Create GZIP stream
        const fileWriter = fs.createWriteStream(localFilePath);
        const gzip = zlib.createGzip();
        gzip.pipe(fileWriter);

        // 4. Fetch all collections and dump as NDJSON
        const collections = await db.listCollections().toArray();
        for (const colInfo of collections) {
            if (colInfo.name.startsWith('system.')) continue;
            
            console.log(`   - Dumping collection: ${colInfo.name}...`);
            const col = db.collection(colInfo.name);
            const cursor = col.find({});
            
            for await (const doc of cursor) {
                const line = { __collection__: colInfo.name, doc: doc };
                gzip.write(EJSON.stringify(line) + '\n');
            }
        }

        // Close stream cleanly
        await new Promise<void>((resolve, reject) => {
            fileWriter.on('finish', () => resolve());
            fileWriter.on('error', (err) => reject(err));
            gzip.end();
        });

        console.log('✅ Local JSON archive created successfully.');
        console.log(`📤 Uploading to S3 bucket: ${S3_BUCKET_NAME}...`);

        // 5. Upload to S3
        const fileStream = fs.createReadStream(localFilePath);
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: S3_BUCKET_NAME,
                Key: `backups/${filename}`,
                Body: fileStream,
            },
        });

        await upload.done();
        console.log(`✨ Backup uploaded successfully to cloud: ${filename}`);

        // SUCCESS: No longer storing metadata in MongoDB to save space. 
        // Dashboard now lists objects directly from S3.
        console.log('✨ Backup recorded successfully on Cloud storage (S3).');

        // 7. Cleanup local file
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        console.log('🧹 Local temporary file cleaned up.');
        console.log('🏁 Backup process completed successfully!');

    } catch (error: any) {
        console.error(`❌ Backup Process Error: ${error.message}`);
        // FAIL: No longer storing failure logs in MongoDB collection.
        console.error('❌ Cloud upload failed. Check S3 permissions and logs.');
        throw error;
    } finally {
        if (client) await client.close();
    }
}

// CLI handler for local development (npm run db:backup)
if (require.main === module) {
    runBackup().catch(err => {
        console.error(err);
        process.exit(1);
    });
}
