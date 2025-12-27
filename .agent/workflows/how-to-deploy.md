---
description: How to deploy the EstiRE application to Vercel
---
# EstiRE Deployment Guide (Vercel)

Vercel is the best platform for deploying Next.js applications. Follow these steps to release your app.

## Prerequisites
1.  **GitHub Account**: Ensure your code is pushed to a GitHub repository.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) using your GitHub account.

## Step 1: Push Latest Changes to GitHub
Make sure all your recent changes (AdSense, UI fixes) are committed and pushed.

```bash
git add .
git commit -m "Ready for deployment: AdSense config and UI polish"
git push origin main
```

## Step 2: Import Project in Vercel
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **"Add New..."** -> **"Project"**.
3.  Find your `sekisan-app` repository in the list and click **"Import"**.

## Step 3: Configure Project
Vercel will automatically detect that it's a Next.js project. You usually don't need to change build settings.

### **IMPORTANT: Environment Variables**
You **MUST** add your environment variables here.
1.  Expand the **"Environment Variables"** section.
2.  Add the variables from your `.env.local` file:
    *   `NEXT_PUBLIC_BASE_URL` (e.g., your production URL, or leave blank initially and update later)
    *   `GOOGLE_API_KEY` (Your Gemini API Key)
    *   `NEXT_PUBLIC_SUPABASE_URL` (If using Supabase)
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (If using Supabase)

> [!NOTE]
> Do **NOT** add `IS_ADSENSE_ACTIVE` yet if you want it disabled initially (it defaults to `false`).

## Step 4: Deploy
1.  Click **"Deploy"**.
2.  Wait for the build to finish (usually 1-2 minutes).
3.  Once complete, you will see a "Congratulations!" screen with your live URL (e.g., `sekisan-app.vercel.app`).

## Step 5: Post-Deployment Check
1.  Access the live URL.
2.  Test the calculation and file upload features.
3.  **AdSense Check**: Verify that **NO** ads or placeholders are visible (since `IS_ADSENSE_ACTIVE` is false).

## Step 6: Custom Domain (Optional but Recommended)
For AdSense approval, a custom domain (e.g., `estire.com`) is highly recommended over the default `vercel.app` domain.
1.  Go to **Settings** -> **Domains** in your Vercel project.
2.  Add your custom domain and follow the DNS configuration instructions.

## Step 7: Apply for AdSense through Google
Once your site is live on a public domain:
1.  Go to Google AdSense.
2.  Add your site URL.
3.  Wait for approval (can take a few days to 2 weeks).
4.  Once approved:
    *   Get your Publisher ID and Slot IDs.
    *   Update your code (`app/layout.tsx`, etc.).
    *   Push the changes.
    *   Set `IS_ADSENSE_ACTIVE` to `true` in `utils/constants.ts` (or better yet, switch it to use an Env Var like `NEXT_PUBLIC_ENABLE_ADS` for easier toggling in Vercel).
