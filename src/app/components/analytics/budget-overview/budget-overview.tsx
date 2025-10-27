import React from 'react'
import { formatCurrency } from '../utils/format-currency'
import styles from './budget-overview.module.css'

type BudgetOverviewProps = {
  monthlyExpense: number
  monthlyBudget: number
  currency: string
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({
  monthlyExpense,
  monthlyBudget,
  currency
}) => {
  return (
    <div className={styles.budgetOverview}>
      <div className={styles.budgetProgress}>
        <div className={styles.budgetProgressBar}>
          <div 
            className={styles.budgetProgressFill}
            style={{ 
              width: `${Math.min((monthlyExpense / monthlyBudget) * 100, 100)}%`,
              background: monthlyExpense > monthlyBudget 
                ? 'linear-gradient(90deg, #ef4444, #dc2626)' 
                : 'linear-gradient(90deg, #10b981, #059669)'
            }}
          />
        </div>
        <div className={styles.budgetLabels}>
          <span>💸 Spent: {formatCurrency(monthlyExpense, currency)}</span>
          <span>🎯 Budget: {formatCurrency(monthlyBudget, currency)}</span>
        </div>
        <div className={styles.budgetRemaining}>
          <span className={monthlyExpense <= monthlyBudget ? styles.incomeColor : styles.expenseColor}>
            {monthlyExpense <= monthlyBudget 
              ? `🎉 ${formatCurrency(monthlyBudget - monthlyExpense, currency)} remaining`
              : `⚠️ ${formatCurrency(monthlyExpense - monthlyBudget, currency)} over budget`
            }
          </span>
        </div>
      </div>
    </div>
  )
}
