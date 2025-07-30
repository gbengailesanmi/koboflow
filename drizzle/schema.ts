import { pgTable, serial, text, varchar, json, timestamp } from 'drizzle-orm/pg-core'
import { integer as pgInteger } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  customerId: varchar('customer_id', { length: 36 }).notNull().unique()
})

// ----------- ACCOUNTS TABLE -----------

export const accounts = pgTable('accounts', {
  id: varchar('id').primaryKey(),             // account id from Tink
  customerId: varchar('customer_id').notNull(),
  name: varchar('name').notNull(),
  type: varchar('type').notNull(),

  // Flatten booked balance: store as integer (scaled) and currency
  bookedAmount: integer('booked_amount').notNull(),
  bookedScale: integer('booked_scale').notNull(),
  bookedCurrency: varchar('booked_currency').notNull(),

  // Flatten available balance: same as above
  availableAmount: integer('available_amount').notNull(),
  availableScale: integer('available_scale').notNull(),
  availableCurrency: varchar('available_currency').notNull(),

  // Identifiers (JSON to capture variable structure)
  identifiers: json('identifiers').notNull(),

  lastRefreshed: timestamp('last_refreshed').notNull(),
  financialInstitutionId: varchar('financial_institution_id').notNull(),
  customerSegment: varchar('customer_segment').notNull(),
})

// ----------- TRANSACTIONS TABLE -----------

export const transactions = pgTable('transactions', {
  id: varchar('id').primaryKey(),
  accountId: varchar('account_id').notNull().references(() => accounts.id),
  customerId: varchar('customer_id').notNull(),

  // Amount fields
  unscaledValue: integer('unscaled_value').notNull(),
  scale: integer('scale').notNull(),
  currencyCode: varchar('currency_code').notNull(),

  // Descriptions stored as JSON (original + display)
  descriptions: json('descriptions').notNull(),

  bookedDate: timestamp('booked_date').notNull(),

  // Identifiers stored as JSON (providerTransactionId etc)
  identifiers: json('identifiers').notNull(),

  // Types stored as JSON (e.g. type)
  types: json('types').notNull(),

  status: varchar('status').notNull(),
  providerMutability: varchar('provider_mutability').notNull(),
})
function integer(name: string) {
  return pgInteger(name)
}

