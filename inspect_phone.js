const { MongoClient } = require('mongodb');

const uri = "mongodb://Krishna:Radha%40987@ac-0r1awp8-shard-00-00.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-01.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-02.lprzjz2.mongodb.net:27017/Billgsoftware?ssl=true&replicaSet=atlas-oicdef-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Billgsoftware";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("Billgsoftware");
    
    // Look for a user with a phone field
    const userWithPhone = await db.collection("User").findOne({ phone: { $exists: true } });
    console.log("User with 'phone':", userWithPhone);
    
    const userWithMobile = await db.collection("User").findOne({ mobile: { $exists: true } });
    console.log("User with 'mobile':", userWithMobile);
    
    const userWithPhoneNumber = await db.collection("User").findOne({ phoneNumber: { $exists: true } });
    console.log("User with 'phoneNumber':", userWithPhoneNumber);
    
    // Check if phone is in Clerk ID metadata or elsewhere, or maybe in another collection like BusinessProfile?
    const bProfiles = await db.collection("BusinessProfile").find({}).limit(1).toArray();
    console.log("BusinessProfile sample:", bProfiles);
    
    const shops = await db.collection("Shop").find({}).limit(1).toArray();
    console.log("Shop sample:", shops);
    
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
