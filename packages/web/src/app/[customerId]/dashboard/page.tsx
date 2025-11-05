'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import Header from '@/app/components/header/header'
import Footer from '@/app/components/footer/footer'
import { Grid } from '@radix-ui/themes'
import styles from '@/app/components/dashboard-client/dashboard-client.module.css'
import { useBaseColor } from '@/providers/base-colour-provider'
import AccountsCarousel from '@/app/components/dashboard-client/utils/accounts-carousel/accounts-carousel'
import TransactionsColumn from '@/app/components/transactions/transactions-column/transactions-column'
import { MonthOnMonthChart } from '@/app/components/analytics/month-on-month-chart/month-on-month-chart'
import { RecurringPayments } from '@/app/components/analytics/recurring-payments/recurring-payments'
import { categorizeTransaction } from '@/app/components/analytics/utils/categorize-transaction'

type UserProfile = {
  name: string
  email: string
  currency: string
  totalBudgetLimit: number
}

export default function Dashboard() {
  const params = useParams()
  const router = useRouter()
  const customerId = params.customerId as string
  const { baseColor } = useBaseColor()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [hasNavigated, setHasNavigated] = useState(false)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        
        const [sessionRes, accountsRes, transactionsRes]: any[] = await Promise.all([
          apiClient.getSession(),
          apiClient.getAccounts(),
          apiClient.getTransactions(),
        ])

        if (!sessionRes.success || sessionRes.user?.customerId !== customerId) {
          router.push('/login')
          return
        }

        const profileData = {
          name: `${sessionRes.user.firstName} ${sessionRes.user.lastName}`,
          email: sessionRes.user.email,
          currency: sessionRes.user.currency || 'SEK',
          totalBudgetLimit: sessionRes.user.totalBudgetLimit || 0,
        }
        
        setProfile(profileData)

        setAccounts(accountsRes.accounts || [])
        
        setTransactions(transactionsRes.transactions || [])

      } catch (error: any) {
        setError(error.message || 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [customerId, router])

  const filteredTransactions = selectedAccount
    ? transactions.filter(txn => txn.accountUniqueId === selectedAccount)
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

  if (loading || !profile) {
    return (
      <>
        <Header />
        <main className={`${styles.main} page-gradient-background`}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p>Loading dashboard...</p>
          </div>
        </main>
        <Footer opacity={2} />
        <style jsx>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Header />
        <main className={`${styles.main} page-gradient-background`}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>⚠️</div>
            <p style={{ color: '#ef4444', fontSize: '18px', fontWeight: '500' }}>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        </main>
        <Footer opacity={2} />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className={`${styles.main} page-gradient-background`}>
        <Grid className={styles.AccountsGrid}>
          <AccountsCarousel
            accounts={accounts}
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
