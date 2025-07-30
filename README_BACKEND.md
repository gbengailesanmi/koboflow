# Backend Summary - Consolidate Budget E2E

## Quick Overview

This is a **Next.js full-stack application** that consolidates banking data from multiple accounts using the Tink API. Here's what the backend looks like:

## Architecture

**Framework**: Next.js 15.4.1 with App Router
**Database**: PostgreSQL with Drizzle ORM  
**Authentication**: JWT tokens + HTTP-only cookies
**External API**: Tink Banking API for account/transaction data

## Key Backend Components

### 1. Database Schema (3 tables)
- **Users**: Authentication & customer data
- **Accounts**: Bank account information from Tink
- **Transactions**: Transaction history from connected accounts

### 2. API Endpoints
- **`/callback`** - Handles OAuth flow with Tink API
- **Server Actions** - Authentication (signup/login) 

### 3. Core Services
- **Database**: `src/lib/db.ts` - Drizzle ORM connection
- **Sessions**: `src/lib/session.ts` - JWT token management  
- **Tink Client**: `src/app/api/tink/tink.js` - Banking API integration

## Data Flow

1. **Authentication**: User signup/login → JWT token → HTTP-only cookie
2. **Bank Connection**: OAuth with Tink → callback processes auth code → fetch & store banking data
3. **Dashboard**: Display consolidated account balances and transactions

## Security Features

- Password hashing (bcrypt)
- JWT tokens with expiration
- HTTP-only cookies
- Input validation (Zod schemas)
- Environment-based configuration

## Tech Stack Highlights

- **TypeScript** for type safety
- **Drizzle ORM** for database operations
- **bcrypt** for password security
- **jose** for JWT handling
- **Zod** for runtime validation

The backend is well-structured for a financial application with proper security measures and clean separation of concerns using Next.js App Router patterns.