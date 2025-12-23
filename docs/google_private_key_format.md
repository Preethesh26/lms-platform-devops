# Google Sheets Private Key - Correct .env Format

## ✅ CORRECT Format

The private key **MUST** be wrapped in **double quotes** and use `\n` for newlines:

```bash
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7...\n-----END PRIVATE KEY-----\n"
```

## 📋 Step-by-Step Instructions

### 1. Open Your JSON Key File
When you download the service account key from Google Cloud, you get a JSON file that looks like:

```json
{
  "type": "service_account",
  "project_id": "lms-platform-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...\n-----END PRIVATE KEY-----\n",
  "client_email": "lms-sheet-sync@lms-platform-123456.iam.gserviceaccount.com",
  ...
}
```

### 2. Copy the `private_key` Value
Copy the **entire value** of the `private_key` field, including:
- The opening `"`
- The `-----BEGIN PRIVATE KEY-----`
- All the `\n` characters (these are literal backslash-n, not actual newlines)
- The `-----END PRIVATE KEY-----`
- The closing `"`

### 3. Paste Into .env
Your `.env` file should look like:

```bash
# Google Sheets Integration
GOOGLE_SERVICE_ACCOUNT_EMAIL=lms-sheet-sync@lms-platform-123456.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7H8...(very long)...xyz==\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEET_ID=1aBcD3fGhIjKlMnOpQrStUvWxYz1234567890
```

## ❌ Common Mistakes

### Mistake 1: Using Single Quotes
```bash
# ❌ WRONG
GOOGLE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...'
```

### Mistake 2: Missing Quotes
```bash
# ❌ WRONG
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...
```

### Mistake 3: Actual Newlines Instead of \n
```bash
# ❌ WRONG
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQE...
-----END PRIVATE KEY-----"
```

### Mistake 4: Missing \n at the End
```bash
# ❌ WRONG
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...-----END PRIVATE KEY-----"
# ✅ CORRECT - Notice the \n before the closing quote
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...-----END PRIVATE KEY-----\n"
```

## 🔧 Quick Test

After updating your `.env`:

1. **Restart your backend server** (the changes won't take effect until you restart)
2. Create a test user
3. Check the backend console for:
   - ✅ Success: `Synced user test@example.com to Google Sheets.`
   - ⚠️ Warning: `Google Sheets: Missing service account credentials.`
   - ❌ Error: `Google Sheets Auth Error: ...`

## 💡 Pro Tip

The code automatically handles the `\n` conversion:
```javascript
private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n')
```

So you **must** use literal `\n` (backslash-n) in the `.env` file, not actual line breaks!
