import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Next.js from trying to bundle Node-only packages on the client
  serverExternalPackages: ["@prisma/client", "bcryptjs"],

  // Silence the "Critical dependency" warning from Prisma's dynamic require
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only modules into the client bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
