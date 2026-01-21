# 🧪 Testing & Development Flow Guide

This guide explains how to safely test changes to **AcademyPro** in a local development environment before pushing them to the live production website.

## ⚠️ The Golden Rule
**Never test directly on the production site.** Always verify your changes locally first. This prevents bugs from affecting your students and ensures your database remains healthy.

---

## 🏗️ 1. Environment Isolation

The platform uses environment variables to distinguish between your local computer (Development) and the internet (Production).

| Environment | Frontend URL | Backend URL | Purpose |
| :--- | :--- | :--- | :--- |
| **Local (Dev)** | `http://localhost:5173` | `http://localhost:5000` | Building and testing features. |
| **Live (Prod)** | `https://academypro-liard.vercel.app` | `https://your-backend.onrender.com` | Real students and live data. |

### Configuration Checklist
Ensure you have these files set up on your computer:
1.  **Root `.env`**: Point `VITE_API_URL` to `http://localhost:5000/api`.
2.  **Backend `.env`**: 
    *   `PORT=5000`
    *   `MONGODB_URI`: Use a **different** MongoDB cluster or database name (e.g., `lms-dev`) than your production one.
    *   `FRONTEND_URL=http://localhost:5173`

---

## 🚀 2. Running the Platform Locally

To see your changes, you must run both the backend and frontend at the same time.

### Step A: Start the Backend
1. Open a terminal.
2. `cd backend`
3. `npm run dev`
   - *This uses `nodemon` which restarts the server automatically whenever you save a file.*

### Step B: Start the Frontend
1. Open a **second** terminal.
2. `npm run dev`
   - *This starts the Vite development server at `http://localhost:5173`.*

---

## 🔍 3. How to Test Changes

Once both are running, follow this workflow:

### A. Functional Testing (Manual)
1. Open `http://localhost:5173` in your browser.
2. **Student Side**: Enroll in a course, watch a video, and take a quiz. Verify progress bars move.
3. **Admin Side**: Edit a user, change a course price, or create a new lesson. 
4. **Console Check**: Press `F12` (Inspect) and check the "Console" tab for any red errors.

### B. API Testing (Postman)
If you are changing backend logic, use **Postman**:
1. Import the collection from `docs/postman_collection.json`.
2. Update the `baseUrl` variable to `http://localhost:5000/api`.
3. Run requests to ensure routes return the correct JSON data.

---

## 📋 4. Pre-Deployment Checklist

Before you run `git push`, perform these "sanity checks":

1.  **Stop the App**: Press `Ctrl+C` in both terminals.
2.  **Linting**: Run `npm run lint` to catch syntax errors or unused variables.
3.  **Build Check**: Run `npm run build`. If this fails, the live site will also fail.
4.  **No Secrets**: Ensure you haven't hardcoded any passwords or API keys in the code.

---

## 🚢 5. Pushing to Production

Once you are 100% happy with your local tests:

1.  **Staging**: Push to the `staging` branch (see the **[Staging Setup Guide](file:///Users/apple/Desktop/Preethesh/lms-platform/docs/STAGING_SETUP.md)**).
2.  **Live**: Merge staging into main and push.

**What happens next?**
Vercel and Render will detect the push and automatically start building your new code. Within 2-3 minutes, your changes will be live on the production URL.

---

> [!TIP]
> If the live site breaks after a push, check the **Render Dashboard** logs for the backend or **Vercel Deployment** logs for the frontend to see the error message.
