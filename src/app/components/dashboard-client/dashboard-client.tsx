'use client'

import React, { useEffect, useState } from 'react'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import Header from '@/app/components/header/header'
import Footer from '@/app/components/footer/footer'
import { Grid } from '@radix-ui/themes'
import styles from '@/app/components/dashboard-client/dashboard-client.module.css'
import { useBaseColor } from '@/providers/base-colour-provider'
import AccountsCarousel from '@/app/components/accounts-carousel/accounts-carousel'
import TransactionsColumn from '@/app/components/transactions-column/transactions-column'
import { redirect, useParams } from 'next/navigation'


type DashboardClientProps = {
  accounts: Account[]
  transactions: Transaction[]
}

export default function DashboardClient({ accounts, transactions }: DashboardClientProps) {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [hasNavigated, setHasNavigated] = useState(false)
  const { baseColor } = useBaseColor()

  const params = useParams()
  const customerId = params.customerId as string

    const filteredTransactions = selectedAccount
  ? transactions.filter(txn => txn.accountUniqueId === selectedAccount)
  : transactions

  useEffect(() => {
    if (selectedAccount) {
      console.log('Selected Account:', selectedAccount)
    }
  }, [selectedAccount])

  return (
    <>
      <Header />
      <main className={styles.main} style={{ '--baseColor': baseColor } as React.CSSProperties}>
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
        </Grid>
        <Grid
          rows='3'
          className={styles.TransactionsGrid}
        >
          <div className={styles.transactionsHeader}>
            <span><h2 className="text-xl font-semibold mb-2">Transactions</h2></span>
          </div>
          <div className={styles.TransactionsListWrapper}>
          <TransactionsColumn transactions={filteredTransactions.slice(0, 10)} />
          </div>
          <div
            className='justify-center items-center flex cursor-pointer'
            role='button'
            onClick={() => redirect(`/${customerId}/transactions`)}
          >
            See all
          </div>
        </Grid>

        <Grid className={styles.Grid4}>
            <h2 className="text-xl font-semibold mb-2">{`{This Month}`} vs {`{Last Month}`}</h2>
        </Grid>
        {/* <Grid className={styles.Grid5}>
          <h2 className="text-xl font-semibold mb-2">Insights</h2>
        </Grid> */}
        <Grid className={styles.Grid6}>
          <h2 className="text-xl font-semibold mb-2">My top receivers</h2>
        </Grid>
      </main>
      <Footer />
    </>
  )
}
