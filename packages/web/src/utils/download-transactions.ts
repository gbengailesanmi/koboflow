import type { EnrichedTransaction, Account } from '@koboflow/shared'
import { formatCurrency, formatDateToLocale, getTransactionTypeLabel } from '@/helpers/transactions.helpers'

type FilterInfo = {
  accountId?: string
  accountName?: string
  type?: 'all' | 'debit' | 'credit'
  from?: string
  to?: string
  search?: string
}

export function downloadTransactionsAsCSV(transactions: EnrichedTransaction[], filename = 'transactions.csv') {
  const headers = ['Date', 'Type', 'Narration', 'Amount', 'Balance', 'Category']
  const rows = transactions.map(txn => [
    formatDateToLocale(txn.date),
    getTransactionTypeLabel(txn.type),
    `"${txn.narration.replace(/"/g, '""')}"`, // Escape quotes in CSV
    formatCurrency(txn.amount),
    formatCurrency(txn.balance),
    txn.category || 'Uncategorized'
  ])

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function printTransactions(transactions: EnrichedTransaction[], filters?: FilterInfo) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) return

  // Build filter summary
  const activeFilters: string[] = []
  if (filters?.accountName) {
    activeFilters.push(`Account: ${filters.accountName}`)
  }
  if (filters?.type && filters.type !== 'all') {
    activeFilters.push(`Type: ${filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}`)
  }
  if (filters?.from) {
    activeFilters.push(`From: ${new Date(filters.from).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
  }
  if (filters?.to) {
    activeFilters.push(`To: ${new Date(filters.to).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
  }
  if (filters?.search) {
    activeFilters.push(`Search: "${filters.search}"`)
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Transactions - KoboFlow</title>
      <style>
        @media print {
          @page {
            margin: 1cm;
          }
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          font-size: 24px;
          margin-bottom: 10px;
          color: #040708;
        }
        .meta {
          color: #757781;
          margin-bottom: 30px;
          font-size: 14px;
        }
        .filters {
          background-color: #f3f3f4;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .filters h2 {
          font-size: 14px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #575962;
        }
        .filters ul {
          margin: 0;
          padding-left: 20px;
          font-size: 13px;
          color: #575962;
        }
        .filters li {
          margin-bottom: 4px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th {
          background-color: #f3f3f4;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #dddee2;
          font-size: 12px;
          text-transform: uppercase;
          color: #575962;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e6e6ea;
          font-size: 14px;
        }
        tr:hover {
          background-color: #f7f7f7;
        }
        .debit {
          color: #ce2c31;
        }
        .credit {
          color: #297c3b;
        }
        .amount {
          font-weight: 600;
          text-align: right;
        }
        .narration {
          max-width: 400px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        @media print {
          tr:hover {
            background-color: transparent;
          }
        }
      </style>
    </head>
    <body>
      <h1>Transactions Report</h1>
      <div class="meta">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total transactions: ${transactions.length}</p>
      </div>
      ${activeFilters.length > 0 ? `
        <div class="filters">
          <h2>Active Filters</h2>
          <ul>
            ${activeFilters.map(filter => `<li>${filter}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Type</th>
            <th>Narration</th>
            <th>Category</th>
            <th style="text-align: right">Amount</th>
            <th style="text-align: right">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(txn => {
            const isDebit = txn.type === 'debit'
            return `
              <tr>
                <td>${formatDateToLocale(txn.date)}</td>
                <td class="${isDebit ? 'debit' : 'credit'}">${getTransactionTypeLabel(txn.type)}</td>
                <td class="narration">${txn.narration}</td>
                <td>${txn.category || 'Uncategorized'}</td>
                <td class="amount ${isDebit ? 'debit' : 'credit'}">${formatCurrency(txn.amount)}</td>
                <td class="amount">${formatCurrency(txn.balance)}</td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
  
  // Wait for content to load before printing
  printWindow.onload = () => {
    printWindow.print()
  }
}
