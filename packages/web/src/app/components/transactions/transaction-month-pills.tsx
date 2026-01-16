import { useQueryState } from 'nuqs'
import styles from '@/app/components/transactions/transactions.module.css'
import { formatMonthDisplay } from '@/helpers/transactions.helpers'

type TransactionMonthPillsProps = {
  months: string[]
}

export default function TransactionMonthPills({
  months,
}: TransactionMonthPillsProps) {
  const [selectedMonth, setSelectedMonth] = useQueryState('month')
  
  return (
    <div className={styles.scrollDiv}>
      {months.map(month => {
        const isSelected = month === selectedMonth

        return (
          <button
            key={month}
            data-month={month}
            onClick={() => setSelectedMonth(isSelected ? null : month)}
            className={`${isSelected ? styles.selected : styles.unselected}`}
            type="button"
          >
            <span className='text-xs'>{formatMonthDisplay(month)}</span>
          </button>
        )
      })}
    </div>
  )
}