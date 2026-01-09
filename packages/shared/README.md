# @koboflow/shared

Shared package containing TypeScript types, utilities, constants, and validation schemas used across the Koboflow monorepo.

## 📦 Installation

This package is part of the Koboflow monorepo and is used as a workspace dependency:

```json
{
  "dependencies": {
    "@koboflow/shared": "workspace:*"
  }
}
```

## 🏗️ Building

```bash
yarn build    # Compile TypeScript
yarn dev      # Watch mode for development
```

## 📚 Exports

### Types

```typescript
import {
  Account,
  Transaction,
  Budget,
  CategoryBudget,
  BudgetPeriod,
  CustomCategory,
  SignupFormSchema,
  FormState,
  SessionPayload,
} from '@koboflow/shared/types'
```

### Utilities

```typescript
import { formatCurrency, formatDate } from '@koboflow/shared/utils'

formatCurrency(1234.56, 'USD') // "$1,234.56"
formatDate(new Date()) // "November 5, 2025"
```

### Constants

```typescript
import { API_BASE_URL, TRANSACTION_CATEGORIES, BUDGET_PERIODS } from '@koboflow/shared/constants'
```

## 🔧 Usage Examples

### In Web Package

```typescript
// pages/dashboard.tsx
import { Account, Transaction } from '@koboflow/shared/types'
import { formatCurrency } from '@koboflow/shared/utils'

const Dashboard = () => {
  const account: Account = {
    // ... account data
  }
  
  return <div>{formatCurrency(parseFloat(account.balance))}</div>
}
```

### In Backend Package

```typescript
// routes/transactions.ts
import { Transaction } from '@koboflow/shared/types'
import { Router } from 'express'

const router = Router()

router.get('/', async (req, res) => {
  const transactions: Transaction[] = await getTransactions()
  res.json(transactions)
})
```

### In Mobile Package

```typescript
// screens/TransactionList.tsx
import { Transaction } from '@koboflow/shared/types'
import { formatCurrency, formatDate } from '@koboflow/shared/utils'

const TransactionItem = ({ transaction }: { transaction: Transaction }) => {
  return (
    <View>
      <Text>{formatCurrency(transaction.unscaledValue)}</Text>
      <Text>{formatDate(transaction.bookedDate)}</Text>
    </View>
  )
}
```

## 🎯 Adding New Shared Code

### Adding a New Type

1. Create file in `src/types/`:
```typescript
// src/types/notification.ts
export type Notification = {
  id: string
  userId: string
  message: string
  read: boolean
  createdAt: Date
}
```

2. Export from `src/types/index.ts`:
```typescript
export * from './notification'
```

3. Rebuild the package:
```bash
yarn build
```

### Adding a New Utility

1. Add to `src/utils/index.ts`:
```typescript
export const truncate = (str: string, length: number): string => {
  return str.length > length ? str.substring(0, length) + '...' : str
}
```

2. Rebuild and use in other packages

### Adding Validation Schemas

```typescript
// src/types/transaction-validation.ts
import { z } from 'zod'

export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  narration: z.string().min(1),
  currencyCode: z.string().length(3),
})
```

## 🔄 Development Workflow

When working on shared code:

1. Make changes in `packages/shared/src/`
2. Run `yarn build` in shared package
3. Changes will be available in other packages
4. For active development, use `yarn dev` in shared package (watch mode)

## ⚠️ Important Notes

- **Always build after changes:** Other packages depend on the compiled output
- **Type safety:** All types are strongly typed with TypeScript
- **No runtime dependencies:** Shared package should only have dev dependencies (except Zod)
- **Backwards compatibility:** Be careful when changing existing types

## 📋 Package Contents

```
src/
├── index.ts              # Main entry point
├── types/
│   ├── index.ts         # Type exports
│   ├── account.ts       # Account types
│   ├── transaction.ts   # Transaction types
│   ├── budget.ts        # Budget types
│   ├── custom-category.ts
│   └── auth.ts          # Auth types & schemas
├── utils/
│   └── index.ts         # Utility functions
└── constants/
    └── index.ts         # Shared constants
```

## 🧪 Testing

```bash
# Run type checking
yarn tsc --noEmit

# Run in development with type checking
yarn dev
```

## 📄 License

Private - Part of Koboflow monorepo
