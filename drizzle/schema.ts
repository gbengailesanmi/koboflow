import { pgTable, serial, text, varchar, json, timestamp } from 'drizzle-orm/pg-core'
import { integer as pgInteger } from 'drizzle-orm/pg-core'

/**
 * Users table stores user account information and authentication data.
 * This is the main table for user management and authentication.
 */
export const users = pgTable('users', {
  /** Auto-incrementing primary key */
  id: serial('id').primaryKey(),
  /** User's full name (optional during registration) */
  name: varchar('name', { length: 100 }),
  /** User's email address - used for login and must be unique */
  email: varchar('email', { length: 255 }).notNull().unique(),
  /** Bcrypt hashed password */
  password: text('password').notNull(),
  /** Unique customer identifier (UUID v4 format) for Tink integration */
  customerId: varchar('customer_id', { length: 36 }).notNull().unique()
})

// ----------- ACCOUNTS TABLE -----------
/**
 * Accounts table stores financial account information aggregated from Tink API.
 * Each account belongs to a user and contains balance and identification information.
 */
export const accounts = pgTable('accounts', {
  /** Unique account identifier from Tink API */
  id: varchar('id').primaryKey(),
  /** References users.customerId - links account to user */
  customerId: varchar('customer_id').notNull(),
  /** Human-readable account name (e.g., "Main Checking") */
  name: varchar('name').notNull(),
  /** Account type (CHECKING, SAVINGS, CREDIT_CARD, etc.) */
  type: varchar('type').notNull(),
  /** Booked balance - unscaled integer value */
  bookedAmount: integer('booked_amount').notNull(),
  /** Decimal places for booked amount (e.g., 2 for cents) */
  bookedScale: integer('booked_scale').notNull(),
  /** ISO 4217 currency code for booked balance */
  bookedCurrency: varchar('booked_currency').notNull(),
  /** Available balance - unscaled integer value */
  availableAmount: integer('available_amount').notNull(),
  /** Decimal places for available amount */
  availableScale: integer('available_scale').notNull(),
  /** ISO 4217 currency code for available balance */
  availableCurrency: varchar('available_currency').notNull(),
  /** JSON object containing bank-specific identifiers (IBAN, sort code, etc.) */
  identifiers: json('identifiers').notNull(),
  /** Timestamp of last data synchronization from Tink */
  lastRefreshed: timestamp('last_refreshed').notNull(),
  /** Bank/financial institution identifier */
  financialInstitutionId: varchar('financial_institution_id').notNull(),
  /** Customer segment classification (RETAIL, CORPORATE, etc.) */
  customerSegment: varchar('customer_segment').notNull(),
})

// ----------- TRANSACTIONS TABLE -----------
/**
 * Transactions table stores financial transaction data for all connected accounts.
 * Transactions are linked to accounts and contain detailed financial information.
 */
export const transactions = pgTable('transactions', {
  /** Unique transaction identifier from Tink API */
  id: varchar('id').primaryKey(),
  /** References accounts.id - links transaction to account */
  accountId: varchar('account_id').notNull().references(() => accounts.id),
  /** References users.customerId - links transaction to user */
  customerId: varchar('customer_id').notNull(),
  /** Transaction amount as unscaled integer (negative for debits, positive for credits) */
  unscaledValue: integer('unscaled_value').notNull(),
  /** Decimal places for amount (e.g., 2 for cents) */
  scale: integer('scale').notNull(),
  /** ISO 4217 currency code for transaction */
  currencyCode: varchar('currency_code').notNull(),
  /** JSON object with transaction descriptions (display, original, enriched) */
  descriptions: json('descriptions').notNull(),
  /** Date when transaction was booked by the bank */
  bookedDate: timestamp('booked_date').notNull(),
  /** JSON object with transaction identifiers and references */
  identifiers: json('identifiers').notNull(),
  /** JSON array with transaction type classifications */
  types: json('types').notNull(),
  /** Transaction status (BOOKED, PENDING, CANCELLED, FAILED) */
  status: varchar('status').notNull(),
  /** Whether transaction details can be modified by provider */
  providerMutability: varchar('provider_mutability').notNull(),
})

/**
 * Helper function to define integer columns.
 * This is needed because of a naming conflict between Drizzle's integer function
 * and the imported pgInteger function.
 * 
 * @param name - Column name
 * @returns Integer column definition
 */
function integer(name: string) {
  return pgInteger(name)
}
