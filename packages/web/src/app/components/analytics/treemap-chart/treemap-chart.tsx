'use client'

import React from 'react'
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts'
import { TreemapNode } from 'recharts/types/chart/Treemap'
import { CategoryData } from '../types/analytics-types'
import { formatCurrency } from '../utils/format-currency'
import styles from './treemap-chart.module.css'

type TreemapChartProps = {
  data: CategoryData[]
  categoryConfig: Record<string, { label: string; color: string }>
  currency: string
}

type TreemapData = {
  name: string
  size: number
  category: string
  color: string
  percentage: number
}

const CustomizedContent = (props: TreemapNode & { currency?: string; root?: any }) => {
  const { root, depth, x, y, width, height, index, name, currency } = props

  if (!width || !height || width < 10 || height < 10) {
    return null
  }

  const nodeData = root?.children?.[index] as TreemapData | undefined
  const fillColor = nodeData?.color || '#8884d8'
  const percentage = nodeData?.percentage || 0
  const size = nodeData?.size || 0

  const showName = width > 60 && height > 40
  const showPercentage = width > 80 && height > 60
  const showAmount = width > 100 && height > 80

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: fillColor,
          stroke: 'none',
          strokeWidth: 0,
        }}
      />
      {showName && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="#fff"
          fontSize={Math.min(14, Math.max(10, width / 8))}
          fontWeight="600"
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
        >
          {name}
        </text>
      )}
      {showPercentage && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 18}
          textAnchor="middle"
          fill="#fff"
          fontSize={Math.min(12, Math.max(9, width / 10))}
          fillOpacity={0.9}
        >
          {`${percentage.toFixed(1)}%`}
        </text>
      )}
      {showAmount && currency && (
        <text
          x={x + width / 2}
          y={y + height / 2 + 34}
          textAnchor="middle"
          fill="#fff"
          fontSize={Math.min(11, Math.max(8, width / 12))}
          fillOpacity={0.85}
        >
          {formatCurrency(size, currency)}
        </text>
      )}
    </g>
  )
}

export const TreemapChart: React.FC<TreemapChartProps> = ({ data, categoryConfig, currency }) => {
  const treemapData: TreemapData[] = data.map((item) => ({
    name: categoryConfig[item.category]?.label || 'Other',
    size: item.amount,
    category: item.category,
    color: categoryConfig[item.category]?.color || '#8884d8',
    percentage: item.percentage,
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as TreemapData
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{data.name}</p>
          <p className={styles.tooltipValue}>
            {formatCurrency(data.size, currency)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className={styles.treemapWrapper}>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            stroke="none"
            fill="#8884d8"
            content={(props) => <CustomizedContent {...props} currency={currency} />}
            animationDuration={300}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
