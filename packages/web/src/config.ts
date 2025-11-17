const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  // Backend API
  BACKEND_URL: process.env.BACKEND_URL || '',

  // Tink Integration
  ADD_ACCOUNT_URL: process.env.ADD_ACCOUNT_URL
} as const

export default config
