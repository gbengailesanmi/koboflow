'use client'

import React, { useState } from 'react'
import { Dialog, Button, Flex, Text, TextField, Select, IconButton } from '@radix-ui/themes'
import { PlusIcon, TrashIcon, CheckIcon } from '@radix-ui/react-icons'
import type { Budget } from '@koboflow/shared'
import styles from './budget-switcher.module.css'

type BudgetSwitcherProps = {
  budgets: Budget[]
  activeBudget: Budget | null
  onSwitch: (budgetId: string) => Promise<void>
  onCreate: (name: string) => Promise<void>
  onDelete: (budgetId: string) => Promise<void>
  disabled?: boolean
}

export function BudgetSwitcher({
  budgets,
  activeBudget,
  onSwitch,
  onCreate,
  onDelete,
  disabled = false
}: BudgetSwitcherProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newBudgetName, setNewBudgetName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!newBudgetName.trim()) return
    
    setIsCreating(true)
    try {
      await onCreate(newBudgetName.trim())
      setNewBudgetName('')
      setIsCreateDialogOpen(false)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (budgetId: string) => {
    if (budgets.length <= 1) {
      return // Don't allow deleting the last budget
    }
    
    setDeletingId(budgetId)
    try {
      await onDelete(budgetId)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSwitch = async (budgetId: string) => {
    if (budgetId === activeBudget?._id || disabled) return
    await onSwitch(budgetId)
  }

  return (
    <div className={styles.container}>
      <Flex align="center" gap="3" className={styles.switcher}>
        <Select.Root
          value={activeBudget?._id || ''}
          onValueChange={handleSwitch}
          disabled={disabled}
        >
          <Select.Trigger className={styles.trigger} placeholder="Select budget..." />
          <Select.Content className={styles.content}>
            {budgets.map((budget) => (
              <Select.Item key={budget._id} value={budget._id || ''} className={styles.item}>
                <Flex align="center" justify="between" style={{ width: '100%' }}>
                  <Flex align="center" gap="2">
                    {budget.isActive && <CheckIcon />}
                    <Text>{budget.name}</Text>
                  </Flex>
                  {budgets.length > 1 && (
                    <IconButton
                      size="1"
                      variant="ghost"
                      color="red"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(budget._id!)
                      }}
                      disabled={deletingId === budget._id}
                      style={{ marginLeft: '8px' }}
                    >
                      <TrashIcon />
                    </IconButton>
                  )}
                </Flex>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Root>

        <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <Dialog.Trigger>
            <Button
              variant="soft"
              disabled={disabled || budgets.length >= 10}
              title={budgets.length >= 10 ? 'Maximum 10 budgets allowed' : 'Create new budget'}
            >
              <PlusIcon />
              New
            </Button>
          </Dialog.Trigger>

          <Dialog.Content className={styles.dialog}>
            <Dialog.Title>Create New Budget</Dialog.Title>
            <Dialog.Description size="2" mb="4">
              Create a new budget to track different spending goals or time periods.
            </Dialog.Description>

            <Flex direction="column" gap="3">
              <label>
                <Text as="div" size="2" mb="1" weight="bold">
                  Budget Name
                </Text>
                <TextField.Root
                  placeholder="e.g., 2025 Monthly Budget"
                  value={newBudgetName}
                  onChange={(e) => setNewBudgetName(e.target.value)}
                  disabled={isCreating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newBudgetName.trim()) {
                      handleCreate()
                    }
                  }}
                />
              </label>
            </Flex>

            <Flex gap="3" mt="4" justify="end">
              <Dialog.Close>
                <Button variant="soft" color="gray" disabled={isCreating}>
                  Cancel
                </Button>
              </Dialog.Close>
              <Button
                onClick={handleCreate}
                disabled={!newBudgetName.trim() || isCreating}
              >
                {isCreating ? 'Creating...' : 'Create Budget'}
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>

      {budgets.length >= 10 && (
        <Text size="1" color="gray" className={styles.hint}>
          Maximum budget limit reached (10/10)
        </Text>
      )}
    </div>
  )
}
