import React from 'react'
import { formatCurrency } from '../utils/format-currency'
import styles from './budget-overview.module.css'

type BudgetOverviewProps = {
  monthlyExpense: number
  totalBudgetLimit: number
  currency: string
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  monthlyExpense,
  totalBudgetLimit,
  currency
}) => {
  return (
    <div className={styles.budgetOverview}>
      <div className={styles.budgetProgress}>
        <div className={styles.budgetProgressBar}>
          <div 
            className={styles.budgetProgressFill}
            style={{ 
              width: `${Math.min((monthlyExpense / totalBudgetLimit) * 100, 100)}%`,
              background: monthlyExpense > totalBudgetLimit 
                ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                : 'linear-gradient(90deg, #10b981, #059669)'
            }}
          />
        </div>
        <div className={styles.budgetLabels}>
          <span>💸 Spent: {formatCurrency(monthlyExpense, currency)}</span>
          <span>🎯 Budget: {formatCurrency(totalBudgetLimit, currency)}</span>
        </div>
        <div className={styles.budgetRemaining}>
          <span className={monthlyExpense <= totalBudgetLimit ? styles.incomeColor : styles.expenseColor}>
            {monthlyExpense <= totalBudgetLimit 
              ? `🎉 ${formatCurrency(totalBudgetLimit - monthlyExpense, currency)} remaining`
              : `⚠️ ${formatCurrency(monthlyExpense - totalBudgetLimit, currency)} over budget`
            }
          </span>
        </div>
      </div>
    </div>
  )
}
