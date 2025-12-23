# Google Sheets Integration Setup Guide

Follow these steps to generate the required credentials for syncing your LMS users to a Google Sheet.

## 1. Create a Google Cloud Project
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Click **Select a project** (top left) > **New Project**.
3.  Name it `LMS-Platform` and click **Create**.

## 2. Enable Google Sheets API
1.  In the search bar at the top, type `Google Sheets API`.
2.  Click on **Google Sheets API** from the marketplace results.
3.  Click **Enable**.

## 3. Create a Service Account
1.  Go to **APIs & Services** > **Credentials**.
2.  Click **Create Credentials** (top) > **Service Account**.
3.  **Name**: `lms-sheet-sync` (or similar).
4.  Click **Create and Continue**.
5.  **Role**: Select `Editor` (Basic > Editor).
6.  Click **Done**.

## 4. Generate Keys
1.  In the **Service Accounts** list, click on the email address of the account you just created (e.g., `lms-sheet-sync@lms-platform.iam.gserviceaccount.com`).
2.  Go to the **Keys** tab.
3.  Click **Add Key** > **Create new key**.
4.  Select **JSON** and click **Create**.
5.  A JSON file will automatically download. **Keep this safe!**

## 5. Get Your Sheet ID
1.  Create a new Google Sheet (or use an existing one).
2.  Look at the URL: `https://docs.google.com/spreadsheets/d/1aBcD.../edit`
3.  The ID is the long string between `/d/` and `/edit`.
    *   Example: `1aBcD_..._XyZ`

## 6. Share the Sheet
1.  Open your Google Sheet.
2.  Click **Share** (top right).
3.  **Copy the Service Account Email** from Step 4.1 (or from the downloaded JSON file).
4.  Paste it into the Share box and verify it has **Editor** access.
5.  Click **Send** (uncheck "Notify people" if you want).

## 7. Configure Backend
Open your `backend/.env` file (or add these to your Render Dashboard Environment Variables) and fill in the values:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-email@...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SHEET_ID=your_sheet_id
```

> **Note**: For `GOOGLE_PRIVATE_KEY`, if you are pasting into a `.env` file, make sure to keep the newlines as `\n` literal characters or wrap the whole key in quotes if passing it directly in a dashboard. The code is designed to handle `\n` replacements.
