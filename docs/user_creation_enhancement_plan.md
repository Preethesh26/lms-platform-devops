# User Creation Enhancements Plan

## Goal
1. Add `name` field to User model and registration flow.
2. Send a welcome email to the user containing their credentials (email, password, enrollment) when created by admin.

## Proposed Changes

### Backend
1.  **Modify User Model (`backend/models/User.js`)**
    -   Add `name` field (String, required).

2.  **Update Email Service (`backend/services/emailService.js`)**
    -   Add `sendWelcomeEmail` function.
    -   Template should include: Name, Email, Password (plain text), Enrollment Number, and Login Link.

3.  **Update Auth Controller (`backend/controllers/authController.js`)**
    -   Update `register` function to accept `name`.
    -   Call `sendWelcomeEmail` after successful user creation.

### Frontend
1.  **Update API (`src/lib/api.ts`)**
    -   Update `register` type definition to include `name`.

2.  **Update Admin Users Page (`src/pages/admin/Users.tsx`)**
    -   Add "Name" input field to "Add User" dialog.
    -   Add "Name" input field to "Edit User" dialog.
    -   Display "Name" in the users list card.

3.  **Update Store (`src/lib/store.ts`)**
    -   Update `User` type to include `name`.
    -   Update `addUser` function to pass `name`.

## Verification
-   Create a new user from Admin panel with a name.
-   Verify user is created in DB with name.
-   Verify welcome email is received with correct credentials.
