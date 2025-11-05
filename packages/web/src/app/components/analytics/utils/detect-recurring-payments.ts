import { RecurringPayment } from '../types/analytics-types'
import { categorizeTransaction } from './categorize-transaction'

/**
 * Detects recurring payments from a list of transactions
 * @param transactions - Array of processed transactions
 * @returns Array of detected recurring payments sorted by next payment date
 */
export const detectRecurringPayments = (transactions: any[]): RecurringPayment[] => {
  const expenseTransactions = transactions.filter(t => t.type === 'expense')
  const patternMap = new Map<string, RecurringPayment['transactions']>()
  
  expenseTransactions.forEach(transaction => {
    const normalizedNarration = normalizeNarration(transaction.narration)
    
    if (normalizedNarration.length > 3) {
      if (!patternMap.has(normalizedNarration)) {
        patternMap.set(normalizedNarration, [])
      }
      patternMap.get(normalizedNarration)!.push({
        date: transaction.date,
        amount: transaction.numericAmount,
        narration: transaction.narration
      })
    }
  })
  
  const recurring: RecurringPayment[] = []
  
  patternMap.forEach((transactions, pattern) => {
    if (transactions.length >= 2) {
      transactions.sort((a, b) => a.date.getTime() - b.date.getTime())
      
      const intervals = calculateIntervals(transactions)
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length
      
      const isRecurring = intervals.every(interval => Math.abs(interval - avgInterval) <= 7)
      
      if (isRecurring && avgInterval >= 7 && avgInterval <= 365) {
        const lastTransaction = transactions[transactions.length - 1]
        const averageAmount = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
        const category = categorizeTransaction(lastTransaction.narration)
        
        const nextPaymentDate = new Date(lastTransaction.date.getTime() + (avgInterval * 24 * 60 * 60 * 1000))
        
        recurring.push({
          pattern: capitalizePattern(pattern),
          category,
          averageAmount,
          count: transactions.length,
          intervalDays: Math.round(avgInterval),
          lastPayment: lastTransaction.date,
          nextPayment: nextPaymentDate,
          transactions
        })
      }
    }
  })
  
  return recurring.sort((a, b) => a.nextPayment.getTime() - b.nextPayment.getTime())
}

/**
 * Normalizes transaction narration for pattern matching
 * Removes numbers, special characters, and trims whitespace
 */
const normalizeNarration = (narration: string): string => {
  return narration
    .toLowerCase()
    .replace(/\d+/g, '')
    .replace(/[^\w\s]/g, '')
    .trim()
}

/**
 * Calculates intervals in days between consecutive transactions
 */
const calculateIntervals = (transactions: Array<{ date: Date }>): number[] => {
  const intervals: number[] = []
  for (let i = 1; i < transactions.length; i++) {
    const daysDiff = Math.round(
      (transactions[i].date.getTime() - transactions[i - 1].date.getTime()) / (1000 * 60 * 60 * 24)
    )
    intervals.push(daysDiff)
  }
  return intervals
}

/**
 * Capitalizes each word in a pattern string
 */
const capitalizePattern = (pattern: string): string => {
  return pattern
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
