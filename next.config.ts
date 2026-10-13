import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3"],
  async rewrites() {
    // Keep previously shared URLs working, including edit-link fragments in the browser.
    return [
      { source: "/editar/:id", destination: "/edit/:id" },
      { source: "/avatares/:id", destination: "/avatars/:id" },
      { source: "/admin/cartoes", destination: "/admin/cards" },
    ];
  },
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }, ...["/admin/:path*", "/edit/:path*", "/editar/:path*", "/api/:path*"].map(source => ({ source, headers: [{ key: "Cache-Control", value: "private, no-store" }] }))];
  },
};

export default config;
