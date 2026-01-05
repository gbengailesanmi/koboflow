'use client'

import React, { useState } from 'react'
import { TriangleDownIcon } from '@radix-ui/react-icons'
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
    setLastMonth(new Date(new Date().setMonth(new Date().getMonth() - 1)).toLocaleString('default', { month: 'short' }))
  }, [])

  React.useEffect(() => {
    initialiseLastMonth()
  }, [initialiseLastMonth])

  const isLowerThanLastMonth = totalSpend < lastMonthSpend
  const isSameAsLastMonth = totalSpend === lastMonthSpend
  const difference = Math.abs(totalSpend - lastMonthSpend)
  const iconColor = (isLowerThanLastMonth || isSameAsLastMonth) ? '#22c55e' : '#ef4444'

  const vsContent = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'center', fontSize: '12px' }}>
      <TriangleDownIcon width={15} height={15} style={{ color: iconColor }} />
      <span>£{difference.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}<br />
      vs {lastMonth}</span>
    </div>
  )

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
