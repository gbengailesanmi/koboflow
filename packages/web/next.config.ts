import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongodb', 'bcrypt'],
  reactStrictMode: false, // prevent fetching data twice

  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig
