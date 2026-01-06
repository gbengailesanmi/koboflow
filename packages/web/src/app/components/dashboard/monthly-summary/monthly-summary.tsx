'use client'

import React, { useState } from 'react'
import styles from './monthly-summary.module.css'
import SummaryCard from './summary-card'
import UpcomingBillsPopup from './upcoming-bills-popup'

interface MonthlySummaryProps {
  totalSpend: number
  upcomingBills: Array<{ id: string; name: string; amount: number; dueDate: string }>
  totalReceived: number
  creditScore: number
  lastMonthSpend?: number
}

export default function MonthlySummary({
  totalSpend,
  upcomingBills,
  totalReceived,
  creditScore,
  lastMonthSpend = 0
}: MonthlySummaryProps) {
  const [showBillsPopup, setShowBillsPopup] = useState(false)
  const [lastMonth, setLastMonth] = useState('')

  const initialiseLastMonth = React.useCallback(() => {
    const lastMonthDate = new Date(new Date().setMonth(new Date().getMonth() - 1))
    const day = lastMonthDate.getDate()
    const month = lastMonthDate.toLocaleString('default', { month: 'short' })
    setLastMonth(`${day} ${month}`)
  }, [])

  React.useEffect(() => {
    initialiseLastMonth()
  }, [initialiseLastMonth])

  const isLowerThanLastMonth = totalSpend < lastMonthSpend
  const isSameAsLastMonth = totalSpend === lastMonthSpend
  const difference = Math.abs(totalSpend - lastMonthSpend)

  const vsContent = {
    amount: `£${difference.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    lastMonth,
    isLower: isLowerThanLastMonth || isSameAsLastMonth
  }

  return (
    <div className={styles.summaryContainer}>
      <div className={styles.cardsGrid}>
        <SummaryCard
          title="Total Spend"
          value={`£${totalSpend.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          vsContent={vsContent}
        />

        <SummaryCard
          title="Upcoming Bills"
          value={upcomingBills.length.toString()}
          onClick={() => setShowBillsPopup(true)}
          clickable
        />

        <SummaryCard
          title="Total Received"
          value={`£${totalReceived.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        />

        <SummaryCard
          title="Credit Score"
          value={creditScore.toString()}
        />
      </div>

      <div className={styles.bottomSection}>
        {/* Bottom section content will go here */}
      </div>

      {showBillsPopup && (
        <UpcomingBillsPopup
          bills={upcomingBills}
          onClose={() => setShowBillsPopup(false)}
        />
      )}
    </div>
  )
}
