import type { NextConfig } from "next";

const config: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  serverExternalPackages: ["better-sqlite3"],
  async headers() {
    return [{
      source: "/(.*)",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }, ...["/admin/:path*", "/editar/:path*", "/api/:path*"].map(source => ({ source, headers: [{ key: "Cache-Control", value: "private, no-store" }] }))];
  },
};

export default config;
