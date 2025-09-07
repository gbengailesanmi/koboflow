import { db } from './db'
import { users, accounts, transactions } from '@/../drizzle/schema'
import { eq, and, gte, lte, desc, asc, inArray, sql } from 'drizzle-orm'


export async function getUserById(id: number) {
  return db.select().from(users).where(eq(users.id, id)).then(rows => rows[0] ?? null)
}

export async function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email)).then(rows => rows[0] ?? null)
}

export async function getAccountsByBank(customerId: string, financialInstitutionId: string) {
  return db.select().from(accounts).where(
    and(eq(accounts.customerId, customerId), eq(accounts.financialInstitutionId, financialInstitutionId))
  )
}

export async function getAllUserTransactions(customerId: string) {
  const userAccounts = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(eq(accounts.customerId, customerId))

  const accountIds = userAccounts.map(a => a.id)

  return db
    .select()
    .from(transactions)
    .where(inArray(transactions.accountId, accountIds))
    .orderBy(desc(transactions.bookedDate))
}

export async function getTransactionsForAccount(accountId: string) {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.accountId, accountId))
    .orderBy(desc(transactions.bookedDate))
}

export async function getTransactionsInDateRange(accountId: string, startDate: Date, endDate: Date) {
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.accountId, accountId),
        gte(transactions.bookedDate, startDate),
        lte(transactions.bookedDate, endDate)
      )
    )
    .orderBy(desc(transactions.bookedDate))
}

export async function getUserTotalBalance(customerId: string) {
  const result = await db
    .select({ total: sql<number>`SUM(${accounts.availableAmount})` })
    .from(accounts)
    .where(eq(accounts.customerId, customerId))

  return result[0]?.total ?? 0
}

// export async function getSpendingSummary(customerId: string, startDate: Date, endDate: Date) {
//   const userAccounts = await db
//     .select({ id: accounts.id })
//     .from(accounts)
//     .where(eq(accounts.customerId, customerId))

//   const accountIds = userAccounts.map(a => a.id)

//   return db
//     .select({
//       totalSpent: sql<number>`SUM(${transactions.bookedDate})`,
//     })
//     .from(transactions)
//     .where(
//       and(
//         inArray(transactions.accountId, accountIds),
//         lte(transactions.amount, 0), // spending is negative
//         gte(transactions.bookedDate, startDate),
//         lte(transactions.bookedDate, endDate)
//       )
//     )
// }

// export async function getUniqueTransactionDescriptions(userId: string) {
//   const userAccounts = await db
//     .select({ id: accounts.id })
//     .from(accounts)
//     .where(eq(accounts.userId, userId))

//   const accountIds = userAccounts.map(a => a.id)

//   return db
//     .selectDistinctOn([transactions.description])
//     .from(transactions)
//     .where(inArray(transactions.accountId, accountIds))
// }

