/* eslint-disable no-process-env */

const config = {
  NODE_ENV: process.env.NODE_ENV === 'development',
  API: {
    BACKEND_PORT: process.env.BACKEND_PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGO_DB_NAME: process.env.MONGO_DB_NAME,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    JWT_SECRET: process.env.JWT_SECRET,
    FROM_EMAIL: process.env.FROM_EMAIL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    TINK_CLIENT_ID: process.env.TINK_CLIENT_ID,
    TINK_CLIENT_SECRET: process.env.TINK_CLIENT_SECRET,
    FRONTEND_URL: process.env.FRONTEND_URL,
    FRONTEND_PORT: process.env.FRONTEND_PORT,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI
  }
}

export default config