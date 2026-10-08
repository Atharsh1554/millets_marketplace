import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Harvest submissions carry phone photos and an optional short video.
      bodySizeLimit: "60mb",
    },
    // proxy.ts runs on dashboard routes; allow harvest photo/video uploads through it.
    proxyClientMaxBodySize: "60mb",
  },
  // Customer pages moved into the /customer dashboard; keep old links working.
  async redirects() {
    return [
      { source: "/cart", destination: "/customer/cart", permanent: false },
      { source: "/checkout", destination: "/customer/checkout", permanent: false },
      { source: "/orders", destination: "/customer/orders", permanent: false },
      { source: "/orders/:id", destination: "/customer/orders/:id", permanent: false },
      { source: "/wishlist", destination: "/customer/wishlist", permanent: false },
      { source: "/admin/users", destination: "/admin/quality-team", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
