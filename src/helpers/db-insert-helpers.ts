import { connectDB } from '@/db/mongo'

const formatAmount = (unscaledValue?: string, scale?: string): string => {
  const value = Number(unscaledValue)
  const scaleNum = Number(scale)

  if (isNaN(value) || isNaN(scaleNum)) return '0.00'

  const result = value * Math.pow(10, -scaleNum)
  return result.toFixed(2)
}

const formatNarration = (n: any) => (typeof n === 'string' ? n.trim().toLowerCase() : '')

const getUniqueId = (account: any): string => {
  const sortCode = account.identifiers?.sortCode?.code ?? ''
  const accountNumber = account.identifiers?.sortCode?.accountNumber ?? ''
  const finIstitutionId = account.financialInstitutionId ?? ''
  return `accountUId-${accountNumber}${finIstitutionId}${sortCode}`
}

async function insertAccounts(accounts: any[], customerId: string) {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    return { message: 'No accounts to insert', insertedCount: 0 }
  }

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  const db = await connectDB()
  const col = db.collection('accounts')

  const ops = accounts.map((account: any) => {
    const doc = {
      id: account.id,
      customerId,
      uniqueId: account.unique_id ?? getUniqueId(account),
      name: account.name,
      type: account.type,
      bookedAmount: parseInt(account.balances?.booked?.amount?.value?.unscaledValue ?? '0', 10),
      bookedScale: parseInt(account.balances?.booked?.amount?.value?.scale ?? '0', 10),
      bookedCurrency: account.balances?.booked?.amount?.currencyCode ?? null,
      availableAmount: parseInt(account.balances?.available?.amount?.value?.unscaledValue ?? '0', 10),
      availableScale: parseInt(account.balances?.available?.amount?.value?.scale ?? '0', 10),
      availableCurrency: account.balances?.available?.amount?.currencyCode ?? null,
      balance: account.balanceFormatted ?? formatAmount(account.balances?.booked?.amount?.value?.unscaledValue, account.balances?.booked?.amount?.value?.scale),
      identifiers: account.identifiers ?? {},
      lastRefreshed: account.dates?.lastRefreshed ? new Date(account.dates.lastRefreshed) : new Date(),
      financialInstitutionId: account.financialInstitutionId ?? null,
      customerSegment: account.customerSegment ?? null,
    }

    return {
      updateOne: {
        filter: { id: account.id },
        update: { $set: doc },
        upsert: true,
      },
    }
  })

  const result = await col.bulkWrite(ops, { ordered: false })
  return result
}

async function insertTransactions(transactions: any[], customerId: string) {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { message: 'No transactions to insert', insertedCount: 0 }
  }

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  const db = await connectDB()
  const col = db.collection('transactions')

  const ops = transactions.map((txn: any) => {
    const doc = {
      id: txn.id,
      accountUniqueId: txn.accountUniqueId ?? null,
      accountId: txn.accountId ?? null,
      customerId,
      amount: txn.amountFormatted ?? formatAmount(txn.amount?.value?.unscaledValue, txn.amount?.value?.scale),
      unscaledValue: txn.amount?.value?.unscaledValue ? parseInt(txn.amount.value.unscaledValue, 10) : null,
      scale: txn.amount?.value?.scale ? parseInt(txn.amount.value.scale, 10) : null,
      narration: formatNarration(txn.descriptions?.original ?? txn.narration ?? ''),
      currencyCode: txn.amount?.currencyCode ?? null,
      descriptions: txn.descriptions ?? {},
      bookedDate: txn.dates?.booked ? new Date(txn.dates.booked) : null,
      identifiers: txn.identifiers ?? {},
      types: txn.types ?? {},
      status: txn.status ?? null,
      providerMutability: txn.providerMutability ?? null,
    }

    return {
      updateOne: {
        filter: { id: txn.id },
        update: { $set: doc },
        upsert: true,
      },
    }
  })

  const result = await col.bulkWrite(ops, { ordered: false })
  return result
}

export { formatAmount, getUniqueId, insertAccounts, insertTransactions }
