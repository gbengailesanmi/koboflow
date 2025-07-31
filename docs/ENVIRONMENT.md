# Environment Configuration Guide

This guide provides comprehensive documentation for configuring environment variables and settings for the Consolidate Budget E2E application across different environments.

## Environment Files

The application uses environment-specific configuration files:

- `.env.local` - Local development (highest priority)
- `.env.development` - Development environment
- `.env.production` - Production environment
- `.env` - Default fallback (not recommended for secrets)

## Required Environment Variables

### Database Configuration

#### DATABASE_URL
**Required**: Yes  
**Format**: PostgreSQL connection string  
**Example**: `postgresql://username:password@localhost:5432/consolidate_budget`

```bash
# Local development
DATABASE_URL="postgresql://postgres:password@localhost:5432/consolidate_budget"

# Production (example with connection parameters)
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&connection_limit=10"
```

**Components**:
- `postgresql://` - Protocol
- `username:password` - Credentials
- `@localhost:5432` - Host and port
- `/consolidate_budget` - Database name
- `?sslmode=require` - SSL mode (production)

### Tink API Configuration

#### TINK_CLIENT_ID
**Required**: Yes  
**Format**: String  
**Description**: Tink API client identifier

```bash
TINK_CLIENT_ID="your_tink_client_id_here"
```

**How to obtain**:
1. Register at [Tink Console](https://console.tink.com)
2. Create a new application
3. Copy the Client ID from your application settings

#### TINK_CLIENT_SECRET
**Required**: Yes  
**Format**: String  
**Description**: Tink API client secret

```bash
TINK_CLIENT_SECRET="your_tink_client_secret_here"
```

**Security Note**: Never commit this to version control. Use secure storage in production.

### Application Configuration

#### BASE_URI
**Required**: Yes  
**Format**: URL without trailing slash  
**Description**: Base URI for the application

```bash
# Development
BASE_URI="http://localhost"

# Production
BASE_URI="https://your-domain.com"
```

#### PORT
**Required**: Yes  
**Format**: Number  
**Description**: Port number for the application

```bash
# Development
PORT="3000"

# Production (often set by hosting platform)
PORT="3000"
```

### Security Configuration

#### SESSION_SECRET
**Required**: Yes  
**Format**: Random string (minimum 32 characters)  
**Description**: Secret key for JWT session signing

```bash
SESSION_SECRET="your_very_long_random_string_here_at_least_32_characters"
```

**Generation**:
```bash
# Generate a secure random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use openssl
openssl rand -hex 32
```

#### NEXTAUTH_SECRET
**Required**: Yes (for NextAuth.js compatibility)  
**Format**: Random string  
**Description**: NextAuth.js secret key

```bash
NEXTAUTH_SECRET="your_nextauth_secret_here"
```

#### NEXTAUTH_URL
**Required**: Yes  
**Format**: Full URL  
**Description**: Canonical URL for the application

```bash
# Development
NEXTAUTH_URL="http://localhost:3000"

# Production
NEXTAUTH_URL="https://your-domain.com"
```

### Node.js Environment

#### NODE_ENV
**Required**: Yes  
**Format**: String  
**Values**: `development`, `production`, `test`

```bash
# Development
NODE_ENV="development"

# Production
NODE_ENV="production"
```

## Environment-Specific Configurations

### Development Environment

Create `.env.local` for local development:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/consolidate_budget"

# Tink API
TINK_CLIENT_ID="your_dev_client_id"
TINK_CLIENT_SECRET="your_dev_client_secret"

# Application
BASE_URI="http://localhost"
PORT="3000"
NODE_ENV="development"

# Security
SESSION_SECRET="development_secret_key_32_chars_min"
NEXTAUTH_SECRET="development_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# Development-specific
DEBUG="*"
LOG_LEVEL="debug"
```

### Production Environment

Example production environment variables:

```bash
# Database (use managed database service)
DATABASE_URL="postgresql://user:pass@prod-db.company.com:5432/consolidate_budget?sslmode=require"

# Tink API (production credentials)
TINK_CLIENT_ID="prod_client_id"
TINK_CLIENT_SECRET="prod_client_secret"

# Application
BASE_URI="https://your-domain.com"
PORT="3000"
NODE_ENV="production"

# Security (use secure random values)
SESSION_SECRET="production_secure_random_string_minimum_32_characters"
NEXTAUTH_SECRET="production_nextauth_secure_secret"
NEXTAUTH_URL="https://your-domain.com"

# Production-specific
LOG_LEVEL="info"
SENTRY_DSN="your_sentry_dsn"
```

### Testing Environment

Create `.env.test` for testing:

```bash
# Test Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/consolidate_budget_test"

# Mock Tink API
TINK_CLIENT_ID="test_client_id"
TINK_CLIENT_SECRET="test_client_secret"

# Test Application
BASE_URI="http://localhost"
PORT="3001"
NODE_ENV="test"

# Test Security
SESSION_SECRET="test_session_secret_32_characters"
NEXTAUTH_SECRET="test_nextauth_secret"
NEXTAUTH_URL="http://localhost:3001"
```

## Optional Environment Variables

### Logging and Monitoring

#### LOG_LEVEL
**Required**: No  
**Default**: `info`  
**Values**: `error`, `warn`, `info`, `debug`

```bash
LOG_LEVEL="info"
```

#### SENTRY_DSN
**Required**: No  
**Format**: Sentry DSN URL  
**Description**: Error tracking with Sentry

```bash
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
```

#### VERCEL_ANALYTICS_ID
**Required**: No  
**Format**: String  
**Description**: Vercel Analytics tracking ID

```bash
VERCEL_ANALYTICS_ID="your_analytics_id"
```

### Database Optimization

#### DATABASE_POOL_SIZE
**Required**: No  
**Default**: 10  
**Format**: Number

```bash
DATABASE_POOL_SIZE="20"
```

#### DATABASE_TIMEOUT
**Required**: No  
**Default**: 30000 (30 seconds)  
**Format**: Number (milliseconds)

```bash
DATABASE_TIMEOUT="60000"
```

### API Configuration

#### API_RATE_LIMIT
**Required**: No  
**Default**: 100  
**Format**: Number (requests per minute)

```bash
API_RATE_LIMIT="200"
```

#### TINK_API_TIMEOUT
**Required**: No  
**Default**: 30000 (30 seconds)  
**Format**: Number (milliseconds)

```bash
TINK_API_TIMEOUT="45000"
```

## Platform-Specific Configuration

### Vercel

Vercel automatically injects some environment variables:

```bash
# Automatically set by Vercel
VERCEL="1"
VERCEL_ENV="production"  # or "preview" or "development"
VERCEL_URL="your-app.vercel.app"
VERCEL_REGION="iad1"

# Custom environment variables
# Set in Vercel dashboard under "Environment Variables"
```

**Vercel Environment Variable Configuration**:
1. Go to your project dashboard
2. Navigate to "Settings" > "Environment Variables"
3. Add each variable with appropriate scope:
   - Production: Production deployments
   - Preview: Preview deployments (PRs)
   - Development: Local development

### Netlify

```bash
# Automatically set by Netlify
NETLIFY="true"
CONTEXT="production"  # or "deploy-preview" or "branch-deploy"
URL="https://your-site.netlify.app"

# Set in netlify.toml or dashboard
```

### Docker

Create a `.env` file for Docker:

```bash
# .env file for Docker Compose
DATABASE_URL=postgresql://postgres:password@db:5432/consolidate_budget
TINK_CLIENT_ID=your_client_id
TINK_CLIENT_SECRET=your_client_secret
BASE_URI=http://localhost
PORT=3000
SESSION_SECRET=docker_session_secret_32_characters
NEXTAUTH_SECRET=docker_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
NODE_ENV=development
```

## Environment Variable Validation

### Validation Schema

The application should validate environment variables on startup:

```javascript
// lib/env-validation.js
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  TINK_CLIENT_ID: z.string().min(1),
  TINK_CLIENT_SECRET: z.string().min(1),
  BASE_URI: z.string().url(),
  PORT: z.string().regex(/^\d+$/),
  SESSION_SECRET: z.string().min(32),
  NEXTAUTH_SECRET: z.string().min(1),
  NEXTAUTH_URL: z.string().url(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export function validateEnv() {
  try {
    envSchema.parse(process.env);
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    console.error('❌ Environment validation failed:', error.errors);
    process.exit(1);
  }
}
```

### Runtime Checks

```javascript
// lib/config.js
function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const config = {
  database: {
    url: requireEnv('DATABASE_URL'),
  },
  tink: {
    clientId: requireEnv('TINK_CLIENT_ID'),
    clientSecret: requireEnv('TINK_CLIENT_SECRET'),
  },
  app: {
    baseUri: requireEnv('BASE_URI'),
    port: parseInt(requireEnv('PORT'), 10),
    nodeEnv: requireEnv('NODE_ENV'),
  },
  auth: {
    sessionSecret: requireEnv('SESSION_SECRET'),
    nextAuthSecret: requireEnv('NEXTAUTH_SECRET'),
    nextAuthUrl: requireEnv('NEXTAUTH_URL'),
  },
};
```

## Security Best Practices

### 1. Secret Management

**Never commit secrets to version control**:

```bash
# .gitignore
.env.local
.env.production
.env*.local
```

**Use secret management services**:
- **Vercel**: Built-in environment variables
- **AWS**: AWS Secrets Manager
- **Google Cloud**: Secret Manager
- **Azure**: Key Vault
- **HashiCorp**: Vault

### 2. Environment Separation

- Use different credentials for each environment
- Implement least-privilege access
- Rotate secrets regularly
- Monitor secret usage

### 3. Production Security

```bash
# Use strong, unique secrets
SESSION_SECRET=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)

# Use SSL/TLS for database connections
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require"

# Set appropriate CORS origins
ALLOWED_ORIGINS="https://your-domain.com"
```

## Configuration Templates

### .env.example

Create a template file for developers:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/consolidate_budget"

# Tink API Configuration
TINK_CLIENT_ID="your_tink_client_id"
TINK_CLIENT_SECRET="your_tink_client_secret"

# Application Configuration
BASE_URI="http://localhost"
PORT="3000"

# Security Configuration
SESSION_SECRET="your_secure_session_secret_min_32_chars"
NEXTAUTH_SECRET="your_nextauth_secret"
NEXTAUTH_URL="http://localhost:3000"

# Environment
NODE_ENV="development"

# Optional: Monitoring and Logging
# SENTRY_DSN="your_sentry_dsn"
# LOG_LEVEL="info"
# VERCEL_ANALYTICS_ID="your_analytics_id"
```

### Setup Script

Create a setup script for new developers:

```bash
#!/bin/bash
# setup-env.sh

echo "Setting up environment variables..."

if [ ! -f .env.local ]; then
  echo "Creating .env.local from template..."
  cp .env.example .env.local
  
  echo "Please edit .env.local with your actual values:"
  echo "1. Set up your PostgreSQL database"
  echo "2. Get Tink API credentials from https://console.tink.com"
  echo "3. Generate secure secrets using: openssl rand -hex 32"
  echo "4. Update all placeholder values"
  
  echo ""
  echo "Required actions:"
  echo "- Edit .env.local"
  echo "- Run: yarn db:schema"
  echo "- Run: yarn dev"
else
  echo ".env.local already exists"
fi
```

## Troubleshooting Environment Issues

### Common Problems

1. **Missing Environment Variables**
   ```bash
   # Check if variable is set
   echo $DATABASE_URL
   
   # List all environment variables
   printenv | grep -E "(DATABASE|TINK|SESSION)"
   ```

2. **Wrong Variable Names**
   ```bash
   # Variables are case-sensitive
   # DATABASE_URL ✅
   # database_url ❌
   ```

3. **Special Characters in Values**
   ```bash
   # Escape special characters or use quotes
   PASSWORD="pass@word#123"
   ```

4. **Environment File Loading**
   ```javascript
   // Verify environment loading
   console.log('NODE_ENV:', process.env.NODE_ENV);
   console.log('Database URL exists:', !!process.env.DATABASE_URL);
   ```

### Debug Commands

```bash
# Check Next.js environment loading
node -e "console.log(process.env)" | grep -E "(DATABASE|TINK|SESSION)"

# Test database connection
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => console.log('✅ Database connected')).catch(console.error);
"

# Validate environment variables
node -e "
const required = ['DATABASE_URL', 'TINK_CLIENT_ID', 'SESSION_SECRET'];
const missing = required.filter(key => !process.env[key]);
if (missing.length) {
  console.error('❌ Missing variables:', missing);
} else {
  console.log('✅ All required variables present');
}
"
```

## Environment Migration

### Migrating Between Environments

```bash
# Export from development
node -e "
const envs = ['DATABASE_URL', 'TINK_CLIENT_ID', 'SESSION_SECRET'];
envs.forEach(key => console.log(\`\${key}=\${process.env[key]}\`));
" > production.env

# Import to production platform
# (Upload to hosting platform's environment variable settings)
```

### Version Control for Configuration

Track configuration changes without exposing secrets:

```bash
# .env.schema (track this file)
# Lists required variables without values
DATABASE_URL=
TINK_CLIENT_ID=
TINK_CLIENT_SECRET=
SESSION_SECRET=
# ... etc
```

This comprehensive environment configuration guide ensures proper setup across all deployment scenarios while maintaining security best practices.