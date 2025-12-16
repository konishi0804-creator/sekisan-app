This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Setup (Vertex AI)

To use the document analysis features, you must configure Google Cloud Vertex AI access.

1. **Create `.env.local`** (This file is ignored by git)
   Run one of the following commands in your terminal:

   **Windows (PowerShell):**
   ```powershell
   copy .env.local.example .env.local
   ```
   **Mac/Linux:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Configure Variables**
   Open `.env.local` and set your Google Cloud Project ID and Region.
   *You can find your Project ID in the [Google Cloud Console](https://console.cloud.google.com/).*

   ```env
   # .env.local
   GOOGLE_CLOUD_PROJECT=your-project-id-here
   GOOGLE_CLOUD_LOCATION=us-central1
   NODE_ENV=development
   ```

3. **Authentication (Local Development)**
   Ensue you are authenticated with Google Cloud SDK:
   ```powershell
   gcloud auth application-default login
   ```


## Windows / VS Codeでの起動手順

1. **VS Codeでプロジェクトを開く**
   - フォルダ `sekisan-app` を開いてください。

2. **ターミナルを開く**
   - メニューの `Terminal` > `New Terminal` をクリック。

3. **依存関係のインストール**（初回のみ）
   ```powershell
   npm install
   ```

4. **開発サーバーの起動**
   ```powershell
   npm run dev
   ```

5. **ブラウザで確認**
   - [http://localhost:3000](http://localhost:3000) を開く。

> [!IMPORTANT]
> `.env.local` を変更した場合は、必ずターミナルで `Ctrl+C` を押してサーバーを停止し、再度 `npm run dev` で起動し直してください。


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
