# 🏗️ The AcademyPro Unified Workflow Guide

This guide outlines the professional process for building, testing, and deploying features for AcademyPro. Follow these phases in order to ensure your website remains stable and your student data stays safe.

---

## 🏎️ Phase 1: Local Development (The Workshop)

**Purpose**: Build features and fix bugs on your own computer where it’s fast and free.

1.  **Start the Backend**:
    *   Open terminal: `cd backend`
    *   Run: `npm run dev`
2.  **Start the Frontend**:
    *   Open a second terminal: `npm run dev`
3.  **The Test**:
    *   Open `http://localhost:5173`.
    *   Make changes to your code.
    *   Verify the logic works.
    *   **Crucial**: Check your `backend/.env` to ensure you are connecting to a **local/test database**, not your production one.

---

## 🎭 Phase 2: Live Staging (The Rehearsal)

**Purpose**: Test your changes on the real internet (Render/Vercel) using a private link before your students see it.

1.  **Commit your changes**:
    ```bash
    git add .
    git commit -m "feat: your new feature description"
    ```
2.  **Push to Staging**:
    ```bash
    git checkout staging
    git merge main
    git push origin staging
    ```
3.  **The Test**:
    *   Open your **Vercel Staging URL** (e.g., `lms-platform-git-staging...`).
    *   Verify that everything works on a real server.
    *   Check for "Server-only" errors (like Render timeout or database connection issues).

---

## 🚀 Phase 3: Production (Going Live)

**Purpose**: Release the verified, bug-free feature to your real students.

1.  **Merge into Main**:
    ```bash
    git checkout main
    git merge staging
    git push origin main
    ```
2.  **The Result**:
    *   Vercel and Render will automatically detect the push to `main`.
    *   After ~3 minutes, your changes will be live on `https://academypro-liard.vercel.app`.
3.  **Final Check**:
    *   Open your production site and do one final "sanity check."

---

## 💡 Pro-Tips for Success

*   **Never Push directly to `main`**: Always go through `staging` first. This is the #1 rule of professional developers.
*   **Database Isolation**: Always ensure your **Staging Backend** on Render is connected to a **Staging Database**, and your **Production Backend** is connected to your **Production Database**.
*   **Logs are your Friend**: If a deployment fails (Exit status 1), look at the **Events** or **Logs** tab on Render/Vercel immediately. It will tell you the exact line of code that caused the crash.

---

> [!NOTE]
> For detailed technical setup instructions for these environments, refer to the **[Staging Setup Guide](file:///Users/apple/Desktop/Preethesh/lms-platform/docs/STAGING_SETUP.md)**.
