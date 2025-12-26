import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "EstiRE | 不動産積算価格シミュレーション",
        short_name: "EstiRE",
        description: "AI不動産積算評価ツール",
        start_url: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f172a",
        icons: [
            {
                src: "/logo.png",
                sizes: "142x137",
                type: "image/png",
            },
        ],
    };
}
