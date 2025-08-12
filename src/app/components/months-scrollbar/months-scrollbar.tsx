import { ScrollArea } from '@radix-ui/themes'

type MonthsScrollBarProps = {
  months: string[]
  selectedMonth: string | null
  setSelectedMonth: (month: string | null) => void
  className?: string
  styles: { MonthSelected: string; MonthButton: string; MonthsScrollArea: string }
}

export default function MonthsScrollBar({
  months,
  selectedMonth,
  setSelectedMonth,
  className,
  styles,
}: MonthsScrollBarProps) {
  return (
    <ScrollArea
      type="auto"
      className={className ?? styles.MonthsScrollArea}
      style={{ overflowX: 'auto', whiteSpace: 'nowrap', marginBottom: '1rem' }}
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
            className={isSelected ? styles.MonthSelected : styles.MonthButton}
            style={{
              display: 'inline-block',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              border: isSelected ? '2px solid red' : '1px solid gray',
              borderRadius: '4px',
              marginRight: '0.5rem',
              backgroundColor: isSelected ? 'gray' : 'black',
              userSelect: 'none',
            }}
            type="button"
          >
            {displayMonth}
          </button>
        )
      })}
    </ScrollArea>
  )
}