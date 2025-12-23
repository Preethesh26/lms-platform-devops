const { migrateAllUsers } = require('./services/googleSheetsService');

// Run the migration
console.log('Starting Google Sheets Migration...');

migrateAllUsers()
    .then(() => {
        console.log('Migration completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
