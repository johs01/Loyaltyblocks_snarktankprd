# LoyaltyBlocks Deployment Guide

Complete guide for deploying LoyaltyBlocks to production environments.

## Prerequisites

Before deploying, ensure you have:

- ✓ Node.js 18+ installed
- ✓ PostgreSQL database (Neon, Supabase, or self-hosted)
- ✓ Clerk account and API keys
- ✓ Domain name (optional but recommended)
- ✓ Git repository access
- ✓ npm or yarn package manager

---

## Environment Setup

### 1. Database Setup (Neon PostgreSQL)

1. Create account at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string (looks like: `postgresql://user:password@host/database`)
4. Save for later use in environment variables

### 2. Clerk Authentication Setup

1. Create account at [clerk.com](https://clerk.com)
2. Create a new application
3. Get your API keys from the dashboard:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
4. Configure webhook endpoint (see Webhooks section)

### 3. Environment Variables

Create a `.env.local` file (for local) or configure environment variables in your hosting platform:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Database
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

**Security Notes:**
- Never commit `.env.local` to version control
- Use different API keys for development and production
- Rotate secrets regularly
- Use production Clerk keys (pk_live_..., sk_live_...) in production

---

## Database Migration

### Initial Setup

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

### Migration Commands

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations to production
npx prisma migrate deploy

# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

### Seed Database (Optional)

```bash
npm run prisma:seed
```

This creates sample data for testing.

---

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is the easiest deployment option for Next.js applications.

#### Steps:

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # First deployment
   vercel

   # Production deployment
   vercel --prod
   ```

4. **Configure Environment Variables**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.local`
   - Ensure they're set for Production environment

5. **Configure Custom Domain** (Optional)
   - Go to Vercel Dashboard → Project → Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed

6. **Trigger Deployment**
   - Push to `main` branch triggers automatic deployment
   - Or use `vercel --prod` for manual deployment

#### Vercel Configuration

Create `vercel.json`:
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["iad1"],
  "env": {
    "NODE_ENV": "production"
  }
}
```

---

### Option 2: Docker Deployment

#### Dockerfile

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
    depends_on:
      - postgres
    restart: unless-stopped

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=loyaltyblocks
      - POSTGRES_PASSWORD=changeme
      - POSTGRES_DB=loyaltyblocks
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

volumes:
  postgres_data:
```

#### Deploy with Docker

```bash
# Build image
docker build -t loyaltyblocks .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL="postgresql://..." \
  -e NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..." \
  -e CLERK_SECRET_KEY="sk_..." \
  loyaltyblocks

# Or use docker-compose
docker-compose up -d
```

---

### Option 3: Self-Hosted (VPS/EC2)

#### Requirements:
- Ubuntu 22.04 LTS or similar
- Node.js 18+
- PostgreSQL 14+
- Nginx (reverse proxy)
- PM2 (process manager)

#### Steps:

1. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Node.js 18
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib -y

   # Install PM2
   sudo npm install -g pm2

   # Install Nginx
   sudo apt install nginx -y
   ```

2. **Setup PostgreSQL**
   ```bash
   sudo -u postgres psql
   CREATE DATABASE loyaltyblocks;
   CREATE USER loyaltyuser WITH PASSWORD 'securepassword';
   GRANT ALL PRIVILEGES ON DATABASE loyaltyblocks TO loyaltyuser;
   \q
   ```

3. **Clone and Build Application**
   ```bash
   # Clone repository
   git clone https://github.com/yourusername/loyaltyblocks.git
   cd loyaltyblocks

   # Install dependencies
   npm install

   # Create .env.local file
   nano .env.local
   # (Add your environment variables)

   # Generate Prisma client and run migrations
   npm run prisma:generate
   npm run prisma:migrate deploy

   # Build application
   npm run build
   ```

4. **Configure PM2**
   ```bash
   # Create PM2 ecosystem file
   cat > ecosystem.config.js << EOF
   module.exports = {
     apps: [{
       name: 'loyaltyblocks',
       script: 'npm',
       args: 'start',
       cwd: '/path/to/loyaltyblocks',
       instances: 'max',
       exec_mode: 'cluster',
       env: {
         NODE_ENV: 'production',
         PORT: 3000
       }
     }]
   }
   EOF

   # Start application
   pm2 start ecosystem.config.js

   # Save PM2 configuration
   pm2 save

   # Setup PM2 to start on boot
   pm2 startup
   ```

5. **Configure Nginx**
   ```bash
   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/loyaltyblocks

   # Add the following configuration:
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }

   # Enable site
   sudo ln -s /etc/nginx/sites-available/loyaltyblocks /etc/nginx/sites-enabled/

   # Test configuration
   sudo nginx -t

   # Restart Nginx
   sudo systemctl restart nginx
   ```

6. **Setup SSL with Let's Encrypt**
   ```bash
   # Install Certbot
   sudo apt install certbot python3-certbot-nginx -y

   # Obtain certificate
   sudo certbot --nginx -d your-domain.com

   # Auto-renewal is configured automatically
   ```

---

## Clerk Webhook Configuration

### Setup Webhook Endpoint

1. Go to Clerk Dashboard → Webhooks
2. Add endpoint URL: `https://your-domain.com/api/webhooks/clerk`
3. Select events to subscribe:
   - `user.created` (required)
4. Copy the webhook signing secret
5. Add to environment variables:
   ```bash
   CLERK_WEBHOOK_SECRET=whsec_...
   ```

### Test Webhook

```bash
# Use Clerk dashboard to send test event
# Check your application logs for successful processing
```

---

## Post-Deployment Checklist

### Security

- [ ] Environment variables configured correctly
- [ ] Production Clerk keys being used
- [ ] Database connection uses SSL
- [ ] HTTPS enabled (SSL certificate installed)
- [ ] Webhook signing secret configured
- [ ] `.env.local` not in version control
- [ ] Database backups configured
- [ ] Rate limiting enabled (if applicable)

### Functionality

- [ ] Application accessible at domain
- [ ] Public registration form works
- [ ] Admin login works (Clerk)
- [ ] Customer CRUD operations work
- [ ] Settings page accessible to super admin
- [ ] Phone validation working
- [ ] Webhook receiving events from Clerk
- [ ] Multi-tenant isolation verified

### Performance

- [ ] Build optimization complete
- [ ] Static assets cached properly
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Monitoring enabled

### Monitoring

- [ ] Error logging configured
- [ ] Application monitoring (Vercel Analytics, DataDog, etc.)
- [ ] Database monitoring
- [ ] Uptime monitoring
- [ ] Alert notifications configured

---

## Updating the Application

### Vercel

```bash
# Push to main branch
git push origin main

# Or manual deploy
vercel --prod
```

### Docker

```bash
# Pull latest code
git pull

# Rebuild image
docker-compose build

# Restart containers
docker-compose up -d
```

### Self-Hosted

```bash
# Pull latest code
git pull

# Install new dependencies (if any)
npm install

# Run new migrations (if any)
npm run prisma:migrate deploy

# Rebuild application
npm run build

# Restart PM2
pm2 restart loyaltyblocks
```

---

## Database Backups

### Automated Backups (Neon)

Neon provides automatic backups. Configure backup retention in dashboard.

### Manual Backup

```bash
# Backup database
pg_dump -h hostname -U username -d loyaltyblocks > backup.sql

# Restore database
psql -h hostname -U username -d loyaltyblocks < backup.sql
```

### Backup Schedule

Recommended backup schedule:
- **Production:** Daily backups, 30-day retention
- **Staging:** Weekly backups, 7-day retention
- **Development:** As needed

---

## Troubleshooting

### Application won't start

1. Check environment variables are set correctly
2. Verify database connection string
3. Ensure Prisma client is generated
4. Check logs for specific errors

### Database connection issues

1. Verify DATABASE_URL is correct
2. Ensure database is accessible from deployment environment
3. Check SSL mode requirements
4. Verify database credentials

### Clerk authentication not working

1. Verify Clerk API keys are correct
2. Ensure using production keys in production
3. Check webhook endpoint is accessible
4. Verify webhook signing secret

### 404 errors on routes

1. Ensure build completed successfully
2. Verify Next.js routing is correct
3. Check middleware configuration
4. Clear build cache and rebuild

---

## Monitoring and Logs

### View Logs

**Vercel:**
```bash
vercel logs --prod
```

**Docker:**
```bash
docker logs loyaltyblocks-app
docker-compose logs -f
```

**PM2:**
```bash
pm2 logs loyaltyblocks
pm2 monit
```

### Recommended Monitoring Tools

- **Application:** Vercel Analytics, Sentry, DataDog
- **Database:** Neon Dashboard, pgAdmin
- **Uptime:** UptimeRobot, Pingdom
- **Error Tracking:** Sentry, Rollbar

---

## Rollback Procedure

### Vercel

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." → "Promote to Production"

### Docker

```bash
# Revert to previous commit
git revert HEAD

# Rebuild and restart
docker-compose build
docker-compose up -d
```

### Self-Hosted

```bash
# Revert code
git revert HEAD

# Rebuild
npm run build

# Restart
pm2 restart loyaltyblocks
```

---

## Support and Resources

- **Documentation:** `/docs` directory
- **API Reference:** `/docs/API.md`
- **Development Guide:** `/docs/DEVELOPMENT.md`
- **Architecture:** `CLAUDE.md`
- **PRD:** `tasks/prd-loyaltyblocks-mvp.md`

For deployment issues, check application logs and database connection first.
