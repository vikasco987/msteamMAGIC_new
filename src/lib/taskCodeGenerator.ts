import { MongoClient } from "mongodb";

let cachedClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (cachedClient) return cachedClient;
  const uri = process.env.DATABASE_URL;
  if (!uri) throw new Error("DATABASE_URL is not defined in environment");
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

/**
 * Returns the next unique task code (e.g. "T101", "T102", ...)
 * Uses an atomic $inc on the 'Counter' collection in MongoDB to ensure concurrency safety.
 */
export async function getNextTaskCode(): Promise<string> {
  const client = await getMongoClient();
  const db = client.db();

  // If counter does not exist yet (brand new database), initialize seq at 101
  const existing = await db.collection("Counter").findOne({ _id: "taskCode" as any });
  if (!existing) {
    await db.collection("Counter").updateOne(
      { _id: "taskCode" as any },
      { $setOnInsert: { seq: 100 } },
      { upsert: true }
    );
  }

  const res = await db.collection("Counter").findOneAndUpdate(
    { _id: "taskCode" as any },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  const seq = res?.seq ?? (res as any)?.value?.seq ?? 101;
  return `T${seq}`;
}

/**
 * Reserves a contiguous block of unique task codes for bulk or multi-assignment creation.
 * Returns an array of task codes, e.g. ["T101", "T102", "T103"].
 */
export async function getNextTaskCodes(count: number): Promise<string[]> {
  if (count <= 0) return [];
  if (count === 1) {
    const singleCode = await getNextTaskCode();
    return [singleCode];
  }

  const client = await getMongoClient();
  const db = client.db();

  // Atomically increment counter by `count`
  const res = await db.collection("Counter").findOneAndUpdate(
    { _id: "taskCode" as any },
    { $inc: { seq: count } },
    { upsert: true, returnDocument: "after" }
  );

  const finalSeq = res?.seq ?? (res as any)?.value?.seq ?? (100 + count);
  const startSeq = finalSeq - count + 1;

  const codes: string[] = [];
  for (let i = startSeq; i <= finalSeq; i++) {
    codes.push(`T${i}`);
  }
  return codes;
}
