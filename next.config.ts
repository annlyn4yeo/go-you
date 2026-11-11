import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The service worker must never be cached by the browser, so every deploy's version is picked up.
  async headers() {
    return [{ source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, max-age=0" }] }];
  },
};

export default nextConfig;
