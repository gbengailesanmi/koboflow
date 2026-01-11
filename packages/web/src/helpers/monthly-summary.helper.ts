import type { EnrichedTransaction } from '@koboflow/shared'

interface MonthlySummaryData {
  totalSpend: number
  upcomingBills: Array<{ id: string; name: string; amount: number; dueDate: string }>
  totalReceived: number
  creditScore: number
  lastMonthSpend: number
}

export function calculateMonthlySummary(
  transactions: EnrichedTransaction[],
  selectedAccountId?: string | null
): MonthlySummaryData {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear

  let totalSpend = 0
  let totalReceived = 0
  let lastMonthSpend = 0
  const upcomingBills: Array<{ id: string; name: string; amount: number; dueDate: string }> = []

  const filteredTransactions = selectedAccountId
    ? transactions.filter(txn => txn.accountId === selectedAccountId)
    : transactions

  filteredTransactions.forEach((transaction) => {
    const txnDate = new Date(transaction.date)
    const txnMonth = txnDate.getMonth()
    const txnYear = txnDate.getFullYear()

    if (txnMonth === currentMonth && txnYear === currentYear) {
      if (transaction.type === 'debit') {
        totalSpend += Math.abs(transaction.amount)
      } else if (transaction.type === 'credit') {
        totalReceived += Math.abs(transaction.amount)
      }
    }

    if (txnMonth === lastMonth && txnYear === lastMonthYear) {
      if (transaction.type === 'debit') {
        lastMonthSpend += Math.abs(transaction.amount)
      }
    }
  })

  return {
    totalSpend,
    upcomingBills,
    totalReceived,
    creditScore: 0,
    lastMonthSpend,
  }
}
