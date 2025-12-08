# Delete Confirmation & Edit Notification Plan

## Goal
1. Add email confirmation dialog before deleting users
2. Send email notifications when user profiles are edited

## Proposed Changes

### Frontend (`src/pages/admin/Users.tsx`)

#### 1. Delete Confirmation Dialog
- Add state for delete confirmation dialog
- Show dialog when "Delete User" is clicked
- Require user to type the email address to confirm
- Only proceed with deletion if email matches

#### 2. Edit Notification
- After successful user update, trigger email notification
- Show success message mentioning email was sent

### Backend

#### 1. Email Service (`backend/services/emailService.js`)
Add new function:
```javascript
async function sendProfileUpdateEmail(userEmail, userName, changes) {
  // Send email notifying user their profile was updated
  // Include what changed (email, role, password reset, etc.)
}
```

#### 2. User Controller (`backend/controllers/authController.js`)
- In the update user endpoint, call `sendProfileUpdateEmail` after successful update
- Non-blocking (wrapped in try-catch)

## Implementation Steps

1. Add delete confirmation dialog to frontend
2. Add email input validation for delete confirmation
3. Create `sendProfileUpdateEmail` function in email service
4. Update user update endpoint to send notification email
5. Test both features

## Verification
- Test delete confirmation with correct/incorrect email
- Test edit notification email delivery
- Verify emails are non-blocking
