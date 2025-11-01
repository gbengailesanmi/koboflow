# Budget Database Setup

## Overview
This setup creates a comprehensive budget management system with MongoDB collections for budget settings and spending tracking.

## Database Collections

### 1. `budgets`
Stores budget configuration for each user.

**Schema:**
```typescript
{
  _id: ObjectId
  customerId: string (unique)
  monthly: number           // Monthly total budget
  categories: [             // Array of category-specific budgets
    {
      category: string      // e.g., 'food', 'transport', etc.
      limit: number         // Budget limit for this category
    }
  ]
  createdAt: Date
  updatedAt: Date
}
```

**Indexes:**
- `{ customerId: 1 }` (unique) - Fast lookup by customer
- `{ updatedAt: -1 }` - Query recent updates

### 2. `budget_spending`
Tracks actual spending per month (updated when transactions sync).

**Schema:**
```typescript
{
  _id: ObjectId
  customerId: string
  month: string             // Format: "YYYY-MM" (e.g., "2025-11")
  totalSpent: number        // Total expenses for the month
  categorySpending: [       // Breakdown by category
    {
      category: string
      amount: number
    }
  ]
  createdAt: Date
  updatedAt: Date
}
```

**Indexes:**
- `{ customerId: 1, month: 1 }` (unique) - Fast lookup by customer and month
- `{ customerId: 1, updatedAt: -1 }` - Query recent spending

## API Endpoints

### GET /api/budget
Fetch budget settings with current month spending data.

**Response:**
```json
{
  "customerId": "...",
  "monthly": 5000,
  "categories": [
    { "category": "food", "limit": 800 },
    { "category": "transport", "limit": 300 }
  ],
  "currentSpending": {
    "month": "2025-11",
    "totalSpent": 2345,
    "categorySpending": [
      { "category": "food", "amount": 456 },
      { "category": "transport", "amount": 123 }
    ]
  }
}
```

### POST /api/budget
Create or update budget settings.

**Request Body:**
```json
{
  "monthly": 5000,
  "categories": [
    { "category": "food", "limit": 800 },
    { "category": "transport", "limit": 300 }
  ]
}
```

### PATCH /api/budget
Partial update of budget settings.

**Request Body:**
```json
{
  "monthly": 6000  // Only update monthly budget
}
```
or
```json
{
  "categories": [...]  // Only update categories
}
```

### POST /api/budget/recalculate
Recalculate spending for current month from transactions.
Call this after syncing new transactions.

## Setup Instructions

### 1. Create Database Indexes
Run this command to create the necessary indexes:

```bash
npm run create-budget-indexes
```

Or manually:
```bash
node -r ts-node/register src/db/indexes/budget-indexer.ts
```

### 2. Migration (Optional)
If you have existing budget data in localStorage, you can migrate it:

```typescript
// In browser console on budget page
const customerId = 'your-customer-id'
const oldData = localStorage.getItem(`budget-data-${customerId}`)
if (oldData) {
  const parsed = JSON.parse(oldData)
  fetch('/api/budget', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed)
  }).then(() => console.log('Migrated!'))
}
```

## Automatic Spending Updates

### When to Recalculate
Call the recalculate endpoint after:
1. User syncs transactions from bank
2. Transactions are added/updated manually
3. User requests a refresh

### Example Integration
In your transaction sync callback:

```typescript
// After successfully syncing transactions
await fetch('/api/budget/recalculate', {
  method: 'POST'
})
```

## Benefits

### ✅ Centralized Data
- Budget settings stored in database, not localStorage
- Accessible across devices
- No data loss on browser cache clear

### ✅ Performance
- Indexed queries for fast lookups
- Pre-calculated spending data
- No need to aggregate transactions on every page load

### ✅ Real-time Updates
- Spending automatically recalculates when transactions update
- Budget progress reflects actual data
- Category spending tracked accurately

### ✅ Scalability
- Efficient for large transaction volumes
- Monthly spending cached for quick access
- Can add historical tracking easily

## Future Enhancements

Potential additions:
- Historical budget tracking (past months)
- Budget alerts/notifications when thresholds exceeded
- Budget recommendations based on spending patterns
- Multiple budget templates
- Shared budgets (family/household)
- Budget forecasting
- Recurring budget adjustments

## Testing

Test the setup:

```bash
# 1. Create indexes
npm run create-budget-indexes

# 2. Test API endpoints
curl http://localhost:3000/api/budget

# 3. Update budget
curl -X POST http://localhost:3000/api/budget \
  -H "Content-Type: application/json" \
  -d '{"monthly": 5000, "categories": []}'

# 4. Recalculate spending
curl -X POST http://localhost:3000/api/budget/recalculate
```
