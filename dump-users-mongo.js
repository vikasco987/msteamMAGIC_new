const { MongoClient } = require('mongodb');
const url = "mongodb+srv://magicscale365:ribkSAF8KAYm5g6k@msteam.vpsckry.mongodb.net/clickup_clone?retryWrites=true&w=majority&appName=msteam";
const client = new MongoClient(url);

async function main() {
    await client.connect();
    const db = client.db('clickup_clone');
    const users = await db.collection('User').find({}).toArray();
    console.log(JSON.stringify(users, null, 2));
}

main().catch(console.error).finally(() => client.close());
