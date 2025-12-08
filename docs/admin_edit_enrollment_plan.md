# Admin Edit User Enrollments Plan

## Goal
Allow admins to manage (add/remove) enrolled courses for any user directly from the Admin Panel's "Edit User" dialog.

## User Review Required
> [!IMPORTANT]
> This will allow admins to bypass payment and manually enroll students in courses.

## Proposed Changes

### Backend
#### [MODIFY] [userController.js](file:///Users/apple/Desktop/Preethesh/lms-platform/backend/controllers/userController.js)
- The current implementation uses `findByIdAndUpdate(req.params.id, req.body)`.
- This is already sufficient to handle `enrolledCourses` updates if passed in the body.
- **Action:** Verify and potentially add specific validation or logging for enrollment changes if needed, but likely no code change required if `req.body` is passed directly.

### Frontend
#### [MODIFY] [Users.tsx](file:///Users/apple/Desktop/Preethesh/lms-platform/src/pages/admin/Users.tsx)
- **Fetch Courses:** The `Users` component needs access to the list of all courses. We can use `useStore()` to get `courses`.
- **UI Update:**
    - In the `EditUserDialog`, add a new section for "Enrollments".
    - Use a multi-select component or a list of checkboxes to show all available courses.
    - Pre-select the courses the user is currently enrolled in.
- **Handle Update:**
    - When saving, include the updated array of `enrolledCourses` (IDs) in the payload sent to `updateUser`.

## Verification Plan
### Manual Verification
1.  **Login as Admin.**
2.  **Go to Users Page.**
3.  **Edit a Student.**
4.  **Select/Deselect Courses:** Add a course they don't have, remove one they do.
5.  **Save.**
6.  **Verify:**
    - Check the "Enrolled Courses" count in the table updates.
    - Login as that student and verify access to the added/removed courses.
