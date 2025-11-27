'use client'

import React from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { CategoryData } from '../types/analytics-types'
import { formatCurrency } from '../utils/format-currency'
import styles from './bubble-chart.module.css'

type BubbleChartProps = {
  data: CategoryData[]
  categoryConfig: Record<string, { label: string; color: string }>
  currency: string
}

type BubbleData = {
  x: number // percentage
  y: number // amount
  z: number // count (for bubble size)
  name: string
  color: string
  amount: number
  percentage: number
  count: number
}

export const BubbleChart: React.FC<BubbleChartProps> = ({ data, categoryConfig, currency }) => {
  // Transform data for bubble chart with proper collision detection
  const bubbleData: BubbleData[] = React.useMemo(() => {
    const baseX = 50
    const baseY = 50
    const placedBubbles: BubbleData[] = []
    
    // Calculate radius based on percentage - bubble AREA should be proportional to percentage
    const getRadius = (percentage: number): number => {
      // Scale to bubble size - area proportional to percentage
      // Area = π * r^2, so r = sqrt(Area / π)
      // Make the largest percentage use 80% of available space
      const maxPercentage = Math.max(...data.map(d => d.percentage))
      const scaleFactor = percentage / maxPercentage
      const minSize = 500
      const maxSize = 3500
      return minSize + (scaleFactor * (maxSize - minSize))
    }
    
    // Check if two circles overlap with proper distance calculation
    const isOverlapping = (x1: number, y1: number, r1: number, x2: number, y2: number, r2: number): boolean => {
      const dx = x2 - x1
      const dy = y2 - y1
      const distance = Math.sqrt(dx * dx + dy * dy)
      // Convert radius to coordinate space and add padding
      const radius1 = r1 / 45 // Scale factor for coordinate system
      const radius2 = r2 / 45
      const minDistance = radius1 + radius2 + 2 // 2 units padding
      return distance < minDistance
    }
    
    // Sort by percentage (largest first)
    const sortedData = [...data].sort((a, b) => b.percentage - a.percentage)
    
    sortedData.forEach((item, itemIndex) => {
      const radius = getRadius(item.percentage)
      let x = baseX
      let y = baseY
      let placed = false
      
      // For the first (largest) bubble, place it in the center
      if (itemIndex === 0) {
        x = baseX
        y = baseY
        placed = true
      } else {
        // Try to place bubble using a systematic grid search
        const gridSize = 2 // Search every 2 units
        const maxRadius = 40 // Maximum distance from center
        
        searchLoop: for (let distance = 5; distance <= maxRadius; distance += gridSize) {
          // Try different angles at this distance
          for (let angle = 0; angle < 360; angle += 15) {
            const rad = (angle * Math.PI) / 180
            const testX = baseX + distance * Math.cos(rad)
            const testY = baseY + distance * Math.sin(rad)
            
            // Check bounds
            if (testX < 5 || testX > 95 || testY < 5 || testY > 95) {
              continue
            }
            
            // Check if this position overlaps with any placed bubble
            let hasOverlap = false
            for (const bubble of placedBubbles) {
              if (isOverlapping(testX, testY, radius, bubble.x, bubble.y, bubble.z)) {
                hasOverlap = true
                break
              }
            }
            
            if (!hasOverlap) {
              x = testX
              y = testY
              placed = true
              break searchLoop
            }
          }
        }
      }
      
      // If we still couldn't place it, put it at a far edge
      if (!placed) {
        const angle = (itemIndex / sortedData.length) * Math.PI * 2
        x = baseX + 40 * Math.cos(angle)
        y = baseY + 40 * Math.sin(angle)
      }
      
      const bubble: BubbleData = {
        x,
        y,
        z: radius,
        name: categoryConfig[item.category]?.label || 'Other',
        color: categoryConfig[item.category]?.color || '#8884d8',
        amount: item.amount,
        percentage: item.percentage,
        count: item.count,
      }
      
      placedBubbles.push(bubble)
    })
    
    return placedBubbles
  }, [data, categoryConfig])

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as BubbleData
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{data.name}</p>
          <p className={styles.tooltipValue}>
            Amount: {formatCurrency(data.amount, currency)}
          </p>
          <p className={styles.tooltipValue}>
            Percentage: {data.percentage.toFixed(1)}%
          </p>
          <p className={styles.tooltipValue}>
            Transactions: {data.count}
          </p>
        </div>
      )
    }
    return null
  }

  const renderCustomizedLabel = (props: any) => {
    const { cx, cy, payload } = props
    
    // Don't render if payload is undefined or doesn't have name
    if (!payload || !payload.name) {
      return null
    }
    
    return (
      <text
        x={cx}
        y={cy}
        fill="#fff"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={12}
        fontWeight="600"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
      >
        {payload.name}
      </text>
    )
  }

  return (
    <div className={styles.bubbleWrapper}>
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <XAxis
              type="number"
              dataKey="x"
              domain={[0, 100]}
              hide={true}
            />
            <YAxis
              type="number"
              dataKey="y"
              domain={[0, 100]}
              hide={true}
            />
            <ZAxis
              type="number"
              dataKey="z"
              range={[500, 3500]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter
              data={bubbleData}
              label={renderCustomizedLabel}
              animationDuration={300}
            >
              {bubbleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Category Legend */}
      <div className={styles.categoryButtons}>
        {data.map((item, index) => (
          <button
            key={item.category}
            className={styles.categoryButton}
            style={{
              borderColor: categoryConfig[item.category]?.color || '#8884d8',
              backgroundColor: `${categoryConfig[item.category]?.color || '#8884d8'}15`,
            }}
          >
            <span 
              className={styles.categoryButtonDot}
              style={{ backgroundColor: categoryConfig[item.category]?.color || '#8884d8' }}
            />
            <span className={styles.categoryButtonLabel}>
              {categoryConfig[item.category]?.label || 'Other'}
            </span>
            <span className={styles.categoryButtonPercent}>
              {item.percentage.toFixed(1)}%
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
