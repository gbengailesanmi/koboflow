# Backend Architecture Documentation

## Overview

The `consolidate-budget-e2e` project is a **Next.js full-stack application** that provides budget consolidation functionality by integrating with banking APIs. It follows modern web development practices with a robust backend architecture built on Next.js App Router.

## Technology Stack

### Core Technologies
- **Framework**: Next.js 15.4.1 (React-based full-stack framework)
- **Runtime**: Node.js
- **Language**: TypeScript + JavaScript (mixed)
- **Package Manager**: Yarn

### Database & ORM
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM (v0.44.4)
- **Schema Management**: Drizzle Kit (v0.31.4)
- **Connection Pool**: node-postgres (pg)

### Authentication & Security
- **JWT Library**: jose (v6.0.12)
- **Password Hashing**: bcrypt (v6.0.0)
- **Session Management**: HTTP-only cookies
- **Validation**: Zod (v4.0.13)

### External Integrations
- **Banking API**: Tink API
- **UUID Generation**: uuid (v11.1.0) + uuid-base62

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── tink/          # Tink API integration
│   ├── auth/              # Authentication pages & actions
│   │   └── actions/       # Server actions
│   ├── callback/          # OAuth callback handler
│   └── dashboard/         # Dashboard pages
├── lib/                   # Core utilities
│   ├── db.ts             # Database connection
│   ├── session.ts        # Session management
│   └── definitions.ts    # Type definitions & validation
├── types/                 # TypeScript type definitions
└── hooks/                # React hooks

drizzle/
├── schema.ts             # Database schema definitions
└── migrations/           # Database migrations (generated)
```

## Database Architecture

### Schema Design

The application uses **three main tables** managed by Drizzle ORM:

#### 1. Users Table
```typescript
users = {
  id: serial().primaryKey(),
  name: varchar(100),
  email: varchar(255).notNull().unique(),
  password: text().notNull(),
  customerId: varchar(36).notNull().unique()
}
```

#### 2. Accounts Table
```typescript
accounts = {
  id: varchar().primaryKey(),           // Tink account ID
  customerId: varchar().notNull(),
  name: varchar().notNull(),
  type: varchar().notNull(),
  
  // Flattened balance data
  bookedAmount: integer().notNull(),
  bookedScale: integer().notNull(),
  bookedCurrency: varchar().notNull(),
  availableAmount: integer().notNull(),
  availableScale: integer().notNull(),
  availableCurrency: varchar().notNull(),
  
  // JSON fields for complex data
  identifiers: json().notNull(),
  
  lastRefreshed: timestamp().notNull(),
  financialInstitutionId: varchar().notNull(),
  customerSegment: varchar().notNull()
}
```

#### 3. Transactions Table
```typescript
transactions = {
  id: varchar().primaryKey(),
  accountId: varchar().notNull().references(accounts.id),
  customerId: varchar().notNull(),
  
  // Amount fields (flattened from Tink format)
  unscaledValue: integer().notNull(),
  scale: integer().notNull(),
  currencyCode: varchar().notNull(),
  
  // JSON fields for complex nested data
  descriptions: json().notNull(),      // original + display
  identifiers: json().notNull(),       // provider IDs
  types: json().notNull(),            // transaction type info
  
  bookedDate: timestamp().notNull(),
  status: varchar().notNull(),
  providerMutability: varchar().notNull()
}
```

### Database Configuration

**Connection**: PostgreSQL via connection pooling
```typescript
// src/lib/db.ts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
export const db = drizzle(pool);
```

**Drizzle Config**: 
- Schema: `./drizzle/**/*.ts`
- Migrations: `./drizzle/migrations`
- Dialect: PostgreSQL

## Authentication & Session Management

### Authentication Flow

1. **Signup Process**:
   - User submits form → validates with Zod schema
   - Password hashed with bcrypt (10 rounds)
   - UUID generated for customer ID
   - User record created in database

2. **Login Process**:
   - Credentials validated against database
   - JWT token created with userId + customerId
   - Token stored in HTTP-only cookie (7-day expiration)
   - Redirect to dashboard

3. **Session Validation**:
   - JWT token extracted from cookies
   - Token verified using jose library
   - User data extracted for API requests

### Security Features

- **Password Security**: bcrypt with 10 salt rounds
- **JWT Tokens**: HS256 algorithm, 7-day expiration
- **HTTP-only Cookies**: Secure, path-restricted
- **Input Validation**: Zod schemas for type safety
- **Environment Variables**: Sensitive data externalized

## External API Integration (Tink)

### Tink Banking API

The application integrates with **Tink** for banking data aggregation:

#### OAuth Flow
1. User initiates bank connection
2. Redirected to Tink authorization
3. Authorization code received at callback endpoint
4. Code exchanged for access token
5. Banking data fetched and stored

#### API Client (`src/app/api/tink/tink.js`)
```javascript
// Key functions:
- getTinkTokens()    // OAuth token exchange
- getTinkData()      // Fetch accounts & transactions
```

#### Data Processing (`src/app/callback/route.ts`)
- Transforms Tink API responses to database schema
- Flattens nested balance/amount structures
- Bulk inserts accounts and transactions
- Associates data with customer ID

### Tink API Endpoints Used
- **Token Exchange**: `POST /api/v1/oauth/token`
- **Accounts**: `GET /data/v2/accounts`  
- **Transactions**: `GET /data/v2/transactions`

## API Architecture

### Next.js App Router Patterns

The backend follows **Next.js 13+ App Router** conventions:

#### Route Handlers (`route.ts`)
- **`/callback/route.ts`**: OAuth callback processing
- RESTful HTTP methods (GET, POST, etc.)

#### Server Actions (`'use server'`)
- **`/auth/actions/auth.ts`**: Authentication actions
- Form handling with progressive enhancement
- Direct database operations

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/callback` | GET | Process OAuth callback from Tink |

### Error Handling

- Structured error responses with HTTP status codes
- Try-catch blocks around external API calls
- User-friendly error messages
- Logging for debugging

## Data Flow Architecture

### 1. User Registration/Login
```
User Form → Server Action → Database → JWT → Cookie → Dashboard
```

### 2. Bank Account Connection
```
Dashboard → Tink OAuth → Callback → Token Exchange → API Fetch → Database Storage
```

### 3. Data Display
```
Dashboard → Session Check → Database Query → UI Rendering
```

## Type Safety & Validation

### TypeScript Types
- **Domain Types**: `src/types/account.ts`, `src/types/transactions.ts`
- **API Types**: Tink API response structures
- **Form Types**: Zod-based validation schemas

### Runtime Validation
- **Zod Schemas**: Form input validation
- **Database Constraints**: Primary keys, foreign keys, unique constraints
- **JWT Validation**: Token signature and expiration checks

## Environment Configuration

### Required Environment Variables
```env
DATABASE_URL=          # PostgreSQL connection string
SESSION_SECRET=        # JWT signing secret
TINK_CLIENT_ID=       # Tink OAuth client ID
TINK_CLIENT_SECRET=   # Tink OAuth client secret
BASE_URI=             # Application base URL
PORT=                 # Application port
```

## Development Workflow

### Available Scripts
```json
{
  "dev": "next dev",              // Development server
  "build": "next build",          // Production build
  "start": "next start",          // Production server
  "lint": "next lint",            // ESLint checking
  "db:check": "drizzle-kit studio", // Database GUI
  "db:run": "docker run ..."     // PostgreSQL container
}
```

### Database Development
- **Drizzle Studio**: Web-based database management
- **Schema Changes**: Version-controlled migrations
- **Docker Support**: Containerized PostgreSQL for development

## Scalability Considerations

### Current Architecture Strengths
- **Connection Pooling**: Efficient database connections
- **Stateless Design**: JWT-based sessions
- **Bulk Operations**: Efficient data insertion
- **Modern Stack**: Next.js optimizations

### Potential Improvements
- **Caching Layer**: Redis for session/data caching
- **Database Indexing**: Optimize common queries
- **API Rate Limiting**: Protect against abuse
- **Background Jobs**: Async data processing

## Security Considerations

### Implemented Security Measures
- Password hashing with bcrypt
- JWT tokens with expiration
- HTTP-only cookies
- Input validation
- Environment variable management
- Database parameterized queries (via Drizzle)

### Security Best Practices
- Regular dependency updates
- Principle of least privilege
- Secure cookie configuration
- Error message sanitization

## Monitoring & Logging

### Current Implementation
- Console logging for debugging
- Error catching and reporting
- Database operation logging

### Recommended Additions
- Structured logging (Winston/Pino)
- Application performance monitoring
- Error tracking (Sentry)
- Database query monitoring

---

This architecture provides a solid foundation for a financial aggregation application with room for future enhancements and scaling.