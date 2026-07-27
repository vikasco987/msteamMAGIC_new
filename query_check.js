const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config({ path: ".env" });
async function main() {
  const uri = process.env.POS_DATABASE_URL;
  if (!uri) return;
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("Billgsoftware");
  
  const user = await db.collection("User").findOne({ email: "bheemsen3150@gmail.com" });
  if (!user) { console.log("User not found"); return; }
  
  const userIdStr = user._id.toString();
  const clerkId = user.clerkId;
  
  console.log("userIdStr:", userIdStr);
  console.log("clerkId:", clerkId);
  
  const billsCountByUserId = await db.collection("Bill").countDocuments({ userId: userIdStr });
  const billsCountByClerkId = await db.collection("Bill").countDocuments({ clerkId: clerkId });
  const itemsCountByUserId = await db.collection("Item").countDocuments({ userId: userIdStr });
  const itemsCountByClerkId = await db.collection("Item").countDocuments({ clerkId: clerkId });
  
  console.log("billsCountByUserId:", billsCountByUserId);
  console.log("billsCountByClerkId:", billsCountByClerkId);
  console.log("itemsCountByUserId:", itemsCountByUserId);
  console.log("itemsCountByClerkId:", itemsCountByClerkId);
  
  await client.close();
}
main();
