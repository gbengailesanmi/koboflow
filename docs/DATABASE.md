# Database Schema Documentation

This document provides comprehensive documentation for the PostgreSQL database schema used in the Consolidate Budget E2E application.

## Database Overview

The application uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations. The schema is designed to support financial data aggregation from multiple sources while maintaining data integrity and performance.

## Database Configuration

### Connection
- **Driver**: PostgreSQL
- **ORM**: Drizzle ORM
- **Migration Tool**: Drizzle Kit
- **Connection Pooling**: Built-in PostgreSQL connection pooling

### Environment Variables
```bash
DATABASE_URL="postgresql://username:password@localhost:5432/consolidate_budget"
```

## Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│    users    │       │  accounts   │       │transactions │
│             │       │             │       │             │
│ id (PK)     │       │ id (PK)     │       │ id (PK)     │
│ name        │       │ customerId  │───────│ accountId   │
│ email       │       │ name        │       │ customerId  │
│ password    │       │ type        │       │ unscaledValue│
│ customerId  │───────│ ...         │       │ scale       │
│             │       │             │       │ ...         │
└─────────────┘       └─────────────┘       └─────────────┘
```

## Table Schemas

### 1. Users Table

Stores user account information and authentication data.

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) NOT NULL UNIQUE,
  password TEXT NOT NULL,
  customer_id VARCHAR(36) NOT NULL UNIQUE
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | SERIAL | PRIMARY KEY | Auto-incrementing user identifier |
| `name` | VARCHAR(100) | - | User's full name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User's email address (login credential) |
| `password` | TEXT | NOT NULL | Bcrypt hashed password |
| `customer_id` | VARCHAR(36) | NOT NULL, UNIQUE | Unique customer identifier (UUID format) |

#### Indexes
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_customer_id ON users(customer_id);
```

#### Business Rules
- Email must be unique across all users
- Customer ID is generated using UUID v4 format
- Passwords are hashed using bcrypt with salt rounds
- Name field is optional during registration

### 2. Accounts Table

Stores financial account information aggregated from Tink API.

```sql
CREATE TABLE accounts (
  id VARCHAR PRIMARY KEY,
  customer_id VARCHAR NOT NULL,
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  booked_amount INTEGER NOT NULL,
  booked_scale INTEGER NOT NULL,
  booked_currency VARCHAR NOT NULL,
  available_amount INTEGER NOT NULL,
  available_scale INTEGER NOT NULL,
  available_currency VARCHAR NOT NULL,
  identifiers JSON NOT NULL,
  last_refreshed TIMESTAMP NOT NULL,
  financial_institution_id VARCHAR NOT NULL,
  customer_segment VARCHAR NOT NULL
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | Unique account identifier from Tink |
| `customer_id` | VARCHAR | NOT NULL | References users.customer_id |
| `name` | VARCHAR | NOT NULL | Account display name |
| `type` | VARCHAR | NOT NULL | Account type (CHECKING, SAVINGS, etc.) |
| `booked_amount` | INTEGER | NOT NULL | Booked balance unscaled value |
| `booked_scale` | INTEGER | NOT NULL | Decimal places for booked amount |
| `booked_currency` | VARCHAR | NOT NULL | Currency code for booked balance |
| `available_amount` | INTEGER | NOT NULL | Available balance unscaled value |
| `available_scale` | INTEGER | NOT NULL | Decimal places for available amount |
| `available_currency` | VARCHAR | NOT NULL | Currency code for available balance |
| `identifiers` | JSON | NOT NULL | Account identifiers (IBAN, sort code, etc.) |
| `last_refreshed` | TIMESTAMP | NOT NULL | Last data synchronization timestamp |
| `financial_institution_id` | VARCHAR | NOT NULL | Bank/institution identifier |
| `customer_segment` | VARCHAR | NOT NULL | Customer segment classification |

#### Indexes
```sql
CREATE INDEX idx_accounts_customer_id ON accounts(customer_id);
CREATE INDEX idx_accounts_financial_institution ON accounts(financial_institution_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_last_refreshed ON accounts(last_refreshed);
```

#### Account Types
- `CHECKING` - Checking/current account
- `SAVINGS` - Savings account
- `CREDIT_CARD` - Credit card account
- `LOAN` - Loan account
- `INVESTMENT` - Investment account
- `PENSION` - Pension account
- `MORTGAGE` - Mortgage account

#### Identifiers JSON Structure
```json
{
  "sortCode": {
    "code": "123456",
    "accountNumber": "12345678"
  },
  "financialInstitution": {
    "accountNumber": "12345678",
    "referenceNumbers": {}
  },
  "iban": {
    "iban": "GB82WEST12345698765432",
    "bban": "WEST12345698765432"
  }
}
```

#### Business Rules
- Account ID is provided by Tink and used as primary key
- Monetary amounts are stored as unscaled integers with scale information
- Last refreshed timestamp tracks data freshness
- Identifiers contain bank-specific account information

### 3. Transactions Table

Stores financial transaction data for all connected accounts.

```sql
CREATE TABLE transactions (
  id VARCHAR PRIMARY KEY,
  account_id VARCHAR NOT NULL REFERENCES accounts(id),
  customer_id VARCHAR NOT NULL,
  unscaled_value INTEGER NOT NULL,
  scale INTEGER NOT NULL,
  currency_code VARCHAR NOT NULL,
  descriptions JSON NOT NULL,
  booked_date TIMESTAMP NOT NULL,
  identifiers JSON NOT NULL,
  types JSON NOT NULL,
  status VARCHAR NOT NULL,
  provider_mutability VARCHAR NOT NULL
);
```

#### Columns

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY | Unique transaction identifier from Tink |
| `account_id` | VARCHAR | NOT NULL, FK | References accounts.id |
| `customer_id` | VARCHAR | NOT NULL | References users.customer_id |
| `unscaled_value` | INTEGER | NOT NULL | Transaction amount (negative for debits) |
| `scale` | INTEGER | NOT NULL | Decimal places for amount |
| `currency_code` | VARCHAR | NOT NULL | Transaction currency (ISO 4217) |
| `descriptions` | JSON | NOT NULL | Transaction descriptions and metadata |
| `booked_date` | TIMESTAMP | NOT NULL | Transaction booking date |
| `identifiers` | JSON | NOT NULL | Transaction identifiers and references |
| `types` | JSON | NOT NULL | Transaction type classifications |
| `status` | VARCHAR | NOT NULL | Transaction status |
| `provider_mutability` | VARCHAR | NOT NULL | Whether transaction can be modified |

#### Indexes
```sql
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_customer_id ON transactions(customer_id);
CREATE INDEX idx_transactions_booked_date ON transactions(booked_date);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_amount ON transactions(unscaled_value);
```

#### Transaction Status Values
- `BOOKED` - Transaction is confirmed and booked
- `PENDING` - Transaction is pending confirmation
- `CANCELLED` - Transaction was cancelled
- `FAILED` - Transaction failed to process

#### Descriptions JSON Structure
```json
{
  "display": "Coffee Shop Purchase",
  "original": "COFFEE SHOP 123 MAIN ST",
  "enriched": "Coffee & Beverages"
}
```

#### Types JSON Structure
```json
[
  "PURCHASE",
  "RETAIL",
  "FOOD_AND_DRINK"
]
```

#### Identifiers JSON Structure
```json
{
  "reference": "ref_123456",
  "providerTransactionId": "provider_txn_123",
  "endToEndId": "e2e_123"
}
```

#### Business Rules
- Transaction amounts are stored as signed integers (negative = debit, positive = credit)
- Booked date represents when transaction was processed by bank
- Types array contains hierarchical transaction categorization
- Provider mutability indicates if transaction details can be updated

## Data Relationships

### Foreign Key Constraints

```sql
-- Accounts reference users via customer_id (logical foreign key)
-- Transactions reference accounts
ALTER TABLE transactions ADD CONSTRAINT fk_transactions_account 
  FOREIGN KEY (account_id) REFERENCES accounts(id);

-- Logical relationships (not enforced by FK constraints):
-- accounts.customer_id -> users.customer_id
-- transactions.customer_id -> users.customer_id
```

### Referential Integrity

- **Users to Accounts**: One-to-many via `customer_id`
- **Accounts to Transactions**: One-to-many via `account_id`
- **Users to Transactions**: One-to-many via `customer_id` (derived)

## Data Types and Conventions

### Monetary Values
All monetary values use the unscaled integer approach:
- Store amount as integer (e.g., 150000 for $1,500.00)
- Store scale as integer (e.g., 2 for 2 decimal places)
- Calculate actual value: `unscaled_value / (10 ^ scale)`

### JSON Fields
JSON fields are used for flexible, structured data:
- **identifiers**: Bank-specific identification data
- **descriptions**: Various forms of transaction descriptions
- **types**: Hierarchical transaction categorization

### Timestamps
All timestamps are stored in UTC format using PostgreSQL's TIMESTAMP type.

### Currency Codes
Currency codes follow ISO 4217 standard (e.g., USD, EUR, GBP).

## Performance Considerations

### Indexing Strategy

1. **Primary Keys**: Automatic indexes on all primary keys
2. **Foreign Keys**: Indexes on account_id for transactions
3. **Query Optimization**: Indexes on frequently queried columns
4. **Date Ranges**: Index on booked_date for transaction queries
5. **Customer Queries**: Indexes on customer_id fields

### Query Patterns

Common query patterns and their optimizations:

```sql
-- Get user's accounts
SELECT * FROM accounts WHERE customer_id = ?;
-- Optimized by: idx_accounts_customer_id

-- Get account transactions
SELECT * FROM transactions 
WHERE account_id = ? 
ORDER BY booked_date DESC 
LIMIT 50;
-- Optimized by: idx_transactions_account_id, idx_transactions_booked_date

-- Get recent transactions for user
SELECT t.* FROM transactions t
JOIN accounts a ON t.account_id = a.id
WHERE a.customer_id = ?
AND t.booked_date >= ?
ORDER BY t.booked_date DESC;
-- Optimized by: idx_accounts_customer_id, idx_transactions_account_id, idx_transactions_booked_date
```

## Data Migration and Schema Management

### Drizzle Kit Commands

```bash
# Generate migration files
npx drizzle-kit generate

# Push schema changes to database
npx drizzle-kit push

# Open Drizzle Studio for database management
npx drizzle-kit studio
```

### Schema Versioning

Schema changes are managed through Drizzle migrations:
1. Modify schema in `drizzle/schema.ts`
2. Generate migration with `drizzle-kit generate`
3. Apply migration with `drizzle-kit push`

## Backup and Recovery

### Backup Strategy

```bash
# Full database backup
pg_dump -h localhost -U username -d consolidate_budget > backup.sql

# Schema-only backup
pg_dump -h localhost -U username -d consolidate_budget --schema-only > schema.sql

# Data-only backup
pg_dump -h localhost -U username -d consolidate_budget --data-only > data.sql
```

### Recovery Strategy

```bash
# Restore full backup
psql -h localhost -U username -d consolidate_budget < backup.sql

# Restore schema only
psql -h localhost -U username -d consolidate_budget < schema.sql
```

## Security Considerations

### Data Protection

1. **Passwords**: Hashed using bcrypt with salt
2. **Sensitive Data**: No plaintext storage of sensitive information
3. **Access Control**: Database access restricted to application only
4. **Encryption**: TLS encryption for database connections in production

### Privacy Compliance

- Personal data is minimized and necessary for functionality
- User data can be purged on account deletion
- Financial data is handled according to PCI DSS guidelines
- GDPR compliance for EU users

## Monitoring and Maintenance

### Performance Monitoring

Monitor these key metrics:
- Query execution times
- Index usage statistics
- Connection pool utilization
- Database size growth
- Lock contention

### Maintenance Tasks

Regular maintenance includes:
- Index rebuilding (if needed)
- Statistics updates
- Vacuum operations
- Log rotation
- Backup verification

## Troubleshooting

### Common Issues

1. **Connection Pool Exhaustion**
   - Monitor active connections
   - Adjust pool size settings
   - Check for connection leaks

2. **Slow Queries**
   - Use EXPLAIN ANALYZE
   - Check index usage
   - Consider query optimization

3. **Disk Space**
   - Monitor database size
   - Implement data retention policies
   - Archive old transaction data

### Debug Queries

```sql
-- Check database connections
SELECT * FROM pg_stat_activity;

-- Check table sizes
SELECT schemaname,tablename,pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT schemaname,tablename,indexname,idx_tup_read,idx_tup_fetch 
FROM pg_stat_user_indexes ORDER BY idx_tup_read DESC;
```

## Future Enhancements

Planned schema enhancements:
- **Categories Table**: User-defined transaction categories
- **Budgets Table**: Budget tracking and limits
- **Goals Table**: Financial goals and targets
- **Notifications Table**: System notifications and alerts
- **Audit Log**: Change tracking for compliance