import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    resolveAlias: {
      net: {},
      tls: {},
      fs: {},
      dns: {},
      path: {},
      os: {},
    },
  },
};

export default nextConfig;
