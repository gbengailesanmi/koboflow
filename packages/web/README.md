# Koboflow Web

Here's the Next.js-based web application. Uses data via the backend module and shared types from shared module.

## Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Styling and componentes: Tailwind CSS + Radix UI
- Caching Strategy: SWR
- Auth: NextAuth

## Getting Started

```bash
yarn
yarn dev
```

App runs on [http://localhost:3000](http://localhost:3000)

## Environment Variables

```env
NEXT_PUBLIC_BACKEND_URL           # Backend API URL
NEXT_PUBLIC_MONO_PUBLIC_KEY       # Mono public key for bank connections
NODE_ENV                          # Environment (development/production)
YARN_PRODUCTION                   # Yarn production mode flag
MONGODB_URI                       # MongoDB connection string
GOOGLE_CLIENT_ID                  # Google OAuth client ID
GOOGLE_CLIENT_SECRET              # Google OAuth client secret
NEXTAUTH_SECRET                   # NextAuth.js secret for session encryption
MONGO_DB_NAME                     # MongoDB database name
API_KEY                           # Internal API key for backend auth
```
