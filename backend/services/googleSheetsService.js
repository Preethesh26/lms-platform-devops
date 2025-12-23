const { google } = require('googleapis');
const User = require('../models/User');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

const getAuthClient = async () => {
    // Check if credentials exist
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.warn('Google Sheets: Missing service account credentials. Skipping sync.');
        return null;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Handle newlines in env var
            },
            scopes: SCOPES,
        });

        return await auth.getClient();
    } catch (error) {
        console.error('Google Sheets Auth Error:', error);
        return null;
    }
};

// Add column headers to the sheet
const addHeaders = async () => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            console.warn('Google Sheets: Missing GOOGLE_SHEET_ID. Skipping headers.');
            return;
        }

        const authClient = await getAuthClient();
        if (!authClient) return;

        const sheets = google.sheets({ version: 'v4', auth: authClient });

        // Check if headers already exist
        const checkResponse = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A1:G1',
        });

        if (checkResponse.data.values && checkResponse.data.values.length > 0) {
            console.log('Headers already exist. Skipping...');
            return;
        }

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

        console.log('✅ Column headers added to Google Sheet');

    } catch (error) {
        console.error('Google Sheets Header Error:', error.message);
    }
};

const appendUserToSheet = async (user) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            console.warn('Google Sheets: Missing GOOGLE_SHEET_ID. Skipping sync.');
            return;
        }

        const authClient = await getAuthClient();
        if (!authClient) return;

        const sheets = google.sheets({ version: 'v4', auth: authClient });

        const values = [
            [
                user._id.toString(),
                user.name,
                user.email,
                user.enrollment || 'N/A',
                user.role,
                new Date(user.createdAt).toLocaleString(),
                'Active'
            ]
        ];

        const resource = {
            values,
        };

        // Append to the first sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:G', // Adjust range/sheet name as needed
            valueInputOption: 'USER_ENTERED',
            resource,
        });

        console.log(`Synced user ${user.email} to Google Sheets.`);

    } catch (error) {
        console.error('Google Sheets Sync Error:', error.message);
        // Don't throw, just log. We don't want to block registration if sheets fails.
    }
};

// Migrate all existing users to Google Sheets
const migrateAllUsers = async () => {
    try {
        console.log('🔄 Starting migration of existing users to Google Sheets...');

        // First, add headers
        await addHeaders();

        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            console.warn('Google Sheets: Missing GOOGLE_SHEET_ID. Skipping migration.');
            return;
        }

        const authClient = await getAuthClient();
        if (!authClient) return;

        // Get all users from MongoDB
        const users = await User.find({}).sort({ createdAt: 1 }); // Oldest first

        if (users.length === 0) {
            console.log('No users found to migrate.');
            return;
        }

        console.log(`Found ${users.length} users to migrate...`);

        // Prepare all user data
        const userRows = users.map(user => [
            user._id.toString(),
            user.name,
            user.email,
            user.enrollment || 'N/A',
            user.role,
            new Date(user.createdAt).toLocaleString(),
            'Active'
        ]);

        const sheets = google.sheets({ version: 'v4', auth: authClient });

        // Append all users at once
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: 'Sheet1!A:G',
            valueInputOption: 'USER_ENTERED',
            resource: {
                values: userRows,
            },
        });

        console.log(`✅ Successfully migrated ${users.length} users to Google Sheets!`);

    } catch (error) {
        console.error('Migration Error:', error.message);
    }
};

// Update user in Google Sheets
const updateUserInSheet = async (user) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            console.warn('Google Sheets: Missing GOOGLE_SHEET_ID. Skipping update.');
            return;
        }

        const authClient = await getAuthClient();
        if (!authClient) return;

        const sheets = google.sheets({ version: 'v4', auth: authClient });

        // Find the row with this user's ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A', // Get all user IDs in column A
        });

        const rows = response.data.values || [];
        const userId = user._id.toString();

        // Find the row index (add 1 because sheets are 1-indexed)
        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === userId) {
                rowIndex = i + 1;
                break;
            }
        }

        if (rowIndex === -1) {
            console.log(`User ${user.email} not found in sheet. Adding instead...`);
            await appendUserToSheet(user);
            return;
        }

        // Update the row
        const values = [[
            user._id.toString(),
            user.name,
            user.email,
            user.enrollment || 'N/A',
            user.role,
            new Date(user.createdAt).toLocaleString(),
            'Active'
        ]];

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `Sheet1!A${rowIndex}:G${rowIndex}`,
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        });

        console.log(`Updated user ${user.email} in Google Sheets.`);

    } catch (error) {
        console.error('Google Sheets Update Error:', error.message);
    }
};

// Delete user from Google Sheets
const deleteUserFromSheet = async (userId) => {
    try {
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            console.warn('Google Sheets: Missing GOOGLE_SHEET_ID. Skipping delete.');
            return;
        }

        const authClient = await getAuthClient();
        if (!authClient) return;

        const sheets = google.sheets({ version: 'v4', auth: authClient });

        // Find the row with this user's ID
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Sheet1!A:A',
        });

        const rows = response.data.values || [];

        // Find the row index
        let rowIndex = -1;
        for (let i = 0; i < rows.length; i++) {
            if (rows[i][0] === userId) {
                rowIndex = i;
                break;
            }
        }

        if (rowIndex === -1) {
            console.log(`User ID ${userId} not found in sheet.`);
            return;
        }

        // Delete the row using batchUpdate
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: {
                requests: [{
                    deleteDimension: {
                        range: {
                            sheetId: 0, // First sheet
                            dimension: 'ROWS',
                            startIndex: rowIndex,
                            endIndex: rowIndex + 1
                        }
                    }
                }]
            }
        });

        console.log(`Deleted user ${userId} from Google Sheets.`);

    } catch (error) {
        console.error('Google Sheets Delete Error:', error.message);
    }
};

module.exports = {
    appendUserToSheet,
    migrateAllUsers,
    addHeaders,
    updateUserInSheet,
    deleteUserFromSheet
};
