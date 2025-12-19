import React from 'react'
import { Progress } from '@radix-ui/themes'

type ProgressColor = 'red' | 'orange' | 'green' | 'blue'

type BudgetProgressProps = {
  value: number
  label: string
  percentage: number
  color?: ProgressColor
  size?: '1' | '2' | '3'
  showPercentage?: boolean
  className?: string
  style?: React.CSSProperties
}

export function BudgetProgress({
  value,
  label,
  percentage,
  color,
  size = '3',
  showPercentage = false,
  className = '',
  style = {}
}: BudgetProgressProps) {
  const progressColor = color || (
    percentage >= 100 ? 'red' :
    percentage >= 80 ? 'orange' :
    'green'
  )

  return (
    <div className={className} style={style}>
      {showPercentage && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: 500,
            color: '#6b7280'
          }}>
            {label}
          </span>
          <span style={{ 
            fontSize: '14px', 
            fontWeight: 600,
            color: percentage >= 100 ? '#ef4444' : '#374151'
          }}>
            {percentage.toFixed(1)}%
          </span>
        </div>
      )}
      <Progress 
        value={Math.min(value, 100)}
        color={progressColor}
        size={size}
      />
    </div>
  )
}
