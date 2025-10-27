import React from 'react'
import { formatCurrency } from '../utils/format-currency'
import { categoryConfig } from '../config/category-config'
import { CategoryData } from '../types/analytics-types'
import styles from './category-breakdown.module.css'

type CategoryBreakdownProps = {
  categoryData: CategoryData[]
  currency: string
}

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({ categoryData, currency }) => {
  if (categoryData.length === 0) {
    return (
      <div className={styles.noData}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
        No expense data for this period
      </div>
    )
  }

  return (
    <div className={styles.categoryList}>
      {categoryData.slice(0, 6).map((cat) => {
        const config = categoryConfig[cat.category] || categoryConfig.other
        return (
          <div key={cat.category} className={styles.categoryItem}>
            <div className={styles.categoryItemLeft}>
              <div 
                className={styles.categoryColor}
                style={{ backgroundColor: config.color }}
              />
              <span className={styles.categoryLabel}>{config.label}</span>
            </div>
            <div className={styles.categoryItemRight}>
              <span className={styles.categoryPercentage}>
                {cat.percentage.toFixed(1)}%
              </span>
              <span className={styles.categoryAmount}>
                {formatCurrency(cat.amount, currency)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
