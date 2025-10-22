// ✅ Fully explicit alias configuration for Next.js 14 + Vercel
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    const rootPath = path.resolve(__dirname);

    // 👇 Define the alias for "@/..." imports
    config.resolve.alias["@"] = rootPath;

    // 👇 Add explicit file extensions to search
    config.resolve.extensions.push(".ts", ".tsx", ".js", ".jsx");

    // (Optional) Debug output during build
    console.log("✅ Webpack alias @ →", rootPath);

    return config;
  },
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
