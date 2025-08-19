import { ScrollArea } from '@radix-ui/themes'
import { RefObject } from 'react'
import styles from './transaction-month-pills.module.css'

type TransactionMonthPillsProps = {
  months: string[]
  selectedMonth: string | null
  setSelectedMonth: (month: string | null) => void,
  // transactionScrollRef: RefObject<HTMLDivElement> | null
}

export default function TransactionMonthPills({
  months,
  selectedMonth,
  setSelectedMonth,
  // transactionScrollRef
}: TransactionMonthPillsProps) {
  // console.log('efef', transactionScrollRef?.current)
  return (
    <ScrollArea
      type="auto"
      className={styles.MonthsScrollArea}
    >
      {months.map(month => {
        const isSelected = month === selectedMonth
        const displayMonth = new Date(month + '-01').toLocaleDateString(undefined, {
          month: 'short',
          year: '2-digit',
        })
        return (
          <button
            key={month}
            data-month={month}
            onClick={() => setSelectedMonth(isSelected ? null : month)}
            className={isSelected ? styles.MonthButtonSelected : styles.MonthButtonUnselected}
            type="button"
          >
            {displayMonth}
          </button>
        )
      })}
    </ScrollArea>
  )
}