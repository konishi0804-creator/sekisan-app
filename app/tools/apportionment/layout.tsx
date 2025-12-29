import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "土地建物評価額按分シミュレーション",
    description: "固定資産税評価額から土地と建物の価格内訳を算出します。",
};

export default function ApportionmentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
