export function formatMonthDisplay(month: string): string {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  try {
    const [year, monthNum] = month.split('-')
    const monthIndex = Math.max(0, Math.min(11, Number(monthNum) - 1))
    const yearShort = String(year).slice(-2)
    return `${monthNames[monthIndex]} ${yearShort}`
  } catch (error) {
    return month
  }
}

export function extractMonthsFromTransactions(transactions: Array<{ date: string | Date }>): string[] {
  const monthSet = new Set<string>()
  
  transactions.forEach(txn => {
    const date = new Date(txn.date)
    const month = date.toISOString().slice(0, 7)
    monthSet.add(month)
  })
  
  return Array.from(monthSet).sort((a, b) => b.localeCompare(a))
}

export function groupTransactionsByMonth(
  transactions: Array<{ id: string; date: string | Date }>
): Map<string, string[]> {
  const map = new Map<string, string[]>()
  
  transactions.forEach(txn => {
    const month = new Date(txn.date).toISOString().slice(0, 7)
    if (!map.has(month)) {
      map.set(month, [])
    }
    map.get(month)!.push(txn.id)
  })
  
  return map
}

export function formatDateToISO(date: string | Date): string {
  return new Date(date).toISOString().slice(0, 10)
}

export function formatDateToLocale(date: string | Date): string {
  return new Date(date).toLocaleString()
}

export function formatCurrency(amount: number | string, locale: string = 'en-GB'): string {
  return Number(amount).toLocaleString(locale, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  })
}

export function formatAccountBalance(accountName: string, balance: number | string): string {
  return `${accountName} --- £${formatCurrency(balance)}`
}

export function isDebitTransaction(transactionType: string): boolean {
  return transactionType === 'debit'
}

export function getTransactionTypeLabel(transactionType: string): string {
  return isDebitTransaction(transactionType) ? 'Debit' : 'Credit'
}

// URL Query Parameter Helpers
export function clearQueryParams(
  searchParams: URLSearchParams,
  router: { push: (url: string, options?: { scroll: boolean }) => void },
  ...paramsToClear: string[]
) {
  const params = new URLSearchParams(searchParams.toString())
  paramsToClear.forEach(param => params.delete(param))
  const queryString = params.toString()
  const url = queryString ? `?${queryString}` : window.location.pathname
  router.push(url, { scroll: false })
}

export function setQueryParam(
  searchParams: URLSearchParams,
  router: { push: (url: string, options?: { scroll: boolean }) => void },
  key: string,
  value: string,
  defaultValue: string = ''
) {
  const params = new URLSearchParams(searchParams.toString())
  
  if (value === defaultValue || value === '') {
    params.delete(key)
  } else {
    params.set(key, value)
  }
  
  const queryString = params.toString()
  const url = queryString ? `?${queryString}` : window.location.pathname
  router.push(url, { scroll: false })
}
