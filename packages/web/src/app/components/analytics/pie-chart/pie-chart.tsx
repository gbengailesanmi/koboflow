'use client'

import React from 'react'
import { PieChart as RechartsPie, Pie, Sector, SectorProps, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import { CategoryData } from '../types/analytics-types'
import { formatCurrency } from '../utils/format-currency'
import styles from './pie-chart.module.css'

type Coordinate = {
  x: number
  y: number
}

type PieSectorData = {
  percent?: number
  name?: string | number
  midAngle?: number
  middleRadius?: number
  tooltipPosition?: Coordinate
  value?: number
  paddingAngle?: number
  dataKey?: string
  payload?: any
}

type PieSectorDataItem = React.SVGProps<SVGPathElement> & Partial<SectorProps> & PieSectorData

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

  const renderActiveShape = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  }: PieSectorDataItem) => {
    const RADIAN = Math.PI / 180
    const sin = Math.sin(-RADIAN * (midAngle ?? 1))
    const cos = Math.cos(-RADIAN * (midAngle ?? 1))
    const sx = (cx ?? 0) + ((outerRadius ?? 0) + 10) * cos
    const sy = (cy ?? 0) + ((outerRadius ?? 0) + 10) * sin
    const mx = (cx ?? 0) + ((outerRadius ?? 0) + 30) * cos
    const my = (cy ?? 0) + ((outerRadius ?? 0) + 30) * sin
    const ex = mx + (cos >= 0 ? 1 : -1) * 22
    const ey = my
    const textAnchor = cos >= 0 ? 'start' : 'end'

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className={styles.pieChartCenterText}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={(outerRadius ?? 0) + 6}
          outerRadius={(outerRadius ?? 0) + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className={styles.pieChartLabel}>
          {formatCurrency(value ?? 0, currency)}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className={styles.pieChartPercentage}>
          {`${((percent ?? 0) * 100).toFixed(1)}%`}
        </text>
      </g>
    )
  }

  return (
    <div className={styles.pieChartWrapper}>
      <div className={styles.chartCenter}>
        <ResponsiveContainer width="100%" height="100%" className={styles.responsiveContainer}>
          <RechartsPie>
            <Pie
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="35%"
              outerRadius="55%"
              dataKey="value"
              isAnimationActive={true}
              stroke="none"
            >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={() => null} />
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
