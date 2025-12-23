// Load environment variables
require('dotenv').config();

const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const getAuthClient = async () => {
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.error('Missing Google Sheets credentials');
        return null;
    }

    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        },
        scopes: SCOPES,
    });

    return await auth.getClient();
};

const resetSheet = async () => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            console.error('Missing GOOGLE_SHEET_ID');
            return;
        }

        const authClient = await getAuthClient();
        if (!authClient) return;

        const sheets = google.sheets({ version: 'v4', auth: authClient });

        console.log('🔄 Clearing all data from sheet...');

        // Clear all data from the sheet
        await sheets.spreadsheets.values.clear({
            spreadsheetId,
            range: 'Sheet1!A:Z',
        });

        console.log('✅ Sheet cleared');

        console.log('📝 Adding column headers...');

        // Add headers
        const headers = [
            ['User ID', 'Name', 'Email', 'Enrollment ID', 'Role', 'Registration Date', 'Status']
        ];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: 'Sheet1!A1:G1',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: headers,
            },
        });

        console.log('✅ Headers added successfully!');
        console.log('\n📊 Your Google Sheet is now ready with clean headers.');
        console.log('💡 New users will automatically sync when created.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
};

// Run the reset
console.log('🔄 Starting Google Sheet Reset...\n');
resetSheet()
    .then(() => {
        console.log('\n✅ Reset completed successfully!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Reset failed:', error);
        process.exit(1);
    });
