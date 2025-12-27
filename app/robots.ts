import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://sekisan-app.vercel.app";
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: ["/api/"], // Do not crawl API endpoints
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
