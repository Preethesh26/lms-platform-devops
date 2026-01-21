const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '.env') });

/**
 * DATABASE MIGRATION SCRIPT
 * This script copies all data from the 'test' database to the 'LMS_DATA' database.
 */

async function migrate() {
    // 1. Setup the URIs
    // We assume the current MONGODB_URI in your .env might be pointing to LMS_DEVELOPMENT or test.
    // We will manually construct the source and target URIs from your base string.

    const baseUri = process.env.MONGODB_URI.split('.net/')[0] + '.net/';
    const options = process.env.MONGODB_URI.split('?')[1] || 'retryWrites=true&w=majority';

    const sourceDb = 'test';
    const targetDb = 'LMS_DATA';

    const sourceUri = `${baseUri}${sourceDb}?${options}`;
    const targetUri = `${baseUri}${targetDb}?${options}`;

    console.log(`🚀 Starting Migration...`);
    console.log(`📂 Source: ${sourceDb}`);
    console.log(`🎯 Target: ${targetDb}`);

    try {
        // Connect to Source
        const sourceConn = await mongoose.createConnection(sourceUri).asPromise();
        console.log('✅ Connected to Source Database');

        // Connect to Target
        const targetConn = await mongoose.createConnection(targetUri).asPromise();
        console.log('✅ Connected to Target Database');

        // Get all collections from source
        const collections = await sourceConn.db.listCollections().toArray();
        console.log(`📦 Found ${collections.length} collections to migrate.`);

        for (const colDef of collections) {
            const name = colDef.name;
            if (name.startsWith('system.')) continue;

            console.log(`🔄 Migrating collection: ${name}...`);

            const sourceCol = sourceConn.db.collection(name);
            const targetCol = targetConn.db.collection(name);

            // Fetch all documents
            const docs = await sourceCol.find({}).toArray();

            if (docs.length > 0) {
                // Clear target collection first
                await targetCol.deleteMany({});
                // Insert documents
                await targetCol.insertMany(docs);
                console.log(`   ✅ Migrated ${docs.length} documents.`);
            } else {
                console.log(`   ℹ️ Collection is empty, skipping.`);
            }
        }

        console.log('\n✨ MIGRATION COMPLETE! ✨');
        console.log(`Your data is now safely inside '${targetDb}'.`);
        console.log(`You can now update your Render settings and .env to use /${targetDb}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Migration Failed:', error);
        process.exit(1);
    }
}

migrate();
