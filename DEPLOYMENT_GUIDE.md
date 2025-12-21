# Deploying to Vercel (Free)

Since you have already pushed your code to GitHub, the easiest way to host your frontend for free is using **Vercel**.

## Method 1: The "Click & Connect" (Recommended)
1.  Go to [Vercel.com](https://vercel.com) and **Sign Up**.
2.  Click **"Add New Project"**.
3.  Select **"Continue with GitHub"**.
4.  Find your `lms-platform` repository and click **"Import"**.
5.  **Framework Preset**: It should auto-detect "Vite".
6.  **Root Directory**: `./` (default is fine).
7.  **Build Command**: `npm run build` (default).
8.  **Output Directory**: `dist` (default).
9.  Click **"Deploy"**.

## Method 2: Manual Upload (Netlify)
If you prefer Netlify:
1.  Run `npm run build` in your terminal.
2.  This generates a `dist` folder.
3.  Go to [Netlify Drop](https://app.netlify.com/drop).
4.  Drag and drop the `dist` folder onto the page.

## Step 1: Deploy Backend (Render.com)
The backend needs a server to run Node.js. Render offers a free tier.

1.  Push your latest code to GitHub.
2.  Go to [Render Dashboard](https://dashboard.render.com).
3.  Click **"New"** -> **"Web Service"**.
4.  Connect your GitHub repository `lms-platform`.
5.  **Root Directory**: `backend` (Important!).
6.  **Build Command**: `npm install`.
7.  **Start Command**: `node server.js`.
8.  **Environment Variables** (Add these from your `.env` file):
    *   `DB_URL`: Your MongoDB connection string.
    *   `JWT_SECRET`: A secure random string.
    *   `PORT`: `10000` (or leave default).
9.  Click **"Create Web Service"**.
10. Wait for it to deploy. Copy the **Service URL** (e.g., `https://lms-backend.onrender.com`).

## Step 2: Deploy Frontend (Vercel)
Now deploy the React frontend and connect it to your new backend.

1.  Go to [Vercel.com](https://vercel.com) and **Add New Project**.
2.  Import `lms-platform` from GitHub.
3.  **Root Directory**: `./` (default).
4.  **Environment Variables**:
    *   **Name**: `VITE_API_URL`
    *   **Value**: `https://lms-backend.onrender.com/api` (The URL from Step 1 + `/api`).
5.  Click **"Deploy"**.

## Finish
Once Vercel finishes, your **AcademyPro** platform will be live!
-   Frontend: `https://lms-platform.vercel.app` (or similar)
-   Backend: `https://lms-backend.onrender.com`

## 🌐 About Free Domains
*   **Free Subdomains**: Vercel and Render give you free URLs (e.g., `academy-pro.vercel.app`). These are completely free and work forever.
*   **Custom Domains**: If you want `www.academypro.com`, you usually have to buy it (~$10/year) from Namecheap or GoDaddy. You can then connect it to Vercel for free.
*   **Recommendation**: Start with the free `.vercel.app` domain. it is professional enough for testing and initial users.
