import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ts-ignore
  experimental: {
    serverComponentsExternalPackages: ["pdfjs-dist"],
  },
};

export default nextConfig;
