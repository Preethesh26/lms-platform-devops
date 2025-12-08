# Deployment Guide for LMS Platform

This guide covers how to deploy your full-stack LMS application for free using **Vercel** (Frontend) and **Render** (Backend).

## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Vercel](https://vercel.com/) account.
- A [Render](https://render.com/) account.
- Your MongoDB Atlas connection string.

---

## Part 1: Backend Deployment (Render)

1.  **Push your code to GitHub**
    - Ensure your project is pushed to a GitHub repository.

2.  **Create a Web Service on Render**
    - Go to the [Render Dashboard](https://dashboard.render.com/).
    - Click **New +** -> **Web Service**.
    - Connect your GitHub repository.

3.  **Configure the Service**
    - **Name**: `lms-backend` (or similar)
    - **Root Directory**: `backend` (Important! This tells Render the backend code is in the `backend` folder)
    - **Runtime**: `Node`
    - **Build Command**: `npm install`
    - **Start Command**: `node server.js`
    - **Instance Type**: Free

4.  **Environment Variables**
    - Scroll down to "Environment Variables" and add the following from your `backend/.env` file:
        - `MONGODB_URI`: Your MongoDB connection string.
        - `JWT_SECRET`: Your secret key.
        - `NODE_ENV`: `production`
        - `PORT`: `10000` (Render uses this port by default)

5.  **Deploy**
    - Click **Create Web Service**.
    - Wait for the deployment to finish. You will get a URL like `https://lms-backend.onrender.com`. **Copy this URL.**

---

## Part 2: Frontend Deployment (Vercel)

1.  **Import Project to Vercel**
    - Go to the [Vercel Dashboard](https://vercel.com/dashboard).
    - Click **Add New...** -> **Project**.
    - Import your GitHub repository.

2.  **Configure Project**
    - **Framework Preset**: Vite (should be detected automatically).
    - **Root Directory**: `./` (default).

3.  **Environment Variables**
    - Expand the "Environment Variables" section.
    - Add the following:
        - `VITE_API_URL`: The URL of your deployed backend (from Part 1), e.g., `https://lms-backend.onrender.com/api` (Note: Append `/api` if your frontend code expects it, or just the base URL if your [api.ts](file:///Users/apple/Desktop/Preethesh/lms-platform/src/lib/api.ts) handles the `/api` part. Based on your code, `VITE_API_URL` should be the base URL, e.g., `https://lms-backend.onrender.com/api`).

4.  **Deploy**
    - Click **Deploy**.
    - Vercel will build and deploy your frontend.

---

## Part 3: Final Configuration

1.  **Update Backend CORS**
    - Once your frontend is deployed, you'll get a URL like `https://lms-platform.vercel.app`.
    - Go back to your **Render Dashboard** -> **Environment Variables**.
    - Add/Update a variable (if you implemented CORS restriction):
        - `FRONTEND_URL`: `https://lms-platform.vercel.app`
    - *Note: Currently, your backend allows all origins (`cors()`), so this step is optional but recommended for security later.*

2.  **Test Your App**
    - Open your Vercel URL.
    - Try logging in, viewing courses, etc.
