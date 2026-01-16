const config = {
  NODE_ENV: process.env.NODE_ENV,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  BACKEND_PORT: process.env.BACKEND_PORT,
  MONGODB_URI: process.env.MONGODB_URI,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  FROM_EMAIL: process.env.FROM_EMAIL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  MONO_PUBLIC_KEY: process.env.MONO_PUBLIC_KEY,
  MONO_SECRET_KEY: process.env.MONO_SECRET_KEY,
  FRONTEND_URL: process.env.FRONTEND_URL,
  API_KEY: process.env.API_KEY
}

export default config