import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  experimental: {
    // /api/admin/upload accepts videos up to 15MB, but bodies passing through
    // the middleware ("proxy" in Next 16) are truncated at the default 10MB →
    // FormData parse failure (500). Raise the proxy cap above the upload cap.
    // NOTE: top-level `middlewareClientMaxBodySize` is NOT a valid key on
    // next@16.1.3 — the live option is experimental.proxyClientMaxBodySize.
    proxyClientMaxBodySize: 16 * 1024 * 1024, // 16MB (bytes)
  },
};

export default nextConfig;
