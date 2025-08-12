import { ScrollArea } from '@radix-ui/themes'
import styles from './transaction-month-pills.module.css'

type TransactionMonthPillsProps = {
  months: string[]
  selectedMonth: string | null
  setSelectedMonth: (month: string | null) => void
}

export default function TransactionMonthPills({
  months,
  selectedMonth,
  setSelectedMonth
}: TransactionMonthPillsProps) {
  return (
    <ScrollArea
      type="auto"
      className={styles.MonthsScrollArea}
    >
      {months.map(month => {
        const isSelected = month === selectedMonth
        const displayMonth = new Date(month + '-01').toLocaleDateString(undefined, {
          month: 'short',
          year: 'numeric',
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