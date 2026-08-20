import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Sell-your-vehicle photo uploads: up to 15 images x ~5MB
      bodySizeLimit: "80mb",
    },
  },
};

export default nextConfig;
