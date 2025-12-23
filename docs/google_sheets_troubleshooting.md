# Google Sheets Integration - Troubleshooting Guide

## Issue: Data Not Syncing to Google Sheets

### Quick Diagnosis Checklist

Run through this checklist to identify the problem:

#### ✅ Step 1: Verify Environment Variables

Check your `backend/.env` file has **real values** (not placeholders):

```bash
# ❌ WRONG - These are placeholders
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account-email@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=your_google_sheet_id_here

# ✅ CORRECT - Real values look like this
GOOGLE_SERVICE_ACCOUNT_EMAIL=lms-sheet-sync@lms-platform-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQE...(very long key)...==\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1aBcD3fGhIjKlMnOpQrStUvWxYz1234567890
```

#### ✅ Step 2: Get Your Credentials

If you haven't set up Google Cloud yet, follow the **[google_sheets_setup.md](file:///C:/Users/Asus/.gemini/antigravity/brain/858f772e-5c30-44d9-9fc6-a075a00298b4/google_sheets_setup.md)** guide.

**Quick Summary:**
1. Create a Google Cloud Project
2. Enable Google Sheets API
3. Create a Service Account
4. Download the JSON key file
5. Extract these values from the JSON:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_PRIVATE_KEY`
6. Get your Sheet ID from the URL

#### ✅ Step 3: Share Your Sheet

> **CRITICAL**: Your Google Sheet must be shared with the service account email!

1. Open your Google Sheet
2. Click **Share** (top right)
3. Add the service account email (e.g., `lms-sheet-sync@...`)
4. Give it **Editor** permissions
5. Click **Send**

#### ✅ Step 4: Restart Your Backend

After updating `.env`, you **must** restart the server:

```bash
# Stop the server (Ctrl+C)
# Then restart
npm start
```

#### ✅ Step 5: Test the Integration

Create a new user and check the backend logs:

**Expected Success Logs:**
```
Synced user john.doe@example.com to Google Sheets.
```

**Expected Warning (if credentials missing):**
```
Google Sheets: Missing service account credentials. Skipping sync.
```

**Expected Error (if sheet not shared):**
```
Google Sheets Sync Error: The caller does not have permission
```

---

## Common Issues & Solutions

### Issue 1: "Missing service account credentials"
**Cause**: Environment variables not set or still have placeholder values  
**Solution**: Update `.env` with real credentials and restart server

### Issue 2: "The caller does not have permission"
**Cause**: Sheet not shared with service account  
**Solution**: Share the sheet with the `client_email` from your JSON key

### Issue 3: "Invalid credentials"
**Cause**: Private key format is incorrect  
**Solution**: Make sure the private key includes `\n` for newlines and is wrapped in quotes

### Issue 4: Data syncs locally but not on Render
**Cause**: Environment variables not set on Render  
**Solution**: Add all 3 variables to Render Dashboard → Environment

---

## Testing Checklist

- [ ] Environment variables are set with **real values** (not placeholders)
- [ ] Google Sheet is **shared** with service account email
- [ ] Backend server has been **restarted** after updating `.env`
- [ ] Created a test user and checked backend logs
- [ ] Verified data appears in Google Sheet

---

## Need Help?

If you're still stuck, check the backend logs for specific error messages. The integration is designed to **fail silently** (won't block user registration), but it will log warnings/errors to help you debug.
