# 🎓 AcademyPro - Advanced LMS Platform

AcademyPro is a modern, high-performance Learning Management System (LMS) designed for a premium student experience and powerful administrative control. This project was built to understand how a complex, full-stack application works from the ground up, integrating front-end state management, back-end API logic, and automated services.

### 🌐 Live Demo & Inquiries
Check out the live website: **[https://academypro-liard.vercel.app/](https://academypro-liard.vercel.app/)**

- **Student Portal**: Explore the student experience instantly.
  - **Email**: `demo-student@academypro.com`
  - **Password**: `student123`
  - **Enrollment**: `DEMO-001`
- **Administrative Access**: To protect system integrity, full admin credentials are not public.

> [!IMPORTANT]
> Interested in a full technical walkthrough with administrative privileges? Please **[Contact Me on LinkedIn](https://www.linkedin.com/in/preethesh26)** or email me at **[kulalpreethesh20@gmail.com](mailto:kulalpreethesh20@gmail.com)** for private credentials.

*Note: The Admin demo is in **Read-Only Mode** to protect live data.*

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tech](https://img.shields.io/badge/stack-React%2019%20%7C%20Vite%20%7C%20Node.js-blue)

---

## 🚀 Key Features

### 👨‍🎓 Student Portal
- **Intelligent Dashboard**: Track course progress and completion rates.
- **Hybrid Video Player**: Smooth playback of both YouTube (Iframe API) and self-hosted videos with position memory.
- **Global Data Sync**: Automatic background synchronization every 30 seconds ensures you never miss an update.
- **Interactive Quizzes**: Take assessments directly within the course player.
- **Progress Tracking**: Automatic check-offs for completed lessons and course certificates.

### 📝 Standalone Test Engine (Aptitude & Exams)
AcademyPro includes a powerful standalone test hosting system, ideal for recruitment, skill assessments, or entrance exams.
- **Ad-hoc Invitations**: Invite users via email with unique access links.
- **Advanced Configuration**: Set time limits, passing scores, and strict deadlines.
- **Auto-Grading**: Instant calculation of results and pass/fail status.
- **Anti-Cheat**: One-time attempt enforcement at the database level.
- **Real-time Analytics**: Admins can track invited vs. completed attempts and individual performance.

### 🔐 Admin Orchestration
- **Tiered Administrative Hierarchy**: Implementation of a **Super Admin** role for master oversight and a standard **Admin** role for daily operations.
- **Administrative RBAC**: Strict role-based access control where only Super Admins can manage, edit, or delete other administrator accounts.
- **Strategic Insights**: Real-time analytics for revenue and student engagement using Recharts.
- **Content Management**: Advanced CRUD for courses, modules, lessons, and assignments.
- **AI-Powered Tools**: Integrated AI for lesson summaries and quiz generation.
- **Support System**: Full support ticket workflow with automated status update notifications.
- **Account Resolver (Impersonation)**: High-privilege terminal for Admins and Super Admins to instantly synchronize a session with any student's account.
  - Enables direct issue resolution without requiring user passwords.
  - Role-based security: Admins can only resolve students; Super Admins have master access.
- **Duplicate Data Prevention**: Intelligent backend validation to prevent accidental redundancy.
  - Enforces uniqueness for enrollment IDs, emails, course titles, and test IDs.
  - Real-time frontend toast notifications with specific error feedback.

### 🛡️ Enterprise Security (Admin Protection)
AcademyPro implements industry-standard security for administrative accounts:
- **Two-Factor Authentication (2FA)**: TOTP-based authentication using Google Authenticator
  - QR code generation for easy setup
  - Mandatory verification during login for protected accounts
  - Secure disable flow with password confirmation
- **Inactivity Auto-Lock (Linked to 2FA)**: High-security accounts with 2FA enabled benefit from automatic session locking after 10 minutes of inactivity.
  - Non-destructive overlay preserves work context
  - OTP verification required to unlock
  - Throttled activity tracking for performance optimization
- **Password Security**: Bcrypt hashing with proper salt generation
- **Session Management**: JWT-based authentication with secure token handling

### 🛡 Secure Demo Experience (Parallel Universe)
AcademyPro features a sophisticated "Parallel Universe" demo mode that allows stakeholders to explore the platform without touching production data.
- **Dynamic Routing**: Automatic switching between `/admin/*` (live) and `/demo/*` (preview) routes based on user identity.
- **Universal Mock Data**: Every vista (Dashboard, Courses, Support, Tests, Quizzes) is populated with professional, high-quality fake data.
- **Environment Isolation**: Redirection guards prevent real admins from seeing demo data and vice-versa.
- **Universal Trigger**: Append `?demo=1` to any URL (e.g., `/browse?demo=1`) to instantly showcase the platform with mock data, even without logging in.

---

## 📧 Automated Notifications (Brevo Integration)
The platform features a comprehensive notification system powered by **Brevo (formerly Sendinblue)**:
- **Welcome Credentials**: Automated emails to new students with login details.
- **Test Invitations**: Branded invitations for standalone exams with secure link access.
- **Support Updates**: Real-time status notifications for support requests.
- **Security**: Secure OTP-less password reset workflows via verified email tokens.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4, Radix UI
- **Backend**: Node.js, Express, MongoDB
- **Security**: bcryptjs, otplib (TOTP), qrcode, JWT
- **Email Service**: Brevo (Sendinblue API V3)
- **Object Storage**: Cloudflare R2 (S3-compatible, Zero Egress Fees)
- **State Management**: React Context + Custom Hook pattern (Global Synchronization)
- **Deployment**: Vercel (Frontend), Render (Backend)

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB account (Atlas)
- Brevo API Key

### Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/Preethesh26/lms-platform.git
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` in the root (frontend) and `backend/` directories.
   
   **Root `.env` (Frontend):**
   ```env
   VITE_API_URL=https://your-backend-url.onrender.com/api
   ```

   **Backend `.env`:**
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   BREVO_API_KEY=your_brevo_api_key
   ```

3. **Execution**
   ```bash
   # Development
   npm run dev

   # Backend (from backend directory)
   npm start

   # Create Demo Accounts
   node createDemoAdmin.js
   node createDemoStudent.js

   # Admin Migrations
   node upgradeSuperAdmin.js [email]
   ```

---

## 🌐 Deployment Logic

### **Frontend (Vercel)**
The frontend is optimized for **Vercel**. It uses the Vite preset and connects to the backend via the `VITE_API_URL` environment variable.

### **Backend (Render)**
The backend is hosted on **Render** as a Web Service.
- **Node Runtime**: Optimized for Render's environment.
- **CORS Management**: Dynamically handles requests from the Vercel frontend.
- **Media & Storage**: Assets like thumbnails and course videos are served via **Cloudflare R2** for high performance and zero egress costs.
- **Continuous Deployment**: Automatically redeploys on every push to the `main` branch.

---


## 📄 License
This project is licensed under the MIT License.

Developed by Preethesh [Github](https://github.com/Preethesh26) | [LinkedIn](https://www.linkedin.com/in/preethesh26) | [Email](mailto:kulalpreethesh20@gmail.com)
