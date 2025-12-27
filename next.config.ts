import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore - serverExternalPackages is available in newer Next.js versions but types might lag
  serverExternalPackages: ["pdfjs-dist"],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    // Fix for pdfjs-dist 4.x+ standard font packaging
    config.resolve.alias.encoding = false;
    return config;
  },
};

export default nextConfig;
