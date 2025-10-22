import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Add alias for "@/..." imports
    config.resolve.alias["@"] = path.resolve(__dirname);
    return config;
  },
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
  },
};

export default nextConfig;
