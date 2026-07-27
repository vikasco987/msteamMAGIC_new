const { MongoClient } = require('mongodb');

const uri = "mongodb://Krishna:Radha%40987@ac-0r1awp8-shard-00-00.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-01.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-02.lprzjz2.mongodb.net:27017/Billgsoftware?ssl=true&replicaSet=atlas-oicdef-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Billgsoftware";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("Billgsoftware");
    
    // Fetch 5 recent users
    const recentUsers = await db.collection("User").find({}).sort({ createdAt: -1 }).limit(5).toArray();
    console.log("Recent Users in DB:");
    recentUsers.forEach(u => {
      console.log(`ID: ${u._id}, Name: ${u.name}, Email: ${u.email}, Phone: ${u.phone}, Mobile: ${u.mobile}, ClerkId: ${u.clerkId}`);
    });

    // Also check BusinessProfile for these users
    for (const u of recentUsers) {
      if (u.clerkId) {
        const bp = await db.collection("BusinessProfile").findOne({ userId: u.clerkId });
        if (bp) {
          console.log(`\nFound BusinessProfile for ${u.name} (ClerkId: ${u.clerkId}):`);
          console.log(`ContactPersonPhone: ${bp.contactPersonPhone}`);
        } else {
          console.log(`\nNo BusinessProfile found for ${u.name} (ClerkId: ${u.clerkId})`);
        }
      }
    }

  } finally {
    await client.close();
  }
}
run().catch(console.dir);
