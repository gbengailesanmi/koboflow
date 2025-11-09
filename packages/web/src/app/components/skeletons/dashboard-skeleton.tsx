import React from 'react'
import { Grid, Skeleton } from '@radix-ui/themes'
import Header from '@/app/components/header/header'
import Footer from '@/app/components/footer/footer'
import styles from '@/app/components/dashboard-client/dashboard-client.module.css'

export function DashboardSkeleton() {
  return (
    <>
      {/* <Header /> */}
      <main className={`${styles.main} page-gradient-background`}>
        {/* Accounts Carousel Skeleton */}
        <Grid className={styles.AccountsGrid}>
          <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
            <Skeleton height="180px" style={{ flex: 1, borderRadius: '12px' }} />
            <Skeleton height="180px" style={{ flex: 1, borderRadius: '12px' }} />
            <Skeleton height="180px" style={{ flex: 1, borderRadius: '12px' }} />
          </div>
        </Grid>

        {/* Ads Section Skeleton */}
        <Grid className={styles.Grid2}>
          <Skeleton height="24px" width="60px" style={{ marginBottom: '8px' }} />
          <Skeleton height="120px" style={{ borderRadius: '8px' }} />
        </Grid>

        {/* Upcoming Bills Skeleton */}
        <Grid className={styles.Grid2}>
          <Skeleton height="24px" width="150px" style={{ marginBottom: '8px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height="60px" style={{ borderRadius: '8px' }} />
            <Skeleton height="60px" style={{ borderRadius: '8px' }} />
            <Skeleton height="60px" style={{ borderRadius: '8px' }} />
            <Skeleton height="60px" style={{ borderRadius: '8px' }} />
            <Skeleton height="60px" style={{ borderRadius: '8px' }} />
          </div>
        </Grid>

        {/* Transactions Section Skeleton */}
        <Grid rows="3" className={styles.TransactionsGrid} style={{ gridTemplateRows: '2.5rem 1fr 2.5rem' }}>
          <div style={{ display: 'flex', height: '100%', padding: '.3rem' }}>
            <Skeleton height="24px" width="140px" />
          </div>
          <div className={styles.TransactionsListWrapper}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '8px' }}>
              {[...Array(10)].map((_, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Skeleton height="40px" width="40px" style={{ borderRadius: '50%' }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <Skeleton height="16px" width="60%" />
                    <Skeleton height="14px" width="40%" />
                  </div>
                  <Skeleton height="18px" width="80px" />
                </div>
              ))}
            </div>
          </div>
          <div className="justify-center items-center flex">
            <Skeleton height="20px" width="60px" />
          </div>
        </Grid>

        {/* Month on Month Chart Skeleton */}
        <Grid className={styles.Grid4}>
          <Skeleton height="24px" width="250px" style={{ marginBottom: '8px' }} />
          <Skeleton height="350px" style={{ borderRadius: '8px' }} />
        </Grid>

        {/* Top Receivers Skeleton */}
        <Grid className={styles.Grid6}>
          <Skeleton height="24px" width="180px" style={{ marginBottom: '8px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Skeleton height="60px" style={{ borderRadius: '8px' }} />
            <Skeleton height="60px" style={{ borderRadius: '8px' }} />
            <Skeleton height="60px" style={{ borderRadius: '8px' }} />
          </div>
        </Grid>
      </main>
      {/* <Footer opacity={2} /> */}
    </>
  )
}
