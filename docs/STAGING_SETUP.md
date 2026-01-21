# 🌐 Live Staging Environment Setup Guide

A **Staging Environment** is a private, live copy of your website. It allows you to test changes on the real internet (Vercel/Render) without affecting your actual students or production database.

---

## 🛠️ Step 1: Git Branching Strategy

To manage two versions of your site, you need two branches in GitHub:

1.  **`main` branch**: This is your **Production** site (Live for students).
2.  **`staging` branch**: This is your **Testing** site (Only for you).

### Create the staging branch:
Run these commands in your terminal:
```bash
git checkout -b staging
git push -u origin staging
```

---

## 🗄️ Step 2: Separate MongoDB Database

**Never share a database between Staging and Production.** If you delete a user in Staging, it shouldn't disappear in Production.

1.  Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2.  **Option A (Free)**: Create a new Cluster named `AcademyPro-Staging`.
3.  **Option B (Easy)**: Use your existing cluster but change the Database Name in the Connection String (e.g., `...mongodb.net/staging-db?retryWrites...`).
4.  Copy the new **Connection String**.

---

## 🖥️ Step 3: Backend Staging (Render.com)

1.  Go to your [Render Dashboard](https://dashboard.render.com).
2.  Click **"New"** -> **"Web Service"**.
3.  Connect your GitHub repository.
4.  **Name**: `academy-pro-backend-staging`.
5.  **Branch**: Select **`staging`** (Crucial!).
6.  **Environment Variables**:
    *   `MONGODB_URI`: Paste your **Staging** MongoDB string.
    *   `JWT_SECRET`: Use a different secret than production.
    *   `FRONTEND_URL`: Leave empty for now (we will add this in Step 4).
    *   `R2_BUCKET_NAME`: `lms-platform-staging` (Keep test files separate!).
7.  Click **"Create Web Service"**.
8.  Wait for deployment and copy the **Service URL** (e.g., `https://backend-staging.onrender.com`).

---

## 🎨 Step 4: Frontend Staging (Vercel)

Vercel handles multiple branches automatically, but we want a permanent URL and specific settings for staging.

1.  Go to your [Vercel Dashboard](https://vercel.app).
2.  Select your existing **lms-platform** project.
3.  Go to **Settings** -> **Environment Variables**.
4.  Add/Update `VITE_API_URL`:
    *   **Value**: `https://backend-staging.onrender.com/api` (The URL from Step 3).
    *   **Environment**: Uncheck "Production", and check **"Preview"**. 
5.  Go to **Settings** -> **Git**.
    *   Ensure "Preview Deployment" is enabled for all branches.
6.  **Trigger a Build**: 
    - Push any change to your `staging` branch:
    ```bash
    git add .
    git commit -m "chore: setup staging environment"
    git push origin staging
    ```
7.  Vercel will give you a specific URL for this branch (e.g., `lms-platform-git-staging-yourname.vercel.app`).

---

## 🔄 The New Workflow

From now on, follow this "Professional Pipeline":

1.  **Develop**: Work locally (`npm run dev`).
2.  **Test Live**: Push to the `staging` branch.
    *   Check `https://your-staging-url.vercel.app`.
    *   Verify features and check the Staging MongoDB for data.
3.  **Go Live**: Once satisfied, merge Staging into Main.
    ```bash
    git checkout main
    git merge staging
    git push origin main
    ```
    *   Vercel and Render will now update the **Real Production Site**.

---

> [!IMPORTANT]
> Always verify that your **Staging Backend** environment variables are correctly pointing to the **Staging Database**. Mistakes here can lead to testing data appearing on your live site!
