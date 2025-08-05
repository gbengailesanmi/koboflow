const formatAmount = (unscaledValue?: string, scale?: string): string => {
  const value = Number(unscaledValue)
  const scaleNum = Number(scale)

  if (isNaN(value) || isNaN(scaleNum)) return "0.00"

  const result = value * Math.pow(10, -scaleNum)
  return result.toFixed(2)
}

const formatNarration = (n: any) =>
  (typeof n === 'string' ? n.trim().toLowerCase() : '')

const getUniqueId = (account: any): string => {
  const sortCode = account.identifiers?.sortCode?.code ?? ''
  const accountNumber = account.identifiers?.sortCode?.accountNumber ?? ''
  const finIstitutionId = account.financialInstitutionId ?? ''
  return `accountUId-${accountNumber}${finIstitutionId}${sortCode}`
}

async function insertAccounts(dbInstance: any, accounts: any[], customerId: string, accountSchema: any) {
  if (accounts.length === 0) {
    return 'No accounts to insert'
  }

  if (!customerId) {
    return 'Customer ID is required'
  }

  await dbInstance
    .insert(accountSchema)
    .values(
      accounts.map((account: any) => ({
        id: account.id,
        customerId,
        uniqueId: account.unique_id,
        name: account.name,
        type: account.type,
        bookedAmount: parseInt(account.balances.booked.amount.value.unscaledValue, 10),
        bookedScale: parseInt(account.balances.booked.amount.value.scale, 10),
        bookedCurrency: account.balances.booked.amount.currencyCode,
        availableAmount: parseInt(account.balances.available.amount.value.unscaledValue, 10),
        availableScale: parseInt(account.balances.available.amount.value.scale, 10),
        availableCurrency: account.balances.available.amount.currencyCode,
        balance: account.balanceFormatted,
        identifiers: account.identifiers,
        lastRefreshed: new Date(account.dates.lastRefreshed),
        financialInstitutionId: account.financialInstitutionId,
        customerSegment: account.customerSegment,
      }))
    )
    .onConflictDoNothing({target: accountSchema.uniqueId})
}

async function insertTransactions(dbInstance: any, transactions: any[], customerId: string, trxnSchema: any) {
    if (transactions.length === 0) {
    return 'No transactions to insert'
    }

    if (!customerId) {
      return 'Customer ID is required'
    }

  await dbInstance
    .insert(trxnSchema)
    .values(
      transactions.map((txn: any) => ({
        id: txn.id,
        accountUniqueId: txn.accountUniqueId,
        accountId: txn.accountId,
        customerId,
        amount: txn.amountFormatted,
        unscaledValue: parseInt(txn.amount.value.unscaledValue, 10),
        scale: parseInt(txn.amount.value.scale, 10),
        narration: formatNarration(txn.descriptions.original),
        currencyCode: txn.amount.currencyCode,
        descriptions: txn.descriptions,
        bookedDate: new Date(txn.bookedDate),
        identifiers: txn.identifiers,
        types: txn.types,
        status: txn.status,
        providerMutability: txn.providerMutability,
      }))
    )
    .onConflictDoNothing({
  target: [
    trxnSchema.customerId,
    trxnSchema.accountUniqueId,
    trxnSchema.bookedDate,
    trxnSchema.amount,
    trxnSchema.narration
  ],
})

}
export { formatAmount, getUniqueId, insertAccounts, insertTransactions }
