import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "herta-crateral-unprudentially.ngrok-free.dev",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "localhost:3000",
  ],
  async rewrites() {
    return [
      {
        source: "/backend-api/:path*",
        destination: "http://127.0.0.1:8000/:path*",
      },
    ];
  },
};

export default nextConfig;


