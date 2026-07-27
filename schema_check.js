const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env" });
async function main() {
  const uri = process.env.POS_DATABASE_URL;
  if (!uri) { console.error("No POS_DATABASE_URL"); return; }
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("Billgsoftware");
  
  const user = await db.collection("User").findOne({});
  const bill = await db.collection("Bill").findOne({});
  const item = await db.collection("Item").findOne({});
  const bp = await db.collection("BusinessProfile").findOne({});
  
  console.log("User:", JSON.stringify(user, null, 2));
  console.log("Bill:", JSON.stringify(bill, null, 2));
  console.log("Item:", JSON.stringify(item, null, 2));
  console.log("BusinessProfile:", JSON.stringify(bp, null, 2));
  
  await client.close();
}
main();
