const config = {
  NODE_ENV: process.env.NODE_ENV,
  
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,

  MONO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY,
} as const

export default config
