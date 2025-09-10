import { insertAccounts, insertTransactions } from './db-insert-helpers'

export async function bulkInsertTinkAccounts(
  accounts: any[],
  customerId: string
) {
  await insertAccounts(accounts, customerId)
}

export async function bulkInsertTinkTransactions(
  transactions: any[],
  customerId: string
) {
  await insertTransactions(transactions, customerId)
}