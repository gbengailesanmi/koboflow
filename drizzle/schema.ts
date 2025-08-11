import { pgTable, integer as pgInteger, serial, text, varchar, json, timestamp, unique } from 'drizzle-orm/pg-core'

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
  uniqueId: varchar('unique_id').notNull().unique(),
  customerId: varchar('customer_id').notNull(),
  balance: varchar('balance').notNull(),
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
  customerSegment: varchar('customer_segment').notNull()
})

// ----------- TRANSACTIONS TABLE -----------
export const transactions = pgTable('transactions', {
  id: varchar('id').primaryKey(),
  accountUniqueId: varchar('account_unique_id').notNull().references(() => accounts.uniqueId),
  accountId: varchar('account_id').notNull(),
  customerId: varchar('customer_id').notNull(),
  amount: varchar('amount').notNull(),
  unscaledValue: integer('unscaled_value').notNull(),
  scale: integer('scale').notNull(),
  narration: text('narration').notNull(),
  currencyCode: varchar('currency_code').notNull(),
  descriptions: json('descriptions').notNull(),
  bookedDate: timestamp('booked_date').notNull(),
  identifiers: json('identifiers').notNull(),
  types: json('types').notNull(),
  status: varchar('status').notNull(),
  providerMutability: varchar('provider_mutability').notNull(),
}, (trx) => ({
  uniqueTransaction: unique('unique_transaction_constraint').on(
    trx.customerId,
    trx.accountUniqueId,
    trx.bookedDate,
    trx.amount,
    trx.narration
  ),
}))

function integer(name: string) {
  return pgInteger(name)
}
