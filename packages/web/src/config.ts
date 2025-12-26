const config = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001',

  MONO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY || 'test_pk_ivztmi7aqts45itl9jgx',
} as const

export default config
