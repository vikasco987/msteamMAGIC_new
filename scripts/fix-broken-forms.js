require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');

async function fixBrokenForms() {
    const uri = process.env.DATABASE_URL;
    if (!uri) {
        console.error('DATABASE_URL is missing');
        return;
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection('DynamicForm');

        // Find forms where title or createdBy is missing or null
        const brokenForms = await collection.find({
            $or: [
                { title: null },
                { title: { $exists: false } },
                { createdBy: null },
                { createdBy: { $exists: false } },
                { isPublished: null },
                { isPublished: { $exists: false } }
            ]
        }).toArray();

        console.log(`🔍 Found ${brokenForms.length} broken forms with missing required fields.`);

        for (const form of brokenForms) {
            const updates = {};
            
            if (!form.title) {
                updates.title = `Untitled Form (${form._id})`;
            }
            
            if (!form.createdBy) {
                // Assign to a system placeholder if creator is unknown
                updates.createdBy = "system_restored";
                updates.createdByName = "System Restored";
            }
            
            if (form.isPublished === null || form.isPublished === undefined) {
                updates.isPublished = false;
            }

            if (Object.keys(updates).length > 0) {
                await collection.updateOne(
                    { _id: form._id },
                    { $set: updates }
                );
                console.log(`✅ Fixed form ${form._id}: Applied ${Object.keys(updates).join(', ')}`);
            }
        }

        console.log('🏁 Data cleanup complete!');
    } catch (err) {
        console.error('❌ Error during cleanup:', err);
    } finally {
        await client.close();
    }
}

fixBrokenForms();
