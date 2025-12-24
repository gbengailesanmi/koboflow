'use client'

import React from 'react'
import { PieChart as RechartsPie, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { CategoryData } from '../types/analytics-types'
import { formatCurrency } from '../utils/format-currency'
import styles from './pie-chart.module.css'

type PieChartProps = {
  data: CategoryData[]
  categoryConfig: Record<string, { label: string; color: string }>
  currency: string
}

export const PieChart: React.FC<PieChartProps> = ({ data, categoryConfig, currency }) => {
  const chartData = data.map((item) => ({
    name: categoryConfig[item.category]?.label || 'Other',
    value: item.amount,
    percentage: item.percentage,
    category: item.category,
    color: categoryConfig[item.category]?.color || '#8884d8'
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{data.name}</p>
          <p className={styles.tooltipValue}>
            {formatCurrency(data.value, currency)}
          </p>
          <p className={styles.tooltipPercent}>
            {data.payload.percentage.toFixed(1)}%
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.pieChartWrapper}>
      <div className={styles.chartCenter}>
        <ResponsiveContainer width="100%" height="100%" className={styles.responsiveContainer}>
          <RechartsPie>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="85%"
              dataKey="value"
              isAnimationActive={true}
              stroke="none"
              cornerRadius={8}
              paddingAngle={2}
            >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </RechartsPie>
        </ResponsiveContainer>
      </div>

      {/* Category Buttons */}
      <div className={styles.categoryButtons}>
        {chartData.map((item, index) => (
          <button
            key={item.category}
            className={styles.categoryButton}
            style={{
              borderColor: item.color,
              backgroundColor: `${item.color}15`,
            }}
          >
            <span 
              className={styles.categoryButtonDot}
              style={{ backgroundColor: item.color }}
            />
            <span className={styles.categoryButtonLabel}>{item.name}</span>
            <span className={styles.categoryButtonPercent}>
              {item.percentage.toFixed(1)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
