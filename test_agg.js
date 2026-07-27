const { MongoClient } = require('mongodb');
const uri = "mongodb://Krishna:Radha%40987@ac-0r1awp8-shard-00-00.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-01.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-02.lprzjz2.mongodb.net:27017/Billgsoftware?ssl=true&replicaSet=atlas-oicdef-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Billgsoftware";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("Billgsoftware");
    const report = await db.collection("User").aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 10 }
    ]).toArray();
    console.log("Report:", report);
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
