import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Silence "inferred workspace root" warning — the project root has a stale
  // package-lock.json without a matching package.json (used to be a single workspace).
  turbopack: {
    root: path.join(import.meta.dirname ?? __dirname, "."),
  },
  // Allow local IP access for testing on mobile devices
  allowedDevOrigins: ['192.168.31.106'],
} as any;

export default nextConfig;
