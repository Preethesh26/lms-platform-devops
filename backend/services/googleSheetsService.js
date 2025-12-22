const { google } = require('googleapis');

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

module.exports = {
    appendUserToSheet
};
