# 🎓 AcademyPro - Advanced LMS Platform

AcademyPro is a modern, high-performance Learning Management System (LMS) designed for a premium student experience and powerful administrative control. Built with **React 19**, **Vite**, and **TypeScript**, it features a sophisticated state management system and seamless video integration.

![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Tech](https://img.shields.io/badge/stack-React%2019%20%7C%20Vite%20%7C%20TS-blue)

---

## 🚀 Core Features

### 👨‍🎓 Student Portal
- **Intelligent Dashboard**: Track course progress, daily streaks, and completion rates.
- **Hybrid Video Player**: Smooth playback of both YouTube (Iframe API) and self-hosted videos with position memory.
- **Global Data Sync**: Automatic background synchronization every 30 seconds.
- **Interactive Quizzes**: Take assessments directly within the course player.
- **Progress Tracking**: Automatic check-offs for completed lessons.
- **Dark/Light Mode**: Premium glassmorphism design that adapts to user preference.

### 🔐 Admin Panel
- **Real-time Analytics**: Visual insights into revenue growth and student engagement using Recharts.
- **Course Management**: Full CRUD for courses, modules, and lessons.
- **User Orchestration**: Manage student enrollments, status, and credentials.
- **Support Inbox**: Integrated ticketing system for direct student interaction.
- **Quiz Builder**: Create and manage multiple-choice assessments linked to lessons.

---

## 🛠 Tech Stack

- **Frontend**: React 19, Vite, TypeScript
- **Styling**: Tailwind CSS 4, Radix UI, Lucide Icons
- **State Management**: React Context + Custom Hook pattern (Global Sync)
- **Networking**: Axios with centralized API configuration
- **Visualization**: Recharts for administrative analytics
- **Notifications**: Sonner for toast management

---

## 📦 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Preethesh26/lms-platform.git
   cd lms-platform
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory and add the following:
   ```env
   VITE_API_URL=your_backend_api_url
   VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
   VITE_RAZORPAY_KEY=your_razorpay_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

---

## 🏗 Build & Deployment

To generate a production-ready build:
```bash
npm run build
```

The output will be in the `dist/` folder, which can be deployed to Vercel, Netlify, or any static hosting service.

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

Developed with ❤️ by [Preethesh](https://github.com/Preethesh26)
