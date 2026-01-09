# Backend API Service

Express.js API service for Koboflow.

## Setup

```bash
# Install dependencies
yarn install

# Set up environment variables
cp .env.example .env

# Run in development
yarn dev

# Build for production
yarn build

# Run production
yarn start
```

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User signup
- `POST /api/auth/logout` - User logout
- `GET /api/budget` - Get user budget
- `POST /api/budget` - Create/update budget
- `GET /api/transactions` - Get transactions
- `GET /api/settings` - Get user settings
- `POST /api/settings` - Update user settings

## TODO

- [ ] Migrate API routes from Next.js app
- [ ] Set up database connections
- [ ] Implement authentication middleware
- [ ] Add request validation
- [ ] Set up logging
- [ ] Add comprehensive error handling
