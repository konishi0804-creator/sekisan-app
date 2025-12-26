import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://esti-re.vercel.app";

    return [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: "monthly",
            priority: 1,
        },
        {
            url: `${baseUrl}/calc`,
            lastModified: new Date(),
            changeFrequency: "weekly",
            priority: 0.8,
        },
    ];
}
