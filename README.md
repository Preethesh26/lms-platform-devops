# 🎓 AcademyPro - Advanced LMS Platform

AcademyPro is a modern, high-performance Learning Management System (LMS) designed for a premium student experience and powerful administrative control. This project was built to understand how a complex, full-stack application works from the ground up, integrating front-end state management, back-end API logic, and automated services.

### 🌐 Live Demo
Check out the live website: **[https://academypro-liard.vercel.app/](https://academypro-liard.vercel.app/)**

#### **Demo Credentials**
Access the Admin Dashboard here: **[https://academypro-liard.vercel.app/demo/login](https://academypro-liard.vercel.app/demo/login)**

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `demo-admin@academypro.com` | `demo1234` |
| **Student** | `student@example.com` | `student123` |

*Note: The Admin demo is in **Read-Only Mode** to protect live data.*

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tech](https://img.shields.io/badge/stack-React%2019%20%7C%20Vite%20%7C%20Node.js-blue)

---

## 🚀 Key Features

### 👨‍🎓 Student Portal
- **Intelligent Dashboard**: Track course progress, daily streaks, and completion rates.
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
- **Strategic Insights**: Real-time analytics for revenue and student engagement using Recharts.
- **Content Management**: Advanced CRUD for courses, modules, lessons, and assignments.
- **AI-Powered Tools**: Integrated AI for lesson summaries and quiz generation.
- **Support System**: Full support ticket workflow with automated status update notifications.

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
- **Email Service**: Brevo (Sendinblue API V3)
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

   # Create Demo Admin account
   node createDemoAdmin.js
   ```

---

## 🌐 Deployment Logic

### **Frontend (Vercel)**
The frontend is optimized for **Vercel**. It uses the Vite preset and connects to the backend via the `VITE_API_URL` environment variable.

### **Backend (Render)**
The backend is hosted on **Render** as a Web Service.
- **Node Runtime**: Optimized for Render's environment.
- **CORS Management**: Dynamically handles requests from the Vercel frontend.
- **Continuous Deployment**: Automatically redeploys on every push to the `main` branch.

---

## 📄 License
This project is licensed under the MIT License.

Developed by [Preethesh](https://github.com/Preethesh26) | [LinkedIn](https://www.linkedin.com/in/preethesh26)
