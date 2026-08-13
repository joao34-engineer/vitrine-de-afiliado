import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  cacheLife: {
    affiliateCatalog: {
      stale: 60,
      revalidate: 300,
      expire: 900,
    },
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.susercontent.com" },
      { protocol: "https", hostname: "**.shopee.com.br" },
      { protocol: "https", hostname: "**.shopeesz.com" },
    ],
  },
};

export default nextConfig;
