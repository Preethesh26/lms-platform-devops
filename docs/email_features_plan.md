# Email Features Implementation Plan

## Overview
Implementing forgot password and contact admin features using Resend email service.

## Features

### 1. Forgot Password
**User Flow:**
1. User clicks "Forgot Password?" on login page
2. Enters email address
3. Receives email with password reset link
4. Clicks link → redirected to reset password page
5. Enters new password → password updated

**Backend:**
- Generate password reset token (JWT with 15min expiry)
- Email endpoint: `POST /api/auth/forgot-password`
- Reset endpoint: `POST /api/auth/reset-password/:token`
- Send email via Resend

**Frontend:**
- Add "Forgot Password?" link on `/login`
- Create forgot password dialog
- Create password reset page `/reset-password/:token`

### 2. Contact Admin
**User Flow:**
1. User clicks "Contact Admin" button
2. Form shows: Name (pre-filled), Email (pre-filled), Message
3. Submits → email sent to admin
4. Success confirmation shown

**Backend:**
- Fetch admin email from database (role='admin')
- Email endpoint: `POST /api/support/contact-admin`
- Send email from user's email to admin's email

**Frontend:**
- Add "Contact Admin" button in user layout
- Create contact form dialog
- Show success/error messages

## Environment Variables

Add to `backend/.env`:
```
RESEND_API_KEY=re_Z7h6Xx1F_Eznb2pZDfkzx9GyPsFM64UGU
FRONTEND_URL=http://localhost:5173
```

## Implementation Order

1. ✅ Install Resend package
2. Add environment variables
3. Create email utility service
4. Implement forgot password backend
5. Implement contact admin backend
6. Create forgot password UI
7. Create contact admin UI
8. Test and deploy
