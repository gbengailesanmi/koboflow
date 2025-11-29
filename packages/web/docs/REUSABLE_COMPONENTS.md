# Reusable UI Components

This document describes the reusable UI components that have been extracted from page-specific code to promote consistency and reduce code duplication.

## Overview

During the refactoring process, several inline styled components were identified across the Analytics and Budget pages. These have been extracted into reusable components with their own styles.

## Components

### 1. EmptyState

A consistent empty state display for when there's no data to show.

**Location:** `/packages/web/src/app/components/empty-state/`

**Props:**
```typescript
{
  icon: string          // Emoji or icon to display
  title: string         // Main heading
  description: string   // Descriptive text
  className?: string    // Optional additional CSS class
}
```

**Usage:**
```tsx
import { EmptyState } from '@/app/components/empty-state'

<EmptyState
  icon="💰"
  title="No transactions yet"
  description="Add some transactions to start tracking your budget"
/>
```

**Features:**
- Glassmorphism effect with backdrop blur
- Theme-aware (light/dark mode support)
- Consistent padding and spacing
- Centered content layout

---

### 2. StatusAlert

An alert component for displaying status messages with different severity levels.

**Location:** `/packages/web/src/app/components/status-alert/`

**Props:**
```typescript
{
  icon: string                    // Emoji or icon to display
  title: string                   // Alert title
  message: string                 // Alert message
  type: 'success' | 'warning' | 'danger'
  className?: string              // Optional additional CSS class
  style?: React.CSSProperties     // Optional inline styles
}
```

**Usage:**
```tsx
import { StatusAlert } from '@/app/components/status-alert'

<StatusAlert
  icon="⚠️"
  title="Over Budget"
  message="You've exceeded your budget by $150.00"
  type="danger"
/>
```

**Type Colors:**
- `success`: #10b981 (green)
- `warning`: #f59e0b (orange)
- `danger`: #ef4444 (red)

**Features:**
- Flexible icon and message display
- Color-coded titles based on severity
- Consistent styling across the app
- Supports custom styling via className and style props

---

### 3. ChartPlaceholder

A placeholder component for charts when there's no data or for "coming soon" features.

**Location:** `/packages/web/src/app/components/chart-placeholder/`

**Props:**
```typescript
{
  icon: string                          // Emoji or icon to display
  message: string                       // Message to display
  type?: 'no-data' | 'coming-soon'     // Placeholder type (default: 'no-data')
  className?: string                    // Optional additional CSS class
}
```

**Usage:**
```tsx
import { ChartPlaceholder } from '@/app/components/chart-placeholder'

// No data placeholder
<ChartPlaceholder
  icon="📈"
  message="No expense data for this period"
  type="no-data"
/>

// Coming soon placeholder
<ChartPlaceholder
  icon="📊"
  message="More chart types coming soon!"
  type="coming-soon"
/>
```

**Features:**
- Two distinct types: `no-data` and `coming-soon`
- Consistent sizing and spacing
- Theme-aware color variables
- Centered content with flexible height

---

## Implementation Details

### File Structure

Each component follows the standard structure:

```
component-name/
  ├── component-name.tsx         # Component implementation
  ├── component-name.module.css  # Component styles
  └── index.ts                   # Export file
```

### CSS Module Patterns

All components use CSS Modules to ensure style encapsulation and avoid naming conflicts. The styles follow these patterns:

1. **Theme Variables**: Use CSS custom properties (e.g., `var(--gray-12)`) for theme-aware colors
2. **Light/Dark Mode Support**: Explicit class selectors for theme switching
3. **Responsive Design**: Mobile-first approach with appropriate breakpoints
4. **Consistent Spacing**: Standard padding/margin values aligned with design system

### Benefits

1. **Consistency**: Same look and feel across all pages
2. **Maintainability**: Single source of truth for each component
3. **Reusability**: Easy to use across different pages
4. **Type Safety**: Full TypeScript support with typed props
5. **Theme Support**: Built-in light/dark mode compatibility
6. **Reduced Code Duplication**: DRY principle applied

---

## Migration

### Before (Budget Page)
```tsx
<div className={analyticsStyles.emptyState}>
  <div className={analyticsStyles.emptyStateContent}>
    <div className={analyticsStyles.emptyStateIcon}>💰</div>
    <h3 className={analyticsStyles.emptyStateTitle}>No transactions yet</h3>
    <p className={analyticsStyles.emptyStateText}>
      Add some transactions to start tracking your budget
    </p>
  </div>
</div>
```

### After (Budget Page)
```tsx
<EmptyState
  icon="💰"
  title="No transactions yet"
  description="Add some transactions to start tracking your budget"
/>
```

---

## Usage Across Pages

### Analytics Page
- `EmptyState`: No transactions state
- `ChartPlaceholder`: No data in charts, coming soon features

### Budget Page
- `EmptyState`: No transactions, all categories have budgets
- `StatusAlert`: Budget status (over budget, approaching limit, on track), category allocation warnings

---

## Future Enhancements

Potential improvements for these components:

1. **EmptyState**
   - Add optional action button
   - Support for custom action handlers
   - Animation on mount

2. **StatusAlert**
   - Add dismissible functionality
   - Support for multiple lines of text
   - Animation variants

3. **ChartPlaceholder**
   - Loading skeleton variant
   - Custom height support
   - Animation options

---

## Related Documentation

- [Page Layout Template](./PAGE_LAYOUT_TEMPLATE.md)
- [Budget Layout Update](./BUDGET_LAYOUT_UPDATE.md)
