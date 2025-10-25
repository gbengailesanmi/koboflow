'use client'

import React, { useRef, useEffect, useState } from 'react'
import { CategoryData } from '../types/analytics-types'
import { formatCurrency } from '../utils/format-currency'
import styles from './pie-chart.module.css'

type PieChartProps = {
  data: CategoryData[]
  categoryConfig: Record<string, { label: string; color: string }>
  currency: string
}

export const PieChart: React.FC<PieChartProps> = ({ data, categoryConfig, currency }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [hoveredSlice, setHoveredSlice] = useState<number | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const size = 240
    const centerX = size / 2
    const centerY = size / 2
    const radius = 80

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    if (data.length === 0) return

    let startAngle = -Math.PI / 2 // Start from top

    data.forEach((item, index) => {
      const sliceAngle = (item.percentage / 100) * 2 * Math.PI
      const config = categoryConfig[item.category] || categoryConfig.other

      // Draw slice
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle)
      ctx.closePath()

      // Apply hover effect
      if (hoveredSlice === index) {
        ctx.fillStyle = config.color + 'CC' // Add transparency for hover
        ctx.shadowColor = config.color
        ctx.shadowBlur = 10
      } else {
        ctx.fillStyle = config.color
        ctx.shadowBlur = 0
      }

      ctx.fill()

      startAngle += sliceAngle
    })
  }, [data, categoryConfig, hoveredSlice])

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    setMousePosition({ x: event.clientX, y: event.clientY })

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = 80

    // Calculate distance from center
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
    
    if (distance <= radius) {
      // Calculate angle
      let angle = Math.atan2(y - centerY, x - centerX)
      angle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI) // Normalize to start from top

      // Find which slice this angle belongs to
      let cumulativeAngle = 0
      for (let i = 0; i < data.length; i++) {
        const sliceAngle = (data[i].percentage / 100) * 2 * Math.PI
        if (angle >= cumulativeAngle && angle < cumulativeAngle + sliceAngle) {
          setHoveredSlice(i)
          return
        }
        cumulativeAngle += sliceAngle
      }
    }
    
    setHoveredSlice(null)
  }

  const handleMouseLeave = () => {
    setHoveredSlice(null)
  }

  return (
    <div className={styles.pieChartWrapper}>
      <div className={styles.pieChartContainer}>
        <canvas
          ref={canvasRef}
          width={240}
          height={240}
          className={styles.pieCanvas}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        
        {/* Tooltip */}
        {hoveredSlice !== null && (
          <div 
            className={styles.pieTooltip}
            style={{
              position: 'fixed',
              left: mousePosition.x + 10,
              top: mousePosition.y - 10,
              pointerEvents: 'none',
              zIndex: 1000
            }}
          >
            <div className={styles.pieTooltipContent}>
              <div className={styles.pieTooltipTitle}>
                {categoryConfig[data[hoveredSlice].category]?.label || 'Other'}
              </div>
              <div className={styles.pieTooltipValue}>
                {formatCurrency(data[hoveredSlice].amount, currency)}
              </div>
              <div className={styles.pieTooltipPercentage}>
                {data[hoveredSlice].percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className={styles.pieLegend}>
        {data.map((item, index) => {
          const config = categoryConfig[item.category] || categoryConfig.other
          return (
            <div
              key={item.category}
              className={`${styles.pieLegendItem} ${hoveredSlice === index ? styles.pieLegendItemHover : ''}`}
              onMouseEnter={() => setHoveredSlice(index)}
              onMouseLeave={() => setHoveredSlice(null)}
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
    </div>
  )
}
