'use client'

import React, { useEffect, useState } from 'react'
import type { Account } from '@/types/account'
import type { Transaction } from '@/types/transactions'
import Header from '@/app/components/header/Header'
import Footer from '@/app/components/footer/Footer'
import { Grid } from '@radix-ui/themes'
import styles from '@/app/components/dashboard-client/dashboard-client.module.css'
import { useBaseColor } from '@/providers/base-colour-provider'
import AccountsCarousel from '@/app/components/carousel/accounts-carousel'

type DashboardClientProps = {
  accounts: Account[]
  transactions: Transaction[]
}

export default function DashboardClient({ accounts, transactions }: DashboardClientProps) {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null)
  const [hasNavigated, setHasNavigated] = useState(false)
  const { baseColor, setBaseColor } = useBaseColor()

  useEffect(() => {
  // if (selectedAccount) {
  setBaseColor('green')
  // }
  }, [])

  const filteredTransactions = selectedAccount
    ? transactions.filter((txn) => txn.accountUniqueId === selectedAccount)
    : transactions

  return (
    <>
      <Header />
      <main className={styles.main} style={{ '--baseColor': baseColor } as React.CSSProperties}>
        <Grid className={styles.Grid1}>

          <AccountsCarousel
            accounts={accounts}
            selectedAccount={selectedAccount}
            setSelectedAccount={setSelectedAccount}
            onNavigate={() => setHasNavigated(true)}
          />
        </Grid>

        {/* Other grids */}
        <Grid className={styles.Grid2}>
          <h2 className="text-xl font-semibold mb-2">Ads</h2>
        </Grid>
        <Grid className={styles.Grid3}>
          <h2 className="text-xl font-semibold mb-2">Transactions</h2>
        </Grid>
        <Grid className={styles.Grid4}>
          <h2 className="text-xl font-semibold mb-2">Spent this month</h2>
        </Grid>
        <Grid className={styles.Grid5}>
          <h2 className="text-xl font-semibold mb-2">Insights</h2>
        </Grid>
        <Grid className={styles.Grid6}>
          <h2 className="text-xl font-semibold mb-2">My top receivers</h2>
        </Grid>
      </main>
      <Footer />
    </>
  )
}
