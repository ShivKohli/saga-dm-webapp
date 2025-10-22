// ✅ ESM-compatible Next.js config for Vercel alias resolution

import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // 👇 Explicitly resolve the "@" alias to project root
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
