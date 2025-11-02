import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        net: false,
        tls: false,
        fs: false,
        dns: false,
        child_process: false,
        crypto: false,
        stream: false,
        os: false,
        path: false,
      }
    }
    return config
  },
  // Updated for Next.js 15
  serverExternalPackages: ['mongodb'],
}

export default nextConfig
