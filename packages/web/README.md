# Web Frontend (Next.js)

Next.js web application for Money Mapper.

## Setup

```bash
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env.local

# Run in development
yarn dev

# Build for production
yarn build

# Run production
yarn start
```

## Features

- User authentication
- Dashboard with financial overview
- Transaction tracking
- Budget management
- Analytics and insights
- Profile and settings

## Project Structure

```
src/
├── app/                 # Next.js 15 app directory
├── components/          # Reusable components
├── lib/                 # Utilities and helpers
└── providers/           # Context providers
```

## TODO

- [ ] Update imports to use @money-mapper/shared
- [ ] Configure API client to communicate with backend
- [ ] Update authentication to work with backend API
