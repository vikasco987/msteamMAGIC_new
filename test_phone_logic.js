const { MongoClient } = require('mongodb');
const uri = "mongodb://Krishna:Radha%40987@ac-0r1awp8-shard-00-00.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-01.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-02.lprzjz2.mongodb.net:27017/Billgsoftware?ssl=true&replicaSet=atlas-oicdef-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Billgsoftware";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("Billgsoftware");
    const recentUsersRaw = await db.collection("User").find({}).sort({ createdAt: -1 }).limit(10).toArray();
    
    const clerkIds = recentUsersRaw.map(u => u.clerkId).filter(Boolean);
    const businessProfiles = await db.collection("BusinessProfile").find({
      $or: [
        { userId: { $in: clerkIds } },
        { createdBy: { $in: clerkIds } }
      ]
    }).toArray();

    const phoneMap = new Map();
    businessProfiles.forEach(bp => {
      if (bp.contactPersonPhone) {
        if (bp.userId) phoneMap.set(bp.userId, bp.contactPersonPhone);
        if (bp.createdBy) phoneMap.set(bp.createdBy, bp.contactPersonPhone);
      }
    });

    recentUsersRaw.forEach(u => {
      const p = u.phone || phoneMap.get(u.clerkId) || "NO PHONE";
      console.log(`Name: ${u.name}, Phone: ${p}, ClerkId: ${u.clerkId}`);
    });
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
