# Component Documentation

This document provides comprehensive documentation for all React components in the Consolidate Budget E2E application.

## Component Architecture

The application follows a modular component architecture with clear separation of concerns:

- **Pages**: Top-level route components
- **Forms**: Form handling and validation
- **UI Components**: Reusable interface elements
- **Layout Components**: Header, footer, and structural elements
- **Hooks**: Custom React hooks for shared logic

## Component Structure

```
src/app/
├── components/          # Reusable UI components
│   ├── header/         # Header component
│   ├── footer/         # Footer component
│   ├── accounts-row/   # Account display component
│   └── transactions-column/ # Transaction list component
├── forms/              # Form components
│   ├── signup-form.tsx # User registration form
│   └── login-form.tsx  # User authentication form
└── [customerId]/       # Customer-specific pages
    └── dashboard/      # Dashboard page component
```

## Core Components

### 1. Layout Components

#### Header Component

**Location**: `src/app/components/header/Header.tsx`

A responsive navigation header component providing branding and navigation.

**Props**: None (uses global state/context)

**Features**:
- Responsive design
- Theme toggle (light/dark)
- User authentication status
- Navigation menu

**Usage**:
```tsx
import Header from '@/app/components/header/Header'

function Page() {
  return (
    <>
      <Header />
      {/* Page content */}
    </>
  )
}
```

**Styling**: Uses Tailwind CSS with custom styled-components

#### Footer Component

**Location**: `src/app/components/footer/Footer.tsx`

A responsive footer component with application information and links.

**Props**: None

**Features**:
- Copyright information
- Links to legal pages
- Social media links
- Responsive layout

**Usage**:
```tsx
import Footer from '@/app/components/footer/Footer'

function Page() {
  return (
    <>
      {/* Page content */}
      <Footer />
    </>
  )
}
```

### 2. Financial Data Components

#### AccountsRow Component

**Location**: `src/app/components/accounts-row/AccountsRow.tsx`

Displays user's financial accounts in a horizontally scrollable row format.

**Props**:
```tsx
interface AccountsRowProps {
  accounts: Accounts
}

type Accounts = {
  accounts: Account[]
  nextPageToken: string
}
```

**Features**:
- Horizontal scrolling
- Account balance display
- Account type indicators
- Real-time balance updates
- Loading states

**Usage**:
```tsx
import AccountsRow from '@/app/components/accounts-row/AccountsRow'

function Dashboard() {
  const [accounts, setAccounts] = useState<Accounts>({ accounts: [], nextPageToken: '' })
  
  return (
    <AccountsRow accounts={accounts} />
  )
}
```

**Account Data Structure**:
```tsx
type Account = {
  id: string
  name: string
  type: string
  balances: {
    booked: BalanceDetail
    available: BalanceDetail
  }
  identifiers: {
    sortCode?: SortCodeIdentifier
    financialInstitution?: FinancialInstitutionIdentifier
    iban?: IbanIdentifier
  }
  dates: {
    lastRefreshed: string
  }
  financialInstitutionId: string
  customerSegment: string
}
```

#### TransactionsColumn Component

**Location**: `src/app/components/transactions-column/TransactionsColumn.tsx`

Displays user's financial transactions in a vertically scrollable column format.

**Props**:
```tsx
interface TransactionsColumnProps {
  transactions: Transaction[]
}
```

**Features**:
- Vertical scrolling
- Transaction categorization
- Amount formatting
- Date formatting
- Transaction status indicators
- Search and filtering capabilities

**Usage**:
```tsx
import TransactionsColumn from '@/app/components/transactions-column/TransactionsColumn'

function Dashboard() {
  const [transactions, setTransactions] = useState([])
  
  return (
    <TransactionsColumn transactions={transactions} />
  )
}
```

**Transaction Data Structure**:
```tsx
type Transaction = {
  id: string
  accountId: string
  customerId: string
  unscaledValue: number
  scale: number
  currencyCode: string
  descriptions: {
    display: string
    original: string
    enriched?: string
  }
  bookedDate: string
  identifiers: Record<string, any>
  types: string[]
  status: string
  providerMutability: string
}
```

### 3. Form Components

#### SignupForm Component

**Location**: `src/app/forms/signup-form.tsx`

User registration form with validation and error handling.

**Props**: None (handles its own state)

**Features**:
- Real-time validation
- Password strength checking
- Error message display
- Accessibility support
- Form submission handling

**Usage**:
```tsx
import SignupForm from '@/app/forms/signup-form'

function SignupPage() {
  return (
    <main className="p-4">
      <h1>Create Account</h1>
      <SignupForm />
    </main>
  )
}
```

**Validation Schema** (Zod):
```tsx
const SignupFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').trim(),
  email: z.string().email('Invalid email').trim(),
  password: z.string()
    .min(8, 'At least 8 characters')
    .regex(/[a-zA-Z]/, 'Include a letter')
    .regex(/[0-9]/, 'Include a number')
    .regex(/[^a-zA-Z0-9]/, 'Include a special character')
})
```

**Form State**:
```tsx
type FormState = {
  errors?: {
    name?: string[]
    email?: string[]
    password?: string[]
  }
  message?: string
} | undefined
```

#### LoginForm Component

**Location**: `src/app/forms/login-form.tsx`

User authentication form with session management.

**Props**: None (handles its own state)

**Features**:
- Email/password authentication
- "Remember me" functionality
- Error handling
- Redirect after login
- Loading states

**Usage**:
```tsx
import LoginForm from '@/app/forms/login-form'

function LoginPage() {
  return (
    <main className="p-4">
      <h1>Sign In</h1>
      <LoginForm />
    </main>
  )
}
```

### 4. Page Components

#### PortfolioPage (Dashboard)

**Location**: `src/app/[customerId]/dashboard/page.tsx`

Main dashboard component displaying user's financial portfolio.

**Props**: None (uses URL parameters and search params)

**Features**:
- Account overview
- Transaction history
- Resizable layout (drag handle)
- Real-time data fetching
- Loading and error states

**State Management**:
```tsx
const [accounts, setAccounts] = useState<Accounts>({ accounts: [], nextPageToken: '' })
const [transactions, setTransactions] = useState([])
```

**Data Fetching**:
```tsx
useEffect(() => {
  async function fetchData() {
    const res = await fetch(`/api/portfolio?customerId=${customerId}`)
    const data = await res.json()
    setAccounts(data.accounts)
    setTransactions(data.transactions)
  }

  if (customerId) fetchData()
}, [customerId])
```

**Layout Structure**:
- Top grid: Summary information
- Drag handle: Resizable divider
- Bottom grid: Accounts row and transactions column

#### SignupPage

**Location**: `src/app/signup/page.tsx`

User registration page wrapper.

**Features**:
- Page title and meta
- SignupForm integration
- Layout and styling

#### LoginPage

**Location**: `src/app/login/page.tsx`

User authentication page wrapper.

**Features**:
- Page title and meta
- LoginForm integration
- Layout and styling

## Custom Hooks

### DragHeight Hook

**Location**: `src/hooks/drag-height.ts`

Custom hook for implementing resizable UI components.

**Usage**:
```tsx
import { DragHeight } from '@/hooks/drag-height'

function ResizableComponent() {
  const { height, heightAsStyle, handleDragStart } = DragHeight()
  
  return (
    <div>
      <div style={{ height: heightAsStyle }}>Resizable content</div>
      <div onMouseDown={handleDragStart}>Drag handle</div>
    </div>
  )
}
```

**Returns**:
```tsx
{
  height: number          // Current height percentage
  heightAsStyle: string   // CSS height value
  handleDragStart: (e: MouseEvent | TouchEvent) => void
}
```

**Features**:
- Mouse and touch support
- Percentage-based height calculation
- Smooth drag interaction
- Boundary constraints

## Styling System

### Tailwind CSS

Primary styling system using utility classes:

```tsx
// Example component styling
<div className="bg-blue-950 min-h-screen w-full">
  <div className="flex flex-col h-[100%]">
    <span className="text-lg font-semibold">Title</span>
  </div>
</div>
```

### Styled Components

Used for complex styling and dynamic styles:

```tsx
import styled from 'styled-components'

const StyledSection = styled.section`
  display: grid;
  grid-template-rows: auto auto 1fr;
  height: 100vh;
`

const DragHandle = styled.div<{ $top: string }>`
  position: fixed;
  top: ${props => props.$top};
  left: 0;
  right: 0;
  height: 20px;
  cursor: row-resize;
`
```

### Radix UI Themes

Component library providing accessible UI primitives:

```tsx
import { ScrollArea, Theme } from '@radix-ui/themes'

function Component() {
  return (
    <Theme>
      <ScrollArea type="always" scrollbars="horizontal">
        {/* Content */}
      </ScrollArea>
    </Theme>
  )
}
```

## Component Best Practices

### 1. Props and TypeScript

Always define explicit prop types:

```tsx
interface ComponentProps {
  title: string
  isLoading?: boolean
  onSubmit: (data: FormData) => void
  children?: React.ReactNode
}

function Component({ title, isLoading = false, onSubmit, children }: ComponentProps) {
  // Component implementation
}
```

### 2. State Management

Use appropriate state management patterns:

```tsx
// Local state for component-specific data
const [isOpen, setIsOpen] = useState(false)

// Effect for data fetching
useEffect(() => {
  fetchData()
}, [dependency])

// Custom hooks for reusable logic
const { data, loading, error } = useApiData(endpoint)
```

### 3. Error Boundaries

Implement error handling:

```tsx
function ComponentWithErrorHandling() {
  const [error, setError] = useState<string | null>(null)
  
  if (error) {
    return <div>Error: {error}</div>
  }
  
  return (
    // Component JSX
  )
}
```

### 4. Accessibility

Ensure components are accessible:

```tsx
function AccessibleComponent() {
  return (
    <button
      type="button"
      aria-label="Close dialog"
      aria-expanded={isOpen}
      onClick={handleClick}
    >
      {buttonText}
    </button>
  )
}
```

### 5. Performance Optimization

Use React optimization techniques:

```tsx
// Memoization for expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data)
}, [data])

// Callback memoization
const handleClick = useCallback((id: string) => {
  onItemClick(id)
}, [onItemClick])

// Component memoization
const MemoizedComponent = memo(Component)
```

## Testing Components

### Unit Testing

Example component test:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Component from './Component'

describe('Component', () => {
  it('renders correctly', () => {
    render(<Component title="Test" />)
    expect(screen.getByText('Test')).toBeInTheDocument()
  })
  
  it('handles user interaction', async () => {
    const handleClick = jest.fn()
    render(<Component onClick={handleClick} />)
    
    await userEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalled()
  })
})
```

### Integration Testing

Test component integration with data flow:

```tsx
describe('Dashboard Integration', () => {
  it('displays account data correctly', async () => {
    // Mock API response
    const mockAccounts = [/* mock data */]
    
    render(<PortfolioPage />)
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Main Checking')).toBeInTheDocument()
    })
  })
})
```

## Component Composition

### Higher-Order Components

```tsx
function withLoading<T>(Component: React.ComponentType<T>) {
  return function LoadingComponent(props: T & { isLoading: boolean }) {
    if (props.isLoading) {
      return <div>Loading...</div>
    }
    return <Component {...props} />
  }
}
```

### Render Props Pattern

```tsx
interface DataFetcherProps {
  children: (data: any, loading: boolean, error: string | null) => React.ReactNode
}

function DataFetcher({ children }: DataFetcherProps) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Fetch logic...
  
  return children(data, loading, error)
}
```

## Future Component Enhancements

Planned component improvements:
- **Chart Components**: Data visualization for financial trends
- **Filter Components**: Advanced filtering for transactions
- **Export Components**: Data export functionality
- **Notification Components**: Real-time notifications
- **Settings Components**: User preference management
- **Help Components**: In-app help and tutorials

## Troubleshooting Components

### Common Issues

1. **Component Not Rendering**
   - Check prop types and required props
   - Verify component imports
   - Check conditional rendering logic

2. **State Not Updating**
   - Verify state setter calls
   - Check dependency arrays in useEffect
   - Ensure proper state immutability

3. **Styling Issues**
   - Check Tailwind class names
   - Verify styled-components syntax
   - Check CSS specificity conflicts

4. **Performance Issues**
   - Use React DevTools Profiler
   - Check for unnecessary re-renders
   - Optimize expensive operations

### Debug Tools

- **React Developer Tools**: Component inspection and profiling
- **Chrome DevTools**: Network and performance analysis
- **Tailwind CSS IntelliSense**: Class name autocomplete and validation
- **TypeScript**: Compile-time error checking