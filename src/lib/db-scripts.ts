import { connectDB } from '@/db/mongo'

export async function getUserById(id: number) {
  const db = await connectDB()
  return db.collection('users').findOne({ id })
}

export async function getUserByEmail(email: string) {
  const db = await connectDB()
  return db.collection('users').findOne({ email })
}

export async function getAccountsByBank(customerId: string, financialInstitutionId: string) {
  const db = await connectDB()
  return db.collection('accounts').find({ customerId, financialInstitutionId }).toArray()
}

export async function getAllUserTransactions(customerId: string) {
  const db = await connectDB()

  const userAccounts = await db
    .collection('accounts')
    .find({ customerId })
    .project({ id: 1 })
    .toArray()

  const accountIds = userAccounts.map((a: any) => a.id)

  return db
    .collection('transactions')
    .find({ accountId: { $in: accountIds } })
    .sort({ bookedDate: -1 })
    .toArray()
}

export async function getTransactionsForAccount(accountId: string) {
  const db = await connectDB()
  return db
    .collection('transactions')
    .find({ accountId })
    .sort({ bookedDate: -1 })
    .toArray()
}

export async function getTransactionsInDateRange(accountId: string, startDate: Date, endDate: Date) {
  const db = await connectDB()
  return db
    .collection('transactions')
    .find({
      accountId,
      bookedDate: { $gte: startDate, $lte: endDate },
    })
    .sort({ bookedDate: -1 })
    .toArray()
}

export async function getUserTotalBalance(customerId: string) {
  const db = await connectDB()

  const result = await db
    .collection('accounts')
    .aggregate([
      { $match: { customerId } },
      { $group: { _id: null, total: { $sum: '$availableAmount' } } },
    ])
    .toArray()

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

