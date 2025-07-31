# Development Guide

This comprehensive guide covers development workflows, coding standards, and best practices for contributing to the Consolidate Budget E2E application.

## Development Workflow

### 1. Getting Started

**Prerequisites Check:**
```bash
# Verify Node.js version (18+)
node --version

# Verify package manager
yarn --version

# Verify PostgreSQL
psql --version
```

**Initial Setup:**
```bash
# Clone repository
git clone https://github.com/gbengailesanmi/consolidate-budget-e2e.git
cd consolidate-budget-e2e

# Install dependencies
yarn install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Set up database
yarn db:schema

# Start development server
yarn dev
```

### 2. Development Scripts

```bash
# Development
yarn dev              # Start development server
yarn build            # Build for production
yarn start            # Start production server
yarn lint             # Run ESLint
yarn type-check       # TypeScript type checking

# Database
yarn db:schema        # Push schema to database
yarn db:check         # Open Drizzle Studio
yarn db:migrate       # Run migrations (if using migrations)

# Utility
yarn analyze          # Bundle analysis
yarn clean            # Clean build artifacts
```

### 3. Git Workflow

**Branch Naming Convention:**
```bash
# Feature development
feature/user-authentication
feature/transaction-filtering

# Bug fixes
bugfix/login-validation-error
bugfix/mobile-responsive-issues

# Hotfixes
hotfix/security-patch
hotfix/database-connection

# Documentation
docs/api-documentation
docs/setup-guide
```

**Commit Message Format:**
```bash
# Format: type(scope): description

# Examples:
feat(auth): add JWT session management
fix(ui): resolve mobile layout issues
docs(api): update endpoint documentation
refactor(db): optimize transaction queries
test(auth): add login form validation tests
chore(deps): update dependencies
```

**Development Process:**
```bash
# 1. Create feature branch
git checkout -b feature/your-feature-name

# 2. Make changes with regular commits
git add .
git commit -m "feat(scope): descriptive message"

# 3. Keep branch updated
git fetch origin
git rebase origin/main

# 4. Push and create PR
git push origin feature/your-feature-name
# Create Pull Request on GitHub

# 5. After review approval
git checkout main
git pull origin main
git branch -d feature/your-feature-name
```

## Code Standards

### 1. TypeScript Configuration

**Strict Type Checking:**
```typescript
// Always use explicit types
interface UserProps {
  id: string;
  name: string;
  email: string;
}

// Use type guards
function isUser(data: unknown): data is User {
  return typeof data === 'object' && 
         data !== null && 
         'id' in data && 
         'email' in data;
}

// Avoid 'any' type
// Bad
const userData: any = response.data;

// Good
interface APIResponse {
  data: User;
  status: number;
}
const response: APIResponse = await api.getUser();
```

**Type Organization:**
```typescript
// types/index.ts - Export all types
export type { User } from './user';
export type { Account } from './account';
export type { Transaction } from './transaction';

// Use consistent naming
type ComponentProps = {
  // Props type for components
};

interface APIResponse {
  // API response interfaces
}

enum TransactionStatus {
  // Enums for constants
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed'
}
```

### 2. React Component Standards

**Component Structure:**
```tsx
// components/UserProfile/UserProfile.tsx
import React, { useState, useEffect } from 'react';
import type { User } from '@/types';
import { validateUser } from '@/utils/validation';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
  className?: string;
}

export default function UserProfile({ 
  userId, 
  onUpdate, 
  className = '' 
}: UserProfileProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const userData = await api.getUser(userId);
        
        if (!validateUser(userData)) {
          throw new Error('Invalid user data');
        }
        
        setUser(userData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUser();
    }
  }, [userId]);

  const handleUpdate = async (updatedUser: User) => {
    try {
      await api.updateUser(updatedUser);
      setUser(updatedUser);
      onUpdate?.(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    }
  };

  if (loading) {
    return <div className="loading">Loading user...</div>;
  }

  if (error) {
    return <div className="error">Error: {error}</div>;
  }

  if (!user) {
    return <div className="not-found">User not found</div>;
  }

  return (
    <div className={`user-profile ${className}`}>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      {/* Component content */}
    </div>
  );
}
```

**Hooks Best Practices:**
```tsx
// Custom hooks should start with 'use'
function useUserData(userId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Effect logic
  }, [userId]);

  return { user, loading, setUser };
}

// Use useCallback for event handlers
const handleClick = useCallback((id: string) => {
  onItemClick(id);
}, [onItemClick]);

// Use useMemo for expensive calculations
const expensiveValue = useMemo(() => {
  return heavyCalculation(data);
}, [data]);
```

### 3. Styling Standards

**Tailwind CSS Best Practices:**
```tsx
// Use consistent spacing scale
<div className="p-4 m-2 space-y-4">

// Group related classes
<div className="
  flex items-center justify-between
  p-4 rounded-lg border
  bg-white dark:bg-gray-800
  hover:shadow-md transition-shadow
">

// Use responsive design
<div className="
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3
  gap-4 md:gap-6 lg:gap-8
">

// Prefer Tailwind over custom CSS
// Bad
<div style={{ marginTop: '16px' }}>

// Good
<div className="mt-4">
```

**Styled Components (when needed):**
```tsx
import styled from 'styled-components';

// Use descriptive names
const StyledUserCard = styled.div<{ $isActive?: boolean }>`
  padding: 1rem;
  border-radius: 0.5rem;
  background-color: ${props => props.$isActive ? '#3b82f6' : '#f3f4f6'};
  
  @media (min-width: 768px) {
    padding: 1.5rem;
  }
`;

// Use $ prefix for transient props
<StyledUserCard $isActive={isActive}>
```

### 4. API and Data Handling

**API Client Structure:**
```typescript
// lib/api/client.ts
class APIClient {
  private baseURL: string;
  private headers: Record<string, string>;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || '/api';
    this.headers = {
      'Content-Type': 'application/json',
    };
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Custom error class
class APIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'APIError';
  }
}
```

**Data Validation:**
```typescript
// lib/validation.ts
import { z } from 'zod';

// Define schemas
export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  email: z.string().email(),
  customerId: z.string(),
});

export const TransactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  description: z.string(),
  date: z.string().datetime(),
});

// Validation functions
export function validateUser(data: unknown): User {
  return UserSchema.parse(data);
}

export function isValidTransaction(data: unknown): data is Transaction {
  return TransactionSchema.safeParse(data).success;
}
```

### 5. Error Handling Patterns

**Component Error Handling:**
```tsx
function DataComponent() {
  const [error, setError] = useState<string | null>(null);

  const handleAsyncOperation = async () => {
    try {
      setError(null);
      await riskyOperation();
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : 'An unexpected error occurred';
      setError(errorMessage);
      
      // Log error for debugging
      console.error('Operation failed:', err);
      
      // Optionally report to error tracking service
      if (process.env.NODE_ENV === 'production') {
        reportError(err);
      }
    }
  };

  if (error) {
    return (
      <div className="error-state">
        <p>Something went wrong: {error}</p>
        <button onClick={() => setError(null)}>
          Try Again
        </button>
      </div>
    );
  }

  // Component content
}
```

**API Route Error Handling:**
```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = CreateUserSchema.parse(body);
    
    // Process request
    const user = await createUser(validatedData);
    
    return NextResponse.json(user, { status: 201 });
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    
    if (error instanceof DatabaseError) {
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }
    
    // Generic error
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Strategy

### 1. Component Testing

```typescript
// __tests__/components/UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserProfile } from '@/components/UserProfile';
import { mockUser } from '@/mocks/user';

// Mock API calls
jest.mock('@/lib/api', () => ({
  getUser: jest.fn(),
  updateUser: jest.fn(),
}));

describe('UserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders user data correctly', async () => {
    const mockGetUser = require('@/lib/api').getUser;
    mockGetUser.mockResolvedValue(mockUser);

    render(<UserProfile userId="123" />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(mockUser.name)).toBeInTheDocument();
    });
  });

  it('handles user update', async () => {
    const mockUpdateUser = require('@/lib/api').updateUser;
    const onUpdate = jest.fn();

    render(<UserProfile userId="123" onUpdate={onUpdate} />);

    // Simulate user interaction
    await userEvent.click(screen.getByRole('button', { name: /edit/i }));

    // Assert behavior
    expect(mockUpdateUser).toHaveBeenCalled();
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({
      id: '123'
    }));
  });
});
```

### 2. API Testing

```typescript
// __tests__/api/users.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/app/api/users/route';

describe('/api/users', () => {
  it('creates a user successfully', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'John Doe',
        email: 'john@example.com'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    
    const data = JSON.parse(res._getData());
    expect(data).toHaveProperty('id');
    expect(data.name).toBe('John Doe');
  });

  it('validates input data', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'A', // Too short
        email: 'invalid-email'
      }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    
    const data = JSON.parse(res._getData());
    expect(data.error).toBe('Validation failed');
  });
});
```

## Performance Optimization

### 1. Code Splitting

```tsx
// Dynamic imports for large components
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  {
    loading: () => <div>Loading...</div>,
    ssr: false // Client-side only if needed
  }
);

// Route-level code splitting happens automatically with Next.js
```

### 2. Image Optimization

```tsx
import Image from 'next/image';

// Always use Next.js Image component
<Image
  src="/profile-picture.jpg"
  alt="User profile"
  width={200}
  height={200}
  priority // For above-the-fold images
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 3. Database Optimization

```typescript
// lib/db/queries.ts

// Use indexes for frequently queried columns
export async function getUserTransactions(userId: string, limit = 50) {
  return db.select()
    .from(transactions)
    .where(eq(transactions.customerId, userId))
    .orderBy(desc(transactions.bookedDate))
    .limit(limit);
}

// Use prepared statements for repeated queries
const getUserById = db.select()
  .from(users)
  .where(eq(users.id, placeholder('userId')))
  .prepare();

export function findUser(userId: string) {
  return getUserById.execute({ userId });
}
```

## Security Considerations

### 1. Input Validation

```typescript
// Always validate and sanitize input
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const UserInputSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  bio: z.string().max(500).optional(),
});

function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input);
}
```

### 2. Authentication Checks

```typescript
// lib/auth.ts
import { getSession } from '@/lib/session';

export async function requireAuth(request: Request) {
  const session = await getSession(request);
  
  if (!session) {
    throw new Error('Authentication required');
  }
  
  return session;
}

// Use in API routes
export async function GET(request: NextRequest) {
  const session = await requireAuth(request);
  
  // Authorized logic here
}
```

### 3. CSRF Protection

```typescript
// Verify requests come from your domain
export function verifyCsrfToken(request: NextRequest) {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  if (origin !== process.env.NEXTAUTH_URL) {
    throw new Error('Invalid origin');
  }
}
```

## Monitoring and Debugging

### 1. Logging

```typescript
// lib/logger.ts
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;

  constructor() {
    this.level = process.env.NODE_ENV === 'production' 
      ? LogLevel.INFO 
      : LogLevel.DEBUG;
  }

  private log(level: LogLevel, message: string, data?: any) {
    if (level <= this.level) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${LogLevel[level]}: ${message}`, data || '');
    }
  }

  info(message: string, data?: any) {
    this.log(LogLevel.INFO, message, data);
  }

  error(message: string, error?: Error) {
    this.log(LogLevel.ERROR, message, error?.stack);
  }

  debug(message: string, data?: any) {
    this.log(LogLevel.DEBUG, message, data);
  }
}

export const logger = new Logger();
```

### 2. Performance Monitoring

```tsx
// components/PerformanceMonitor.tsx
import { useEffect } from 'react';

export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor page load performance
    if (typeof window !== 'undefined' && 'performance' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            console.log('Page load time:', entry.loadEventEnd - entry.loadEventStart);
          }
        });
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  return null;
}
```

## Deployment Preparation

### 1. Pre-deployment Checklist

```bash
# Build and test
yarn build
yarn type-check
yarn lint

# Environment check
node -e "console.log('NODE_ENV:', process.env.NODE_ENV)"

# Database migrations
yarn db:check

# Security audit
yarn audit
```

### 2. Build Optimization

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  output: 'standalone', // For Docker builds
};

module.exports = nextConfig;
```

## Contributing Guidelines

### 1. Pull Request Process

1. **Create Issue**: Describe the problem or feature
2. **Create Branch**: Follow naming conventions
3. **Implement Changes**: Follow coding standards
4. **Write Tests**: Cover new functionality
5. **Update Documentation**: Keep docs in sync
6. **Submit PR**: Use PR template
7. **Code Review**: Address feedback
8. **Merge**: Squash and merge

### 2. Code Review Checklist

**Functionality:**
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Performance considerations

**Code Quality:**
- [ ] Follows TypeScript standards
- [ ] Proper error handling
- [ ] Consistent naming conventions
- [ ] No code duplication

**Testing:**
- [ ] Tests cover new code
- [ ] Tests pass locally
- [ ] Integration tests updated

**Security:**
- [ ] Input validation
- [ ] Authentication checks
- [ ] No secrets in code

**Documentation:**
- [ ] Code comments where needed
- [ ] Documentation updated
- [ ] API documentation current

This development guide ensures consistent, high-quality code across the entire project while maintaining security and performance standards.