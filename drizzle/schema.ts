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
  id: varchar('id').primaryKey(),
  customerId: varchar('customer_id').notNull(),
  name: varchar('name').notNull(),
  type: varchar('type').notNull(),
  bookedAmount: integer('booked_amount').notNull(),
  bookedScale: integer('booked_scale').notNull(),
  bookedCurrency: varchar('booked_currency').notNull(),
  availableAmount: integer('available_amount').notNull(),
  availableScale: integer('available_scale').notNull(),
  availableCurrency: varchar('available_currency').notNull(),
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
  unscaledValue: integer('unscaled_value').notNull(),
  scale: integer('scale').notNull(),
  currencyCode: varchar('currency_code').notNull(),
  descriptions: json('descriptions').notNull(),
  bookedDate: timestamp('booked_date').notNull(),
  identifiers: json('identifiers').notNull(),
  types: json('types').notNull(),
  status: varchar('status').notNull(),
  providerMutability: varchar('provider_mutability').notNull(),
})

function integer(name: string) {
  return pgInteger(name)
}

