const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env" });
async function main() {
  const uri = process.env.POS_DATABASE_URL;
  if (!uri) { console.error("No POS_DATABASE_URL"); return; }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("Billgsoftware");
  const collections = await db.listCollections().toArray();
  console.log(collections.map(c => c.name));
  await client.close();
}
main();
