const config = {
  NODE_ENV: process.env.NODE_ENV,
  
  IS_PRODUCTION: process.env.NODE_ENV === 'production',

  NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL,

  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,

  MONO_PUBLIC_KEY: process.env.NEXT_PUBLIC_MONO_PUBLIC_KEY,
  
  MONGODB_URI: process.env.MONGODB_URI!,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME,

  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID
} as const

export default config
