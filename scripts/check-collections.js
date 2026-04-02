const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function checkCollections() {
    const uri = process.env.DATABASE_URL;
    if (!uri) return console.log('No URI');
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db();
        const collections = await db.listCollections().toArray();
        console.log(`Found ${collections.length} collections:`, collections.map(c => c.name));
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
checkCollections();
