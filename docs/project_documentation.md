# AcademyPro Project Documentation

This document gives a practical, developer-focused overview of the LMS platform so contributors can quickly understand how the system is structured and where to make changes.

## 1) Project Overview

AcademyPro is a full-stack Learning Management System with three major product surfaces:

- Student learning portal (courses, player, progress, quizzes)
- Admin control panel (users, courses, tests, support, analytics)
- Standalone test/exam engine (invite-based assessments with scoring)

The repository is organized as a monorepo-style structure with separate frontend and backend applications.

## 2) Repository Structure

```text
/
├── src/                  # React + TypeScript frontend
├── public/               # Static frontend assets
├── backend/              # Express + MongoDB backend API
├── docs/                 # Plans, walkthroughs, and technical docs
├── package.json          # Frontend scripts/dependencies
└── backend/package.json  # Backend scripts/dependencies
```

## 3) Frontend Architecture

### Stack

- React 19
- Vite
- TypeScript
- Tailwind CSS
- Radix UI

### Entry and Routing

- App bootstrap: `src/main.tsx`
- Route configuration: `src/App.tsx`

Route groups are split by user context:

- Public/student routes (`/`, `/login`, `/browse`, `/courses/:courseId`)
- Demo-student routes (`/demo-student/*`)
- Admin routes (`/admin/*`)
- Demo-admin routes (`/demo/*`)
- Standalone test routes (`/test/:slug`, `/test/:slug/take`)

### State and Providers

Global providers are registered at the app root:

- `StoreProvider` for shared app state/synchronization
- `ThemeProvider` for persisted theme behavior

## 4) Backend Architecture

### Stack

- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Brevo integration for notifications

### Server Composition

Main API server: `backend/server.js`

Responsibilities:

- Load environment variables
- Connect to MongoDB at startup
- Configure CORS for local, configured frontend, and Vercel preview origins
- Mount feature routes under `/api/*`
- Register global error handling
- Expose health endpoint (`/api/health`)

### API Modules

Backend routes are separated by domain in `backend/routes/`:

- `auth.js` - login, registration, identity, admin security flows
- `users.js` - user management and enrollment operations
- `courses.js` - course CRUD and retrieval
- `quizzes.js` - quiz management and assessment operations
- `tests.js` - standalone tests and invitation workflows
- `support.js` - support ticket operations
- `analytics.js` - dashboard/insight APIs
- `payment.js` - payment workflows
- `progress.js` - course progress tracking
- `settings.js` - configuration endpoints
- `upload.js` - upload handling
- `certificate.js` - certificate generation/access

## 5) Data Layer

MongoDB is the system of record, accessed via Mongoose models and controller logic.

Core entities include:

- Users (students/admins/super-admins)
- Courses and lesson hierarchies
- Progress records
- Quizzes and attempts
- Standalone tests and invitations
- Support tickets

## 6) Security Model

Security features implemented across the platform include:

- JWT-based authentication and protected routes
- Password hashing with bcrypt
- 2FA support (TOTP) for protected admin accounts
- Role-based access control (Admin vs Super Admin)
- CORS restrictions based on deployment environments

## 7) Local Development Setup

## Prerequisites

- Node.js 18+
- MongoDB connection string
- Brevo API key (if testing email flows)

### Frontend

```bash
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
cp env.example .env
npm run dev
```

Minimum backend `.env` values:

- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `BREVO_API_KEY` (required for email features)

## 8) Deployment Model

- Frontend: Vercel
- Backend: Render
- Object/media storage: Cloudflare R2 (S3-compatible)

The frontend calls backend APIs through `VITE_API_URL`.

## 9) Suggested Onboarding Path for New Contributors

1. Read this document once to understand boundaries.
2. Read `README.md` for product-level feature context.
3. Open `src/App.tsx` to understand route surfaces.
4. Open `backend/server.js` to understand API composition.
5. Use docs in `docs/` for feature-specific implementation details.

## 10) Where to Extend Next

Typical extension points:

- Add a frontend page under `src/pages/...` and wire route in `src/App.tsx`
- Add backend endpoint under `backend/routes/...` and connect controller/service logic
- Add model changes in backend schema definitions and migration/seed scripts as needed
- Update docs in `docs/` whenever behavior or architecture changes

---

If you want this documentation converted into a stricter format (e.g., API reference only, onboarding guide only, or architecture decision records), split this file into dedicated docs under `docs/architecture/`, `docs/onboarding/`, and `docs/api/`.
