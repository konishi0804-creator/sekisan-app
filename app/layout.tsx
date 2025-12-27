import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { FileProvider } from "@/context/FileContext";
import { GoogleAdsense } from "@/components/GoogleAdsense";
import { Analytics } from "@vercel/analytics/react";

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
    default: "EstiRE | 不動産積算価格シミュレーション",
    template: "%s | EstiRE",
  },
  description: "AIで不動産（土地・建物）の積算価格を瞬時にシミュレーション。再調達原価法、路線価法、倍率法に対応。全国地価マップ連携機能付き。",
  keywords: ["不動産", "積算価格", "査定", "シミュレーション", "AI", "路線価", "原価法", "無料ツール"],
  authors: [{ name: "EstiRE Team" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://esti-re.vercel.app"),
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: "/",
    title: "EstiRE | 不動産積算価格シミュレーション",
    description: "AIで不動産の積算価格を自動計算。プロフェッショナルな査定レポートを瞬時に作成。",
    siteName: "EstiRE",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "EstiRE | 不動産積算価格シミュレーション",
    description: "AIで不動産の積算価格を自動計算。プロフェッショナルな査定レポートを瞬時に作成。",
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
        <GoogleAdsense pId="ca-pub-XXXXXXXXXXXXXXXX" />
        <FileProvider>
          <div className="flex-grow">
            {children}
          </div>
        </FileProvider>
        <div className="print:hidden">
          <Footer />
        </div>
        <Analytics />
      </body>
    </html>
  );
}
