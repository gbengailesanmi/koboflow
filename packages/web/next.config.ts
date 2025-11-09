import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongodb', 'bcrypt'],
  reactStrictMode: false // prevent fetching data twice
}

export default nextConfig
