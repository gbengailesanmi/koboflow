import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  serverExternalPackages: ['mongodb', 'bcrypt'],
}

export default nextConfig
