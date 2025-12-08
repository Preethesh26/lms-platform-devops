# User Details View Enhancement Plan

## Goal
Add a detailed view dialog that opens when clicking on a user card, showing all user information with both read-only display and edit capabilities.

## Current State
- User cards show: Name, Email, Role, Enrollment Number
- Edit button opens a separate edit dialog
- No way to view all user details at once

## Proposed Changes

### Frontend (`src/pages/admin/Users.tsx`)

#### 1. New User Details Dialog
- **Trigger:** Click anywhere on the user card (not just Edit button)
- **Layout:** Tabbed interface with two tabs:
  - **"Details" Tab (Read-only):**
    - Name
    - Email
    - Role (Student/Admin)
    - Enrollment Number
    - Account Created Date
    - Enrolled Courses (list with course names)
    - Total Courses Enrolled
  - **"Edit" Tab:**
    - Same fields as current edit dialog
    - Name (editable)
    - Email (editable)
    - Role (dropdown)
    - Enrollment Number (editable for students)
    - Password (optional reset)

#### 2. UI Improvements
- Make entire user card clickable (not just Edit button)
- Add "View Details" icon/indicator on hover
- Keep separate Delete button outside the card click area
- Use Tabs component from shadcn/ui

### Backend (No Changes Needed)
- Existing APIs already return all necessary data
- User model includes `createdAt` field
- Enrolled courses are already populated

## Implementation Steps

1. Add state for selected user details view
2. Create new `UserDetailsDialog` component with tabs
3. Update user card click handler
4. Implement Details tab (read-only)
5. Move existing edit form to Edit tab
6. Style and polish the UI

## Verification
- Click on user card opens details dialog
- Details tab shows all user information
- Edit tab allows editing user data
- Delete button still works independently
- Dialog closes properly
