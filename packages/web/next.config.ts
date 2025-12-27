import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@money-mapper/shared'],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://money-mapper-production.up.railway.app/api/:path*',
      },
    ]
  },
}

export default nextConfig
