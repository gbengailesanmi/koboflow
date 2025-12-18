/* eslint-disable no-process-env */

const config = {
  BASE_URI: process.env.BASE_URI,
  NODE_ENV: process.env.NODE_ENV,
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  BACKEND_PORT: process.env.BACKEND_PORT,
  //db vars
  MONGODB_URI: process.env.MONGODB_URI,
  MONGO_DB_NAME: process.env.MONGO_DB_NAME,
  // cors stuff
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  //resend stuff
  FROM_EMAIL: process.env.FROM_EMAIL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  // mono vars
  MONO_PUBLIC_KEY: process.env.MONO_PUBLIC_KEY,
  MONO_SECRET_KEY: process.env.MONO_SECRET_KEY,
  MONO_WEBHOOK_SECRET: process.env.MONO_WEBHOOK_SECRET,
  // frontend urls
  FRONTEND_URL: process.env.FRONTEND_URL,
  FRONTEND_PORT: process.env.FRONTEND_PORT,
  // google vars
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
}

export default config