import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow local IP access for testing on mobile devices
  allowedDevOrigins: ['192.168.31.106'],
} as any;

export default nextConfig;
