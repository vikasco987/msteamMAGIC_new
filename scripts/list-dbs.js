const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function listDbs() {
    const uri = process.env.DATABASE_URL;
    if (!uri) return console.log('No URI');
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const dbs = await client.db().admin().listDatabases();
        console.log('Databases:', dbs.databases.map(db => db.name));
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
listDbs();
