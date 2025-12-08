# LMS Platform Implementation Plan

## Goal Description
Create a modern, premium-looking Learning Management System (LMS) with separate panels for Admins and Users (Students). The platform will be built using Next.js and Tailwind CSS.

## User Review Required
- **Design Preference**: Confirming "Premium" aesthetic with modern typography and vibrant/glassmorphism effects.
- **Tech Stack**: Next.js (App Router), Tailwind CSS.

## Proposed Changes

### Project Initialization
#### [NEW] [lms-platform]
- Initialize Next.js app.
- Configure Tailwind CSS.
- Install necessary dependencies (lucide-react for icons, clsx, tailwind-merge).

### Core Components
#### [NEW] [components/ui]
- Button, Card, Input, Badge, etc.
- Reusable layout components.

### UI/UX Enhancements
#### [MODIFY] [app/globals.css]
- Update color palette to a premium Zinc/Violet theme.
- Add custom animations and glassmorphism utilities.

#### [MODIFY] [app/(user)/page.tsx]
- Redesign hero section with gradients and better typography.
- Add hover effects to course cards.

#### [MODIFY] [app/(user)/layout.tsx]
- Implement glassmorphism navbar.
- Fix container alignment issues.

### Admin Authentication
#### [NEW] [middleware.ts]
- Protect `/admin` routes.
- Redirect unauthenticated users to `/admin/login`.
- Exclude `/admin/login` from protection.

#### [MODIFY] [app/admin/layout.tsx]
- Add Sign Out button.

#### [MODIFY] [app/admin/login/page.tsx]
- Change Enrollment Number to Email.

### Authentication Validation
#### [MODIFY] [app/admin/login/page.tsx]
- Validate email against `admin@lms.com`.
- Validate password against `admin123`.
- Show error toast/alert on failure.

#### [MODIFY] [app/(user)/login/page.tsx]
- Fetch users from `useStore`.
- Check if Enrollment and Password match any user.
- Show error on failure.

### Course Content Management
#### [MODIFY] [lib/store.ts]
- Update `Course` type to include `lessons: Lesson[]`.
- Define `Lesson` type: `{ id, title, videoUrl, duration }`.

#### [MODIFY] [app/admin/courses/page.tsx]
- Add "Manage Content" button to course items.
- Create a dialog/view to add/edit/delete lessons for a course.
- Input fields: Lesson Title, Video URL (YouTube/MP4 link), Duration.

#### [NEW] [app/(user)/courses/[courseId]/page.tsx]
- Dynamic route for course details.
- Fetch course by `courseId`.
- Layout:
    - Left/Top: Video Player (iframe for YouTube or video tag).
    - Right/Bottom: Playlist (list of lessons).
    - Clicking a lesson updates the player.

### User Home Page Enhancement
#### [MODIFY] [app/(user)/page.tsx]
- **Hero Section**: Add stats (Students, Courses, Instructors).
- **Categories Section**: Grid of topic categories (Web Dev, Design, Data Science, etc.) with icons.
- **Features Section**: "Why Choose Us" with 3-4 key benefits (Expert Instructors, Lifetime Access, etc.).
- **Testimonials Section**: Carousel or grid of student reviews.
- **Call to Action**: Final banner encouraging signup.

### User Enrollment
#### [MODIFY] [lib/store.ts]
- Update `User` type to include `enrolledCourses: string[]` (list of course IDs).
- Add `enrollUser(userId, courseId)` action.

#### [MODIFY] [app/(user)/page.tsx]
- Check if current user is enrolled in a course.
- If enrolled -> Show "Start Learning" (Link to player).
    - If not enrolled -> Show "Enroll Now" (Button that calls `enrollUser`).

---

## Backend Implementation (MongoDB + Express)

### Architecture Overview
Replace Firebase with a custom **Node.js/Express backend** + **MongoDB** for full data control.

**Tech Stack:**
- **Backend**: Node.js + Express.js
- **Database**: MongoDB Atlas (Cloud) or Local MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Media**: Cloudinary (for video/image hosting)

### Backend Structure

#### [NEW] [backend/server.js]
- Express server setup
- MongoDB connection
- Middleware (CORS, JSON parser, error handling)
- Route mounting

#### [NEW] [backend/models/]
- `User.js`: Mongoose schema (email, password hash, role, enrolledCourses)
- `Course.js`: Mongoose schema (title, description, price, lessons, color)
- `Lesson.js`: Embedded in Course or separate collection

#### [NEW] [backend/routes/]
- `auth.js`: `/api/auth/register`, `/api/auth/login`
- `courses.js`: `/api/courses` (GET, POST, PUT, DELETE)
- `users.js`: `/api/users` (GET, PUT, DELETE)
- `enrollments.js`: `/api/enrollments` (POST)

#### [NEW] [backend/controllers/]
- `authController.js`: Handle registration, login, JWT generation
- `courseController.js`: CRUD operations for courses
- `userController.js`: User management

#### [NEW] [backend/middleware/]
- `auth.js`: JWT verification middleware
- `errorHandler.js`: Centralized error handling

### Frontend Changes

#### [DELETE] [src/lib/firebase.ts]
- Remove Firebase SDK

#### [NEW] [src/lib/api.ts]
- Axios/Fetch wrapper for API calls
- Base URL configuration
- Token interceptor

#### [MODIFY] [src/lib/store.ts]
- Replace Firestore listeners with API calls
- Use `useState` + `useEffect` to fetch data
- Store JWT token in localStorage

#### [MODIFY] [src/pages/user/Login.tsx] & [src/pages/admin/Login.tsx]
- Call `/api/auth/login` endpoint
- Store JWT token on successful login

### Migration to Vite + React
#### [NEW] [vite.config.ts]
- Configure Vite with React plugin and path aliases.

#### [NEW] [src/main.tsx]
- Application entry point. Mounts `App` to `#root`.

#### [NEW] [src/App.tsx]
- Setup `BrowserRouter` and define routes.
- `/` -> User Home
- `/login` -> User Login
- `/my-learning` -> My Learning
- `/courses/:courseId` -> Course Player
- `/admin/login` -> Admin Login
- `/admin/courses` -> Admin Courses

#### [REFACTOR] [src/**/*]
- Move pages from `src/app` to `src/pages`.
- Replace `next/link` with `react-router-dom` `Link`.
- Replace `next/navigation` `useRouter` with `react-router-dom` `useNavigate`.
- Remove `layout.tsx` files and implement layouts in `App.tsx` or wrapper components.

### User Authentication
#### [NEW] [app/(user)/login/page.tsx]
- Login form with Enrollment Number and Password.
- Glassmorphism design.

#### [MODIFY] [app/(user)/layout.tsx]
- Link Sign In button to `/login`.
- Remove "Admin Mode" button.

### UI Polish
#### [MODIFY] [app/admin/login/page.tsx]
- Enhance visual design (background patterns, better typography).
- Make it look "nice" and professional.

### Admin Panel Refactor
#### [MODIFY] [app/admin/layout.tsx]
- Remove Dashboard link from sidebar.

#### [MODIFY] [app/admin/page.tsx]
- Redirect to `/admin/courses`.

### User Management
#### [NEW] [components/ui/dialog.tsx]
- Radix UI Dialog wrapper.

#### [MODIFY] [app/admin/users/page.tsx]
- Add "Invite User" dialog.
- Form with Enrollment Number and Password fields.

### Admin Panel
#### [NEW] [app/admin]
- Layout with Sidebar.
- Dashboard page.
- Courses management page.
- Users management page.

### User Panel
#### [NEW] [app/(user)]
- Home page (Course Catalog).
- My Learning page.
- Course player/details page.

## Verification Plan
### Automated Tests
- Build verification: `npm run build`
- Lint check: `npm run lint`

### Manual Verification
- Verify Admin Dashboard renders correctly.
- Verify User Course Catalog renders correctly.
- Check responsiveness on mobile/desktop.
