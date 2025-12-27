import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Footer from "@/components/Footer";
import { FileProvider } from "@/context/FileContext";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "EstiRE | 不動産リフォーム積算AI & 実務計算プラットフォーム",
    template: "%s | EstiRE",
  },
  description: "AIによる積算価格シミュレーション「EstiRE」。概要書をアップロードするだけで概算を作成。今後は土地建物按分・固定資産税・諸費用計算など、不動産投資に必要な全機能を網羅する総合ツールへ順次拡大予定。",
  keywords: ["不動産", "積算価格", "査定", "シミュレーション", "AI", "路線価", "原価法", "無料ツール", "リフォーム", "不動産投資"],
  authors: [{ name: "EstiRE Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://sekisan-app.vercel.app"),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    title: "EstiRE | 不動産リフォーム積算AI & 実務計算プラットフォーム",
    description: "AIによる積算価格シミュレーション「EstiRE」。概要書をアップロードするだけで概算を作成。今後は土地建物按分・固定資産税・諸費用計算など、不動産投資に必要な全機能を網羅する総合ツールへ順次拡大予定。",
    siteName: "EstiRE",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "EstiRE | 不動産リフォーム積算AI & 実務計算プラットフォーム",
    description: "AIによる積算価格シミュレーション「EstiRE」。概要書をアップロードするだけで概算を作成。今後は土地建物按分・固定資産税・諸費用計算など、不動産投資に必要な全機能を網羅する総合ツールへ順次拡大予定。",
    images: ["/logo.png"],
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
        suppressHydrationWarning
      >
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7926468542755717"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <FileProvider>
          <div className="flex-grow">
            {children}
          </div>
        </FileProvider>
        <div className="print:hidden">
          <Footer />
        </div>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
