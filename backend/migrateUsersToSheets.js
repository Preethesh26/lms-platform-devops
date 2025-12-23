// Load environment variables
require('dotenv').config();

const mongoose = require('mongoose');
const { migrateAllUsers } = require('./services/googleSheetsService');

// Run the migration
console.log('Starting Google Sheets Migration...');

// Connect to MongoDB first
mongoose.connect(process.env.MONGODB_URI)
    .then(() => {
        console.log('✅ Connected to MongoDB');
        return migrateAllUsers();
    })
    .then(() => {
        console.log('✅ Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
