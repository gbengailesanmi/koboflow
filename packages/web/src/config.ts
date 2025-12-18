const config = {
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  // Backend API
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:3001',

  // Mono Integration (Nigerian Banks)
  MONO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY || 'test_pk_ivztmi7aqts45itl9jgx',
} as const

export default config
