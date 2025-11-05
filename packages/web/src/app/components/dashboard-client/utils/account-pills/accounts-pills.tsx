'use client'

import { IconButton } from '@radix-ui/themes'
import React from 'react'
import styles from './account-pills.module.css'

type ActionButton = {
  key: string
  icon: React.ReactNode
  label: string
  onClick: () => void
}

type AccountsPillsProps = {
  buttons: ActionButton[]
}

export default function AccountsPills({ buttons }: AccountsPillsProps) {
  return (
    <div className={styles.PillsWrapper}>
      {buttons.map(({ key, icon, label, onClick }) => (
        <div 
          key={key} 
          role='button' 
          className={styles.ButtonWrapper}
          onClick={onClick} 
          aria-label={label}
        >
          <IconButton
            size='3'
            radius='full'
            variant='ghost'
            color='gray'
          >
            {icon}
          </IconButton>
          <span className={styles.LabelSpan}>{label}</span>
        </div>
      ))}
    </div>
  )
}