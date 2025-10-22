import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // Enable the "@/..." import alias
    config.resolve.alias["@"] = path.resolve(__dirname);

    // (Optional) You can log resolved aliases during build for debugging
    // console.log("Webpack alias @ →", path.resolve(__dirname));

    return config;
  },

  experimental: {
    // Allow Server Actions (used in your API route)
    serverActions: {
      allowedOrigins: ["*"],
    },
  },

  // Recommended production settings
  reactStrictMode: true,
  swcMinify: true,
};

export default nextConfig;
