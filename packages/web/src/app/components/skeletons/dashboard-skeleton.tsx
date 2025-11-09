import React from 'react'
import { Grid, Skeleton } from '@radix-ui/themes'
import Header from '@/app/components/header/header'
import Footer from '@/app/components/footer/footer'
import styles from '@/app/components/dashboard-client/dashboard-client.module.css'

export function DashboardSkeleton() {
  return (
    <>
      <Header />
      <main className={`${styles.main} page-gradient-background`}>
        {/* Accounts */}
        <Grid className={styles.AccountsGrid}>
          <Skeleton height="180px" />
        </Grid>

        {/* Ads */}
        <Grid className={styles.Grid2}>
          <Skeleton height="120px" />
        </Grid>

        {/* Upcoming Bills */}
        <Grid className={styles.Grid2}>
          <Skeleton height="200px" />
        </Grid>

        {/* Transactions */}
        <Grid className={styles.TransactionsGrid}>
          <Skeleton height="100%" />
        </Grid>

        {/* Chart */}
        <Grid className={styles.Grid4}>
          <Skeleton height="350px" />
        </Grid>

        {/* Top Receivers */}
        <Grid className={styles.Grid6}>
          <Skeleton height="150px" />
        </Grid>
      </main>
      <Footer opacity={2} />
    </>
  )
}
