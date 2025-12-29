import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "積算価格計算シミュレーション",
    description: "AIを活用した不動産積算価格計算ツールです。",
};

export default function EstimateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
