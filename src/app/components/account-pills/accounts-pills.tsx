'use client'

import { IconButton } from '@radix-ui/themes'
import React from 'react'

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
    <div className="h-auto w-full mt-2 flex flex-row">
      {buttons.map(({ key, icon, label, onClick }) => (
        <div key={key} role='button' className="flex flex-col justify-between w-full items-center"
          onClick={onClick} aria-label={label}>
          <IconButton
            size="3"
            radius="full"
            variant="ghost"
            color="gray"
          >
            {icon}
          </IconButton>
          <span className="text-[10px] font-medium">{label}</span>
        </div>
      ))}
    </div>
  )
}