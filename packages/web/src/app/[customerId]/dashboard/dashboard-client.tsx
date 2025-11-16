'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSelectedItems } from '@/store'
import Header from '@/app/components/header/header'
import Footer from '@/app/components/footer/footer'
import { Grid } from '@radix-ui/themes'
import styles from './dashboard.module.css'
import AccountsCarousel from './utils/accounts-carousel/accounts-carousel'
import TransactionsColumn from '@/app/components/transactions/transactions-column/transactions-column'
import { MonthOnMonthChart } from '@/app/components/analytics/month-on-month-chart/month-on-month-chart'
import { RecurringPayments } from '@/app/components/analytics/recurring-payments/recurring-payments'
import { categorizeTransaction } from '@/app/components/analytics/utils/categorize-transaction'
import type { Account, Transaction } from '@money-mapper/shared'

interface DashboardClientProps {
  customerId: string
  accounts: Account[]
  transactions: Transaction[]
  profile: {
    name: string
    email: string
    currency: string
    totalBudgetLimit: number
  }
}

export default function DashboardClient({
  customerId,
  accounts,
  transactions,
  profile,
}: DashboardClientProps) {
  const router = useRouter()
  const [hasNavigated, setHasNavigated] = useState(false)
  
  // ✅ Use UI store for account selection
  const { selectedAccountId, setSelectedAccount } = useSelectedItems()

  const filteredTransactions = selectedAccountId
    ? transactions.filter(txn => txn.accountUniqueId === selectedAccountId)
    : transactions

  const processedTransactions = useMemo(() => {
    return filteredTransactions.map(transaction => {
      const amount = parseFloat(transaction.amount)
      return {
        ...transaction,
        numericAmount: Math.abs(amount),
        type: amount < 0 ? 'expense' : 'income',
        category: amount < 0 ? categorizeTransaction(transaction.narration) : 'income',
        date: new Date(transaction.bookedDate)
      }
    })
  }, [filteredTransactions])

  const monthOnMonthData = useMemo(() => {
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
    
    const currentMonthTransactions = processedTransactions.filter(transaction => {
      const transactionDate = transaction.date
      return transactionDate.getMonth() === currentMonth &&
             transactionDate.getFullYear() === currentYear
    })

    const prevMonthTransactions = processedTransactions.filter(transaction => {
      const transactionDate = transaction.date
      return transactionDate.getMonth() === prevMonth &&
             transactionDate.getFullYear() === prevYear
    })
    
    const currentIncome = currentMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0)
    const currentExpense = currentMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0)
    const prevIncome = prevMonthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.numericAmount, 0)
    const prevExpense = prevMonthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.numericAmount, 0)
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    return {
      currentMonth: {
        name: monthNames[currentMonth],
        income: currentIncome,
        expense: currentExpense
      },
      prevMonth: {
        name: monthNames[prevMonth],
        income: prevIncome,
        expense: prevExpense
      }
    }
  }, [processedTransactions])

  return (
    <>
      <Header />
      <main className={`${styles.main} page-gradient-background`}>
        <Grid className={styles.AccountsGrid}>
          <AccountsCarousel
            accounts={accounts}
            selectedAccount={selectedAccountId}
            setSelectedAccount={setSelectedAccount}
            onNavigate={() => setHasNavigated(true)}
          />
        </Grid>
        <Grid className={styles.Grid2}>
          <h2 className="text-xl font-semibold mb-2">Ads</h2>
        </Grid>
        <Grid className={styles.Grid2}>
          <h2 className="text-xl font-semibold mb-2">Upcoming bills</h2>
          <RecurringPayments 
            transactions={processedTransactions}
            currency={profile.currency}
            maxItems={5}
            showSeeMore={true}
          />
        </Grid>
        <Grid rows='3' className={styles.TransactionsGrid} style={{ gridTemplateRows: '2.5rem 1fr 2.5rem' }}>
          <div style={{ display: 'flex', height: '100%', padding: '.3rem' }}>
            <span><h2 className="text-xl font-semibold mb-2">Transactions</h2></span>
          </div>
          <div className={styles.TransactionsListWrapper}>
            <TransactionsColumn transactions={filteredTransactions.slice(0, 10)} />
          </div>
          <div className='justify-center items-center flex cursor-pointer' role='button' onClick={() => router.push(`/${customerId}/transactions`)}>
            See all
          </div>
        </Grid>        
        <Grid className={styles.Grid4}>
          <h2 className="text-xl font-semibold mb-2">This Month vs Last Month</h2>
          <div style={{ width: '100%', height: '350px', minHeight: '350px' }}>
            {processedTransactions.length > 0 && (monthOnMonthData.currentMonth.expense > 0 || monthOnMonthData.prevMonth.expense > 0) ? (
              <MonthOnMonthChart data={monthOnMonthData} currency={profile.currency} transactions={processedTransactions} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', height: '100%' }}>
                <div style={{ fontSize: '48px', marginBottom: '6px' }}>📈</div>
                <p>No expense data for comparison</p>
              </div>
            )}
          </div>
        </Grid>
        <Grid className={styles.Grid6}>
          <h2 className="text-xl font-semibold mb-2">My top receivers</h2>
        </Grid>
      </main>
      <Footer opacity={2} />
    </>
  )
}
