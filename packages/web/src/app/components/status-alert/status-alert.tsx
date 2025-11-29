import React from 'react'
import styles from './status-alert.module.css'

type StatusAlertProps = {
  icon: string
  title: string
  message: string
  type: 'success' | 'warning' | 'danger'
  className?: string
  style?: React.CSSProperties
}

export function StatusAlert({ icon, title, message, type, className = '', style }: StatusAlertProps) {
  const colorMap = {
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444'
  }

  return (
    <div className={`${styles.statusAlert} ${className}`} style={style}>
      <div className={styles.statusIcon}>{icon}</div>
      <div className={styles.statusContent}>
        <div className={styles.statusTitle} style={{ color: colorMap[type] }}>
          {title}
        </div>
        <div className={styles.statusMessage}>{message}</div>
      </div>
    </div>
  )
}
