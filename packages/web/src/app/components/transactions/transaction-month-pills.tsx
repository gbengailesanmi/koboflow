import { ScrollArea } from '@radix-ui/themes'
import styles from '@/app/components/transactions/transactions.module.css'

type TransactionMonthPillsProps = {
  months: string[]
  selectedMonth: string | null
  setSelectedMonth: (month: string | null) => void,
}

export default function TransactionMonthPills({
  months,
  selectedMonth,
  setSelectedMonth,
}: TransactionMonthPillsProps) {
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className={styles.monthsScrollDiv}>
      {months.map(month => {
        const isSelected = month === selectedMonth
        let displayMonth = month
        try {
          const [y, m] = month.split('-')
          const mi = Math.max(0, Math.min(11, Number(m) - 1))
          const yy = String(y).slice(-2)
          displayMonth = `${monthNames[mi]} ${yy}`
        } catch (e) {
          displayMonth = month
        }

        return (
          <button
            key={month}
            data-month={month}
            onClick={() => setSelectedMonth(isSelected ? null : month)}
            className={`${styles.monthButton} ${isSelected ? styles.selected : styles.unselected}`}
            type="button"
          >
            <span className='text-xs md:text-sm'>{displayMonth}</span>
          </button>
        )
      })}
    </div>
  )
}