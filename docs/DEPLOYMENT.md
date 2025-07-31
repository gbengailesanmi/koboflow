# Deployment Guide

This comprehensive guide covers all aspects of deploying the Consolidate Budget E2E application to various environments.

## Deployment Overview

The application can be deployed to multiple platforms:
- **Vercel** (Recommended for Next.js)
- **Netlify**
- **AWS**
- **Google Cloud Platform**
- **Azure**
- **Docker/Kubernetes**
- **Self-hosted**

## Prerequisites

Before deployment, ensure you have:

- [ ] Source code access
- [ ] Environment variables configured
- [ ] Database setup completed
- [ ] Tink API credentials
- [ ] Domain name (optional)
- [ ] SSL certificate (for production)

## Environment Variables

All deployment platforms require these environment variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"

# Tink API Configuration
TINK_CLIENT_ID="your_tink_client_id"
TINK_CLIENT_SECRET="your_tink_client_secret"

# Application Configuration
BASE_URI="https://your-domain.com"
PORT="3000"

# Session Configuration
SESSION_SECRET="your_secure_random_session_secret"

# Next.js Configuration
NEXTAUTH_URL="https://your-domain.com"
NEXTAUTH_SECRET="your_secure_nextauth_secret"

# Production Settings
NODE_ENV="production"
```

## Vercel Deployment (Recommended)

Vercel provides the best developer experience for Next.js applications.

### 1. Automatic Deployment (Git Integration)

**Step 1: Connect Repository**
1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub/GitLab/Bitbucket
3. Click "New Project"
4. Import your repository
5. Configure project settings

**Step 2: Environment Variables**
1. In project settings, go to "Environment Variables"
2. Add all required environment variables
3. Set appropriate environments (Production, Preview, Development)

**Step 3: Deploy**
1. Vercel automatically deploys on git push
2. Preview deployments for pull requests
3. Production deployment on main branch merge

### 2. Manual Deployment (CLI)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### 3. Vercel Configuration

Create `vercel.json` in project root:

```json
{
  "framework": "nextjs",
  "buildCommand": "yarn build",
  "outputDirectory": ".next",
  "installCommand": "yarn install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["iad1"]
}
```

### 4. Database Setup for Vercel

**Option 1: Vercel Postgres**
```bash
# Install Vercel Postgres
vercel postgres create consolidate-budget-db

# Connect to project
vercel postgres connect consolidate-budget-db
```

**Option 2: External Database**
- Use Supabase, Railway, or Neon
- Add connection string to environment variables

## Netlify Deployment

### 1. Git Integration

1. Connect repository to Netlify
2. Set build command: `yarn build`
3. Set publish directory: `.next`
4. Add environment variables

### 2. Netlify Configuration

Create `netlify.toml`:

```toml
[build]
  command = "yarn build"
  publish = ".next"

[build.environment]
  NODE_ENV = "production"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api/:splat"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

## AWS Deployment

### 1. AWS Amplify

**Step 1: Setup**
```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize project
amplify init
```

**Step 2: Add Hosting**
```bash
# Add hosting
amplify add hosting

# Select Amazon CloudFront and S3
# Configure settings

# Deploy
amplify publish
```

### 2. AWS EC2 with Docker

**Step 1: Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN yarn build

# Expose port
EXPOSE 3000

# Start application
CMD ["yarn", "start"]
```

**Step 2: Deploy to EC2**
```bash
# Build image
docker build -t consolidate-budget .

# Save image
docker save consolidate-budget > app.tar

# Copy to EC2
scp app.tar ec2-user@your-instance:/home/ec2-user/

# SSH to EC2 and run
ssh ec2-user@your-instance
docker load < app.tar
docker run -d -p 80:3000 --env-file .env consolidate-budget
```

### 3. AWS ECS (Elastic Container Service)

**Step 1: Create Task Definition**
```json
{
  "family": "consolidate-budget",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "app",
      "image": "your-account.dkr.ecr.region.amazonaws.com/consolidate-budget:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:region:account:secret:db-url"
        }
      ]
    }
  ]
}
```

## Google Cloud Platform

### 1. Cloud Run

**Step 1: Containerize**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN yarn install --production
COPY . .
RUN yarn build
EXPOSE 8080
CMD ["yarn", "start"]
```

**Step 2: Deploy**
```bash
# Build and push to Container Registry
gcloud builds submit --tag gcr.io/PROJECT-ID/consolidate-budget

# Deploy to Cloud Run
gcloud run deploy consolidate-budget \
  --image gcr.io/PROJECT-ID/consolidate-budget \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### 2. App Engine

Create `app.yaml`:
```yaml
runtime: nodejs18

env_variables:
  NODE_ENV: production
  DATABASE_URL: your_database_url

automatic_scaling:
  min_instances: 1
  max_instances: 10
```

Deploy:
```bash
gcloud app deploy
```

## Docker Deployment

### 1. Development Docker Setup

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@db:5432/consolidate_budget
    depends_on:
      - db
    volumes:
      - .:/app
      - /app/node_modules

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: consolidate_budget
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### 2. Production Docker Setup

**Dockerfile.prod**:
```dockerfile
# Multi-stage build for production
FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:18-alpine AS runner

WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
CMD ["node", "server.js"]
```

## Kubernetes Deployment

### 1. Deployment Manifest

**k8s/deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: consolidate-budget
spec:
  replicas: 3
  selector:
    matchLabels:
      app: consolidate-budget
  template:
    metadata:
      labels:
        app: consolidate-budget
    spec:
      containers:
      - name: app
        image: consolidate-budget:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

### 2. Service Manifest

**k8s/service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: consolidate-budget-service
spec:
  selector:
    app: consolidate-budget
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 3. Ingress Manifest

**k8s/ingress.yaml**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: consolidate-budget-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - your-domain.com
    secretName: consolidate-budget-tls
  rules:
  - host: your-domain.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: consolidate-budget-service
            port:
              number: 80
```

## Database Deployment

### 1. PostgreSQL Options

**Managed Services:**
- **Vercel Postgres**: Integrated with Vercel
- **Supabase**: PostgreSQL with additional features
- **Railway**: Simple PostgreSQL hosting
- **Neon**: Serverless PostgreSQL
- **AWS RDS**: Managed PostgreSQL on AWS
- **Google Cloud SQL**: Managed PostgreSQL on GCP

**Self-hosted:**
- Docker container
- VM installation
- Kubernetes StatefulSet

### 2. Database Migration

```bash
# Install dependencies
yarn install

# Run migrations
yarn db:schema

# Verify schema
yarn db:check
```

### 3. Database Backup Strategy

```bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="consolidate_budget"

# Create backup
pg_dump $DATABASE_URL > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

## SSL/TLS Configuration

### 1. Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. CloudFlare SSL

1. Add domain to CloudFlare
2. Enable SSL/TLS encryption
3. Set to "Full (strict)" mode
4. Configure DNS records

## Monitoring and Logging

### 1. Application Monitoring

**Vercel Analytics:**
```bash
# Install Vercel Analytics
yarn add @vercel/analytics

# Add to app
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

**Error Tracking:**
```bash
# Install Sentry
yarn add @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig({
  // Next.js config
}, {
  // Sentry config
})
```

### 2. Infrastructure Monitoring

- **Uptime monitoring**: UptimeRobot, Pingdom
- **Performance monitoring**: New Relic, DataDog
- **Log aggregation**: LogRocket, Papertrail

## Performance Optimization

### 1. Build Optimization

**next.config.js**:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig
```

### 2. CDN Configuration

- Enable CDN for static assets
- Configure proper caching headers
- Use image optimization services

## Security Checklist

### Production Security

- [ ] HTTPS enabled
- [ ] Environment variables secured
- [ ] Database connections encrypted
- [ ] CORS configured properly
- [ ] Rate limiting implemented
- [ ] Input validation enabled
- [ ] Security headers configured
- [ ] Dependency scanning enabled
- [ ] Regular security updates

### Security Headers

```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

## CI/CD Pipeline

### 1. GitHub Actions

**.github/workflows/deploy.yml**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'yarn'
    
    - name: Install dependencies
      run: yarn install --frozen-lockfile
    
    - name: Run tests
      run: yarn test
    
    - name: Build application
      run: yarn build
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v20
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        vercel-args: '--prod'
```

## Rollback Strategy

### 1. Vercel Rollback

```bash
# List deployments
vercel list

# Rollback to previous deployment
vercel rollback [deployment-url]
```

### 2. Database Rollback

```bash
# Restore from backup
psql $DATABASE_URL < backup_20240115_120000.sql

# Or use point-in-time recovery (if supported)
```

## Troubleshooting Deployment

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check environment variables

2. **Database Connection Issues**
   - Verify DATABASE_URL format
   - Check firewall settings
   - Confirm database is accessible

3. **Environment Variable Issues**
   - Ensure all required variables are set
   - Check variable naming (case-sensitive)
   - Verify secret values are correct

4. **Performance Issues**
   - Enable caching
   - Optimize database queries
   - Use CDN for static assets

### Debug Commands

```bash
# Check deployment logs
vercel logs [deployment-url]

# Test database connection
node -e "console.log(require('pg').Client)"

# Verify environment
node -e "console.log(process.env)"
```

## Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] Database connections working
- [ ] Authentication flow functional
- [ ] Tink integration working
- [ ] All API endpoints responding
- [ ] SSL certificate valid
- [ ] Performance metrics acceptable
- [ ] Error monitoring configured
- [ ] Backup systems operational