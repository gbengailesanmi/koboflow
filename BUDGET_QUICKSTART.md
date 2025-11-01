# Budget Database - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Create Database Indexes
```bash
yarn create-budget-indexes
```

### 2. Start Your Dev Server
```bash
yarn dev
```

### 3. Use the Budget Feature
Navigate to: `http://localhost:3000/{customerId}/budget`

---

## 📖 Quick Reference

### API Endpoints

```bash
# Get current budget with spending
GET /api/budget

# Save/update budget
POST /api/budget
{
  "monthly": 5000,
  "categories": [
    {"category": "food", "limit": 800}
  ]
}

# Partial update
PATCH /api/budget
{
  "monthly": 6000
}

# Recalculate spending
POST /api/budget/recalculate
```

### Available Categories
- `food` - Food & Dining
- `transport` - Transportation
- `shopping` - Shopping
- `entertainment` - Entertainment
- `utilities` - Bills & Utilities
- `housing` - Housing
- `healthcare` - Healthcare
- `other` - Other Expenses

---

## 🔄 Data Flow

```
User Sets Budget
    ↓
Budget Page → POST /api/budget → MongoDB budgets collection
    ↓
Saved to Database

User Syncs Bank
    ↓
Transactions Import → callback/route → bulkInsertTransactions
    ↓
Auto-trigger: recalculateMonthlySpending()
    ↓
MongoDB budget_spending collection updated

User Views Budget
    ↓
Budget Page → GET /api/budget
    ↓
Returns: budget + current month spending
    ↓
Shows progress bars & spending
```

---

## 💾 MongoDB Collections

### `budgets`
Stores user budget settings
- One document per customer
- Unique index on `customerId`

### `budget_spending`
Tracks actual spending per month
- One document per customer per month
- Unique index on `customerId + month`
- Auto-updated when transactions sync

---

## 🎯 Key Features

✅ **Real-time Updates** - Spending updates automatically when transactions sync  
✅ **Cross-device** - Budget settings sync across all devices  
✅ **Fast Performance** - Pre-calculated spending with indexed queries  
✅ **Category Tracking** - Track spending by category vs budget  
✅ **No Data Loss** - Persists in database, not localStorage  

---

## 🐛 Common Issues

**Budget not loading?**
- Check MongoDB is running
- Verify `MONGODB_URI` in `.env`
- Check browser console for errors

**Spending not updating?**
- Trigger manual recalc: `POST /api/budget/recalculate`
- Check transactions are in database
- Verify categorization is working

**Slow queries?**
- Run: `yarn create-budget-indexes`
- Check MongoDB indexes: `db.budgets.getIndexes()`

---

## 📚 Full Documentation

- **Setup Guide**: `BUDGET_DATABASE_SETUP.md`
- **Implementation Details**: `BUDGET_IMPLEMENTATION_SUMMARY.md`

---

## 💡 Pro Tips

1. **Auto-sync**: Budget spending updates automatically when you connect your bank
2. **Manual recalc**: Visit `/api/budget/recalculate` to force update
3. **Category limits**: Set individual category budgets for better tracking
4. **Monthly reset**: Spending resets each month automatically
5. **Historical data**: Coming soon - view past months' performance

---

Made with ❤️ for Money Mapper
