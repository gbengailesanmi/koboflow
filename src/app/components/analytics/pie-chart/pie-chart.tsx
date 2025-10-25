'use client'

import React, { useState } from 'react'
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { CategoryData } from '../types/analytics-types'
import { formatCurrency } from '../utils/format-currency'
import styles from './pie-chart.module.css'

type PieChartProps = {
  data: CategoryData[]
  categoryConfig: Record<string, { label: string; color: string }>
  currency: string
}

export const PieChart: React.FC<PieChartProps> = ({ data, categoryConfig, currency }) => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  // Transform data for Recharts
  const chartData = data.map((item) => ({
    name: categoryConfig[item.category]?.label || 'Other',
    value: item.amount,
    percentage: item.percentage,
    category: item.category
  }))

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className={styles.pieTooltipContent}>
          <div className={styles.pieTooltipTitle}>{data.name}</div>
          <div className={styles.pieTooltipValue}>
            {formatCurrency(data.value, currency)}
          </div>
          <div className={styles.pieTooltipPercentage}>
            {data.percentage.toFixed(1)}%
          </div>
        </div>
      )
    }
    return null
  }

  // Custom legend
  const renderLegend = () => {
    return (
      <div className={styles.pieLegend}>
        {chartData.map((item, index) => {
          const config = categoryConfig[item.category] || categoryConfig.other
          return (
            <div
              key={item.category}
              className={`${styles.pieLegendItem} ${activeIndex === index ? styles.pieLegendItemHover : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              <div
                className={styles.pieLegendColor}
                style={{ backgroundColor: config.color }}
              />
              <span className={styles.pieLegendLabel}>{config.label}</span>
              <span className={styles.pieLegendPercentage}>
                {item.percentage.toFixed(1)}%
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className={styles.pieChartWrapper}>
      <div className={styles.pieChartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsPie>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
            >
              {chartData.map((entry, index) => {
                const config = categoryConfig[entry.category] || categoryConfig.other
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={config.color}
                    opacity={activeIndex === null || activeIndex === index ? 1 : 0.6}
                    stroke={activeIndex === index ? config.color : 'none'}
                    strokeWidth={activeIndex === index ? 3 : 0}
                  />
                )
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </RechartsPie>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      {renderLegend()}
    </div>
  )
}
