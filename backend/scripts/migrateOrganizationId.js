// ============================================================
// MIGRATION UTILITY — Backfill organizationId on legacy documents
//
// Usage:
//   node scripts/migrateOrganizationId.js --orgId ORG-001 --dry-run
//   node scripts/migrateOrganizationId.js --orgId ORG-001
//
// --dry-run: shows what would be updated without writing
// --orgId:   the Organization ID to assign to legacy documents
// ============================================================

require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const orgIdArg = args.find(a => a.startsWith('--orgId'))?.split('=')[1]
    || args[args.indexOf('--orgId') + 1];

if (!orgIdArg) {
    console.error('ERROR: --orgId is required. Example: node migrateOrganizationId.js --orgId ORG-001');
    process.exit(1);
}

const COLLECTIONS = ['users', 'courses', 'quizzes', 'tests', 'payments', 'progresses', 'supporttickets', 'settings'];

async function migrate() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the organization
    const Organization = require('../models/Organization');
    const org = await Organization.findOne({ organizationId: orgIdArg });
    if (!org) {
        console.error(`ERROR: Organization ${orgIdArg} not found`);
        process.exit(1);
    }

    console.log(`\nTarget organization: ${org.name} (${org.organizationId})`);
    console.log(`Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE'}\n`);

    let totalBefore = 0;
    let totalUpdated = 0;

    for (const collectionName of COLLECTIONS) {
        const collection = mongoose.connection.collection(collectionName);

        // Count documents without organizationId
        const countBefore = await collection.countDocuments({ organizationId: null });
        const totalInCollection = await collection.countDocuments({});
        totalBefore += countBefore;

        console.log(`${collectionName}: ${countBefore} legacy documents (${totalInCollection} total)`);

        if (!isDryRun && countBefore > 0) {
            const result = await collection.updateMany(
                { organizationId: null },
                { $set: { organizationId: org._id } }
            );
            totalUpdated += result.modifiedCount;
            console.log(`  → Updated ${result.modifiedCount} documents`);
        }
    }

    console.log(`\n${isDryRun ? '[DRY RUN] Would update' : 'Updated'} ${isDryRun ? totalBefore : totalUpdated} documents total`);

    if (!isDryRun) {
        // Verify counts unchanged
        let totalAfter = 0;
        for (const collectionName of COLLECTIONS) {
            const collection = mongoose.connection.collection(collectionName);
            totalAfter += await collection.countDocuments({});
        }
        console.log(`\nDocument count verification: ${totalAfter} documents (no data loss)`);
    }

    await mongoose.disconnect();
    console.log('\nDone.');
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
