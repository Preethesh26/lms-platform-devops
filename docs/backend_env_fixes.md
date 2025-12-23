# Backend .env File - Fix Checklist

Based on your error logs, here's what needs to be fixed in `backend/.env`:

## ❌ Current Issues:

1. **Brevo API Key**: Still set to `your_brevo_api_key_here` (causing 401 errors)
2. **Google Private Key**: Format error (causing decoder error)
3. **Admin Email**: Not set (showing as undefined)

---

## ✅ Required Fixes:

### 1. Update Brevo API Key

Replace this line:
```bash
BREVO_API_KEY=your_brevo_api_key_here
```

With your **real** Brevo API key:
```bash
BREVO_API_KEY=xkeysib-abc123def456...your_actual_key
```

**Where to find it:**
- Go to https://app.brevo.com
- Settings → SMTP & API → API Keys
- Copy your API key

---

### 2. Add Admin Notification Email

Add this line (if missing):
```bash
ADMIN_NOTIFICATION_EMAIL=academypro.desk@gmail.com
```

---

### 3. Fix Google Private Key Format

The private key must be in **one line** with `\n` as literal text:

```bash
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASC...(very long)...==\n-----END PRIVATE KEY-----\n"
```

**Important:**
- Use **double quotes** `"`
- Keep everything on **one line**
- Use literal `\n` (backslash-n), not actual line breaks
- Copy directly from your JSON key file

**Example from JSON:**
```json
{
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQI...\n-----END PRIVATE KEY-----\n"
}
```
Copy the entire value including the quotes.

---

## 🔄 After Fixing:

1. **Save** the `backend/.env` file
2. **Restart** the backend server:
   ```bash
   # Press Ctrl+C in the terminal
   npm start
   ```
3. **Test** by creating a new user

---

## ✅ Success Indicators:

After restarting, you should see:
- ✅ `Welcome email sent to user@example.com` (no 401 error)
- ✅ `Admin notification sent to academypro.desk@gmail.com` (no 401 error)
- ✅ `Synced user user@example.com to Google Sheets.` (no decoder error)

---

## 🆘 Still Having Issues?

**Brevo 401 Error:**
- Double-check your API key is correct
- Make sure there are no extra spaces
- Verify the key is active in Brevo dashboard

**Google Sheets Decoder Error:**
- Make sure the private key is on ONE line
- Check that `\n` are literal (not actual newlines)
- Ensure double quotes wrap the entire key

**Admin Email Undefined:**
- Make sure the line exists in `.env`
- No typos in the variable name
- Restart the server after adding it
