import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ecotrack/shared"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.ecotrack.app" },
      { protocol: "https", hostname: "api.mapbox.com" },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
