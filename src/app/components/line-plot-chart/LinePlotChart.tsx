import { LineChart, Line, XAxis, YAxis, Legend, CartesianGrid, ResponsiveContainer } from 'recharts'
import type { Transaction } from '@/types/transactions'
import type { Account } from '@/types/account'

type Props = {
  transactions: Transaction[]
  accounts: Account[]
}

function aggregateDatesIntoBuckets(
  data: Record<string, Record<string, number>>,
  allDates: string[],
  allAccountIds: string[],
  bucketCount = 10
) {
  if (allDates.length <= bucketCount) {
    return allDates.map(date => ({
      date,
      ...allAccountIds.reduce((acc, id) => {
        acc[id] = data[date][id] || 0
        return acc
      }, {} as Record<string, number>)
    }))
  }

  const bucketSize = Math.ceil(allDates.length / bucketCount)
  const aggregated: { date: string; [key: string]: number | string }[] = []

  for (let i = 0; i < allDates.length; i += bucketSize) {
    const bucketDates = allDates.slice(i, i + bucketSize)
    const bucketLabel = `${bucketDates[0]} → ${bucketDates[bucketDates.length - 1]}`

    const bucketTotals: Record<string, number> = {}
    allAccountIds.forEach(id => {
      bucketTotals[id] = bucketDates.reduce((sum, date) => sum + (data[date][id] || 0), 0)
    })

    aggregated.push({ date: bucketLabel, ...bucketTotals })
  }

  return aggregated
}

function getAccountLabel(account: Account) {
  // Defensive parsing of account number and sort code from identifiers
  try {
    // identifiers might be JSON or object; if string, parse it
    const ids = typeof account.identifiers === 'string' ? JSON.parse(account.identifiers) : account.identifiers

    const accountNumber = ids?.sortCode?.accountNumber ?? 'UnknownAccNum'
    const accountBal = account.balance
    const formattedBal = Number(accountBal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    return `${accountNumber} (${formattedBal})`
  } catch {
    return 'Unknown Account'
  }
}

export default function LinePlotChart({ transactions, accounts }: Props) {
  if (!transactions || transactions.length === 0) {
    return <p>No transactions available</p>
  }

  const allAccountIds = Array.from(new Set(transactions.map(txn => txn.accountUniqueId)))

  // Map accountUniqueId to label with accountNumber / sortCode
  const accountLabels: Record<string, string> = {}
  accounts.forEach(acc => {
    accountLabels[acc.uniqueId] = getAccountLabel(acc)
  })

  const allDatesSet = new Set(transactions.map(txn =>
    txn.bookedDate instanceof Date
      ? txn.bookedDate.toISOString().slice(0, 10)
      : new Date(txn.bookedDate).toISOString().slice(0, 10)
  ))
  const allDates = Array.from(allDatesSet).sort()

  const dataByDate: Record<string, Record<string, number>> = {}
  allDates.forEach(date => {
    dataByDate[date] = {}
    allAccountIds.forEach(id => {
      dataByDate[date][id] = 0
    })
  })

  transactions.forEach(txn => {
    const date = txn.bookedDate instanceof Date
      ? txn.bookedDate.toISOString().slice(0, 10)
      : new Date(txn.bookedDate).toISOString().slice(0, 10)

    const accountId = txn.accountUniqueId
    const amount = Number(txn.amount)

    if (!dataByDate[date]) dataByDate[date] = {}
    if (!dataByDate[date][accountId]) dataByDate[date][accountId] = 0
    dataByDate[date][accountId] += amount
  })

  const chartData = aggregateDatesIntoBuckets(dataByDate, allDates, allAccountIds, 10)

  const colors = ['#8884d8', '#82ca9d', '#ff7300', '#ff0000', '#00aaff', '#aa00ff', '#00ffaa']

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 0 }}>
        <CartesianGrid strokeDasharray="7 7" />
        <XAxis dataKey="date" />
        <YAxis />
        <Legend />
        {allAccountIds.map((accountId, idx) => (
          <Line
            key={accountId}
            type="monotone"
            dataKey={accountId}
            stroke={colors[idx % colors.length]}
            strokeWidth={2}
            dot={false}
            name={accountLabels[accountId] || `Account ${accountId}`}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
