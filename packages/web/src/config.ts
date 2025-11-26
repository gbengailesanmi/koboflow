const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  // Backend API
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',

  // Tink Integration
  ADD_ACCOUNT_URL: process.env.ADD_ACCOUNT_URL || 
    'https://link.tink.com/1.0/transactions/connect-accounts/?client_id=c2296ba610e54fda8a7769872888a1f6&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fcallback&market=GB&locale=en_US',
} as const

export default config
