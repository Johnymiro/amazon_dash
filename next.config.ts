import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow images from any domain
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
