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
    
    // Ignore optional MongoDB dependencies
    config.externals = [...(config.externals || []), {
      'kerberos': 'commonjs kerberos',
      '@mongodb-js/zstd': 'commonjs @mongodb-js/zstd',
      '@aws-sdk/credential-providers': 'commonjs @aws-sdk/credential-providers',
      'gcp-metadata': 'commonjs gcp-metadata',
      'snappy': 'commonjs snappy',
      'socks': 'commonjs socks',
      'aws4': 'commonjs aws4',
      'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
      'bcrypt': 'commonjs bcrypt',
    }]
    
    return config
  },
  // Updated for Next.js 15
  serverExternalPackages: ['mongodb', 'bcrypt'],
}

export default nextConfig
