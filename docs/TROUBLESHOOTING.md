# Troubleshooting Guide

This comprehensive troubleshooting guide covers common issues, debugging techniques, and solutions for the Consolidate Budget E2E application.

## Quick Diagnostics

### System Health Check

Run these commands to quickly assess system health:

```bash
# Check Node.js version
node --version  # Should be 18+

# Check yarn version
yarn --version

# Check PostgreSQL connection
psql $DATABASE_URL -c "SELECT version();"

# Check application build
yarn build

# Check linting
yarn lint

# Check database schema
yarn db:check
```

## Common Issues and Solutions

### 1. Installation and Setup Issues

#### Issue: "yarn install" fails
**Symptoms:**
- Package installation errors
- Node modules missing
- Dependency conflicts

**Solutions:**
```bash
# Clear cache and reinstall
yarn cache clean
rm -rf node_modules yarn.lock
yarn install

# Use specific Node version
nvm use 18
yarn install

# Install with legacy peer deps (if needed)
yarn install --legacy-peer-deps
```

#### Issue: Database connection fails
**Symptoms:**
- "Connection refused" errors
- "Database does not exist" errors
- Authentication failures

**Solutions:**
```bash
# Check PostgreSQL is running
sudo service postgresql status
# or
brew services list | grep postgresql

# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://username:password@host:port/database

# Test connection manually
psql $DATABASE_URL

# Create database if missing
createdb consolidate_budget

# Reset database schema
yarn db:schema
```

#### Issue: Environment variables not loading
**Symptoms:**
- Undefined environment variables
- Configuration errors
- API connection failures

**Solutions:**
```bash
# Check .env.local exists
ls -la .env.local

# Verify environment variables
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL)"

# Check file permissions
chmod 600 .env.local

# Restart development server
yarn dev
```

### 2. Development Server Issues

#### Issue: Next.js dev server won't start
**Symptoms:**
- Port already in use
- Build compilation errors
- Module resolution failures

**Solutions:**
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Use different port
PORT=3001 yarn dev

# Clear Next.js cache
rm -rf .next
yarn dev

# Check for TypeScript errors
npx tsc --noEmit
```

#### Issue: Hot reload not working
**Symptoms:**
- Changes not reflected in browser
- Need to manually refresh
- Compilation errors

**Solutions:**
```bash
# Restart development server
yarn dev

# Clear browser cache
# Ctrl+Shift+R (Chrome/Firefox)

# Check file watchers limit (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p

# Disable fast refresh temporarily
# In next.config.js:
module.exports = {
  experimental: {
    fastRefresh: false
  }
}
```

#### Issue: Build fails in production
**Symptoms:**
- TypeScript compilation errors
- Missing dependencies
- Environment-specific issues

**Solutions:**
```bash
# Run type checking
npx tsc --noEmit

# Build locally first
yarn build
yarn start

# Check production environment variables
NODE_ENV=production yarn build

# Fix import/export issues
# Use dynamic imports for client-only code
const Component = dynamic(() => import('./Component'), { ssr: false })
```

### 3. Database Issues

#### Issue: Drizzle migration errors
**Symptoms:**
- Schema push failures
- Table creation errors
- Data type mismatches

**Solutions:**
```bash
# Check database connection
yarn db:check

# Reset database (CAUTION: data loss)
dropdb consolidate_budget
createdb consolidate_budget
yarn db:schema

# Manual schema inspection
psql $DATABASE_URL -c "\dt"  # List tables
psql $DATABASE_URL -c "\d users"  # Describe table

# Check Drizzle configuration
cat drizzle.config.ts
```

#### Issue: Query performance problems
**Symptoms:**
- Slow API responses
- Database timeouts
- High CPU usage

**Solutions:**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch 
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;

-- Add missing indexes
CREATE INDEX idx_transactions_customer_date 
ON transactions(customer_id, booked_date);

-- Analyze table statistics
ANALYZE transactions;
```

#### Issue: Database locks and deadlocks
**Symptoms:**
- Query timeouts
- Application hangs
- Deadlock errors

**Solutions:**
```sql
-- Check active locks
SELECT * FROM pg_locks 
WHERE NOT granted;

-- Check blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

-- Kill blocking query (if needed)
SELECT pg_terminate_backend(PID);
```

### 4. Authentication Issues

#### Issue: JWT session problems
**Symptoms:**
- Login doesn't persist
- Unexpected logouts
- Token validation errors

**Solutions:**
```bash
# Check session secret
echo $SESSION_SECRET
# Should be a long, random string

# Verify JWT implementation
node -e "
const jwt = require('jose');
const secret = process.env.SESSION_SECRET;
console.log('Secret length:', secret?.length);
"

# Clear browser cookies
# Developer Tools > Storage > Cookies > Clear All

# Check token expiration
# In browser console:
localStorage.getItem('token')
```

#### Issue: Password hashing errors
**Symptoms:**
- Login always fails
- Password comparison errors
- bcrypt errors

**Solutions:**
```javascript
// Test bcrypt functionality
const bcrypt = require('bcrypt');

async function testBcrypt() {
  const password = 'test123';
  const hashed = await bcrypt.hash(password, 12);
  console.log('Hashed:', hashed);
  
  const isValid = await bcrypt.compare(password, hashed);
  console.log('Valid:', isValid);
}

testBcrypt();
```

### 5. Tink API Integration Issues

#### Issue: OAuth flow failures
**Symptoms:**
- Redirect errors
- Authorization code not received
- Token exchange failures

**Solutions:**
```bash
# Verify Tink credentials
echo $TINK_CLIENT_ID
echo $TINK_CLIENT_SECRET

# Check redirect URI configuration
# Must match exactly in Tink console

# Test API connection
curl -X POST https://api.tink.com/api/v1/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=$TINK_CLIENT_ID&client_secret=$TINK_CLIENT_SECRET"
```

#### Issue: Data synchronization problems
**Symptoms:**
- No account data
- Missing transactions
- Stale data

**Solutions:**
```javascript
// Debug Tink API calls
const tinkUrl = 'https://api.tink.com';

async function debugTinkAPI(accessToken) {
  try {
    // Test accounts endpoint
    const accountsRes = await fetch(`${tinkUrl}/data/v2/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Accounts status:', accountsRes.status);
    
    if (!accountsRes.ok) {
      const error = await accountsRes.text();
      console.log('Accounts error:', error);
    }
    
    // Test transactions endpoint
    const transactionsRes = await fetch(`${tinkUrl}/data/v2/transactions`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    console.log('Transactions status:', transactionsRes.status);
    
  } catch (error) {
    console.error('Tink API error:', error);
  }
}
```

### 6. Performance Issues

#### Issue: Slow page loading
**Symptoms:**
- Long initial load times
- High Time to First Byte (TTFB)
- Poor Core Web Vitals

**Solutions:**
```bash
# Analyze bundle size
npx @next/bundle-analyzer

# Check build output
yarn build
# Look for large bundles

# Optimize images
# Use next/image component
# Convert to WebP format

# Enable compression
# In next.config.js:
module.exports = {
  compress: true,
  experimental: {
    optimizeCss: true
  }
}
```

#### Issue: Memory leaks
**Symptoms:**
- Increasing memory usage
- Application crashes
- Out of memory errors

**Solutions:**
```javascript
// Check for memory leaks
if (typeof window !== 'undefined') {
  // Monitor heap usage
  console.log('Memory usage:', performance.memory);
}

// Use proper cleanup in useEffect
useEffect(() => {
  const subscription = api.subscribe();
  
  return () => {
    subscription.unsubscribe(); // Cleanup
  };
}, []);

// Avoid circular references
// Use WeakMap/WeakSet for caching
```

### 7. UI/UX Issues

#### Issue: Responsive design problems
**Symptoms:**
- Layout breaks on mobile
- Elements overlap
- Poor mobile experience

**Solutions:**
```css
/* Debug responsive issues */
* {
  outline: 1px solid red; /* Temporary debugging */
}

/* Use proper Tailwind breakpoints */
<div className="w-full md:w-1/2 lg:w-1/3">

/* Test on multiple devices */
/* Chrome DevTools > Device Toolbar */
```

#### Issue: Dark mode toggle not working
**Symptoms:**
- Theme doesn't persist
- Hydration mismatches
- Flickering on load

**Solutions:**
```javascript
// Check next-themes configuration
import { ThemeProvider } from 'next-themes';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Component {...pageProps} />
    </ThemeProvider>
  );
}

// Prevent hydration mismatch
const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return null;
}
```

### 8. API Issues

#### Issue: CORS errors
**Symptoms:**
- Cross-origin request blocked
- API calls failing from frontend
- Preflight request errors

**Solutions:**
```javascript
// Configure CORS in API routes
// pages/api/example.js
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Handle request
}
```

#### Issue: API rate limiting
**Symptoms:**
- 429 Too Many Requests
- API calls failing intermittently
- Slow API responses

**Solutions:**
```javascript
// Implement request throttling
const throttle = (func, delay) => {
  let timeoutId;
  let lastExecTime = 0;
  
  return (...args) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

// Use request caching
const cache = new Map();

async function cachedFetch(url, options = {}) {
  const cacheKey = url + JSON.stringify(options);
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const response = await fetch(url, options);
  cache.set(cacheKey, response);
  
  // Clear cache after 5 minutes
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  
  return response;
}
```

## Debugging Tools and Techniques

### 1. Browser Developer Tools

**Console Debugging:**
```javascript
// Add debug logs
console.log('User data:', userData);
console.table(transactions); // Table format
console.time('API call');
// ... API call
console.timeEnd('API call');

// Conditional logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug info:', debugData);
}
```

**Network Tab:**
- Monitor API requests
- Check response status codes
- Inspect request/response headers
- Analyze payload sizes

**Performance Tab:**
- Profile JavaScript execution
- Identify performance bottlenecks
- Analyze memory usage

### 2. React Developer Tools

```bash
# Install browser extension
# Chrome: React Developer Tools
# Firefox: React Developer Tools

# Features:
# - Component tree inspection
# - Props and state examination
# - Performance profiling
# - Hook debugging
```

### 3. Next.js Debugging

```javascript
// Enable debug mode
DEBUG=* yarn dev

// Next.js specific debugging
DEBUG=next:* yarn dev

// Component debugging
if (process.env.NODE_ENV === 'development') {
  console.log('Component props:', props);
  console.log('Component state:', state);
}
```

### 4. Database Debugging

```sql
-- Enable query logging in PostgreSQL
-- In postgresql.conf:
log_statement = 'all'
log_duration = on
log_min_duration_statement = 0

-- View active queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Check database size
SELECT pg_size_pretty(pg_database_size('consolidate_budget'));

-- Check table sizes
SELECT tablename, pg_size_pretty(pg_total_relation_size(tablename::text)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(tablename::text) DESC;
```

## Error Monitoring and Logging

### 1. Error Tracking Setup

```bash
# Install Sentry
yarn add @sentry/nextjs

# Configure Sentry
# sentry.client.config.js
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
});

# Add to pages/_app.js
import '@/sentry.client.config';
```

### 2. Custom Error Boundary

```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log to external service
    if (typeof window !== 'undefined') {
      // Send to error tracking service
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <details>
            {this.state.error && this.state.error.toString()}
          </details>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 3. Logging Strategy

```javascript
// Centralized logging utility
class Logger {
  static log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    // Console logging
    console[level](logEntry);

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      // Send to logging service
    }
  }

  static info(message, data) {
    this.log('info', message, data);
  }

  static warn(message, data) {
    this.log('warn', message, data);
  }

  static error(message, data) {
    this.log('error', message, data);
  }
}

// Usage
Logger.info('User logged in', { userId });
Logger.error('API call failed', { endpoint, error });
```

## Testing and Validation

### 1. Manual Testing Checklist

- [ ] User registration flow
- [ ] User login/logout
- [ ] Tink OAuth integration
- [ ] Account data display
- [ ] Transaction data display
- [ ] Responsive design
- [ ] Cross-browser compatibility
- [ ] Performance on slow connections

### 2. Automated Testing

```bash
# Unit tests (if implemented)
yarn test

# E2E tests (if implemented)
yarn test:e2e

# Type checking
npx tsc --noEmit

# Linting
yarn lint

# Build test
yarn build
```

## Getting Help

### 1. Internal Resources

- Check this documentation first
- Review error logs carefully
- Search codebase for similar implementations
- Check Git history for recent changes

### 2. External Resources

- **Next.js Documentation**: https://nextjs.org/docs
- **Tink Documentation**: https://docs.tink.com
- **Drizzle ORM Documentation**: https://orm.drizzle.team
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

### 3. Community Support

- **Stack Overflow**: Tag questions with relevant technologies
- **GitHub Issues**: Check existing issues in dependencies
- **Discord/Slack**: Join relevant development communities

### 4. Professional Support

- **Vercel Support**: For hosting-related issues
- **Tink Support**: For API integration issues
- **Database Provider Support**: For database issues

## Preventive Measures

### 1. Code Quality

- Use TypeScript for type safety
- Implement proper error handling
- Follow ESLint rules
- Regular dependency updates
- Code reviews

### 2. Monitoring

- Set up uptime monitoring
- Implement performance monitoring
- Monitor error rates
- Track user metrics
- Database monitoring

### 3. Backup Strategy

- Regular database backups
- Environment variable backups
- Code repository backups
- Deployment configuration backups

Remember: Most issues can be resolved by carefully reading error messages, checking configurations, and following systematic debugging approaches.