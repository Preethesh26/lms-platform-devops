# Google Sheets Migration Guide

## What I Created:

1. **Enhanced `googleSheetsService.js`** - Now includes:
   - `addHeaders()` - Adds column headers to the sheet
   - `migrateAllUsers()` - Syncs all existing users from MongoDB to Google Sheets

2. **Migration Script: `migrateUsersToSheets.js`** - A one-time script to:
   - Add column headers (if not already present)
   - Sync all existing users to the sheet

---

## How to Run the Migration:

### Step 1: Stop Your Backend Server
Press `Ctrl+C` in the terminal running `npm start`

### Step 2: Run the Migration Script
```bash
cd backend
node migrateUsersToSheets.js
```

### Step 3: Check the Output
You should see:
```
Starting Google Sheets Migration...
🔄 Starting migration of existing users to Google Sheets...
✅ Column headers added to Google Sheet
Found X users to migrate...
✅ Successfully migrated X users to Google Sheets!
Migration completed successfully!
```

### Step 4: Restart Your Backend
```bash
npm start
```

---

## What Gets Added to Your Sheet:

### Column Headers (Row 1):
| User ID | Name | Email | Enrollment ID | Role | Registration Date | Status |
|---------|------|-------|---------------|------|-------------------|--------|

### Existing Users (Row 2+):
All your existing users will be added below the headers, sorted by registration date (oldest first).

---

## After Migration:

✅ **Headers** are added (only once)  
✅ **Existing users** are synced  
✅ **New users** will continue to sync automatically when created

---

## Troubleshooting:

**"Headers already exist. Skipping..."**
- This is normal if you run the script multiple times
- It won't duplicate headers

**"No users found to migrate."**
- Your database is empty
- Create some users first

**Migration errors?**
- Check that your `.env` has correct Google credentials
- Make sure the sheet is shared with the service account email
- Verify the `GOOGLE_SHEET_ID` is correct
