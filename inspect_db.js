const { MongoClient } = require('mongodb');

const uri = "mongodb://Krishna:Radha%40987@ac-0r1awp8-shard-00-00.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-01.lprzjz2.mongodb.net:27017,ac-0r1awp8-shard-00-02.lprzjz2.mongodb.net:27017/Billgsoftware?ssl=true&replicaSet=atlas-oicdef-shard-0&authSource=admin&retryWrites=true&w=majority&appName=Billgsoftware";

async function run() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db("Billgsoftware");
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    // For each collection that sounds like 'User' or 'Shop' or 'Customer', get one document
    for (let c of collections) {
      if (['User', 'users', 'Shop', 'shops', 'Customer', 'customers', 'Restaurant', 'Store'].includes(c.name)) {
        console.log(`\nSample from ${c.name}:`);
        const sample = await db.collection(c.name).findOne({});
        console.log(sample);
      }
    }
  } finally {
    await client.close();
  }
}
run().catch(console.dir);
