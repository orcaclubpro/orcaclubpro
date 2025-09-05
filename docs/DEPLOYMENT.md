# 🚀 Deployment Guide for OrcaClubPro

## Overview

This guide covers deploying your Next.js + Payload CMS application with bun runtime optimizations. The project supports multiple deployment strategies based on your infrastructure needs.

## Build Scripts Summary

### Quick Reference

```bash
# Development
bun run dev                    # Standard development server
bun run bun:dev               # Development with bun runtime

# Production builds
bun run build                 # Standard build
bun run build:prod            # Comprehensive production build
bun run bun:build:production  # Build with bun runtime

# Utilities
bun run clean                 # Clean build artifacts
bun run deploy:build          # Full clean + production build
```

### Build Script Details

#### 1. Standard Build (`bun run build`)
- Generates Payload types
- Runs database migrations
- Builds Next.js application
- Suitable for most deployment scenarios

#### 2. Comprehensive Build (`bun run build:comprehensive`)
- Full environment validation
- Dependency checks
- Detailed logging and error handling
- Build time tracking
- Production optimizations

#### 3. Production Build (`bun run build:prod`)
- Runs comprehensive build in production mode
- Skips development optimizations
- Optimizes for performance and size

## Deployment Options

### 1. Docker Deployment (Recommended)

#### Build the Docker image:
```bash
# Using the optimized Dockerfile
docker build -f Dockerfile.bun -t orcaclubpro:latest .

# For multi-platform builds
docker buildx build --platform linux/amd64,linux/arm64 -f Dockerfile.bun -t orcaclubpro:latest .
```

#### Run the container:
```bash
docker run -d \
  --name orcaclubpro \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DATABASE_URI=file:./payload.db \
  -v $(pwd)/data:/app/data \
  orcaclubpro:latest
```

#### Docker Compose:
```yaml
version: '3.8'
services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.bun
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URI=file:./payload.db
    volumes:
      - ./data:/app/data
    restart: unless-stopped
```

### 2. Traditional VPS Deployment

#### Server Setup:
```bash
# Install bun
curl -fsSL https://bun.sh/install | bash

# Clone and setup
git clone <your-repo>
cd orcaclubpro
bun install
```

#### Build and Run:
```bash
# Build for production
bun run build:prod

# Run migrations (if needed)
bun run payload:migrate

# Start the application
bun run start
```

#### PM2 Process Management:
```bash
# Install PM2
bun add -g pm2

# Create ecosystem file
echo '{
  "apps": [{
    "name": "orcaclubpro",
    "script": "bun",
    "args": "run start",
    "env": {
      "NODE_ENV": "production",
      "PORT": 3000
    }
  }]
}' > ecosystem.config.js

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Vercel/Netlify Deployment

#### Vercel:
```bash
# Install Vercel CLI
bun add -g vercel

# Deploy
vercel --prod
```

#### Build Settings:
- **Build Command**: `bun run build:production`
- **Output Directory**: `.next`
- **Install Command**: `bun install`

### 4. Railway/Render Deployment

#### Railway:
```bash
# Install Railway CLI
bun add -g @railway/cli

# Deploy
railway login
railway link
railway up
```

#### Render:
- Use the `Dockerfile.bun` for container deployment
- Set build command: `bun run build:prod`
- Set start command: `bun run start`

## Environment Variables

### Required Variables:
```env
NODE_ENV=production
DATABASE_URI=file:./payload.db
PAYLOAD_SECRET=your-secret-key
```

### Optional Variables:
```env
PORT=3000
NEXT_TELEMETRY_DISABLED=1
USE_BUN_RUNTIME=true
SKIP_MIGRATIONS=false
VERBOSE=false
```

## Performance Optimizations

### 1. Bun Runtime Benefits
- **SQLite Performance**: 3-6x faster than better-sqlite3
- **Package Management**: Up to 25x faster than npm
- **Runtime Performance**: Better memory usage and startup times

### 2. Build Optimizations
- Standalone output for smaller deployments
- Package import optimizations
- Console log removal in production
- Image optimization with AVIF/WebP

### 3. Caching Strategies
```nginx
# Nginx configuration for static assets
location /_next/static/ {
    expires 365d;
    add_header Cache-Control "public, immutable";
}

location /public/ {
    expires 30d;
    add_header Cache-Control "public";
}
```

## Database Migrations

### Production Migration Strategy:
```bash
# Before deployment
bun run payload:migrate:create

# During deployment
bun run payload:migrate

# Verify migration
bun run payload:generate
```

### Zero-Downtime Migrations:
1. Create migration files locally
2. Test migrations on staging
3. Deploy application with `SKIP_MIGRATIONS=true`
4. Run migrations separately
5. Restart application

## Monitoring and Logging

### Health Check Endpoint:
Add to your API routes:
```javascript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version 
  });
}
```

### Docker Health Check:
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD bun run --silent check-health || exit 1
```

## Troubleshooting

### Common Issues:

#### 1. Build Failures
```bash
# Check dependencies
bun run build:comprehensive

# Verbose logging
VERBOSE=true bun run build:prod

# Clean rebuild
bun run clean && bun run build
```

#### 2. Runtime Issues
```bash
# Use Node.js fallback
USE_BUN_RUNTIME=false bun run start

# Check migrations
bun run payload:migrate
```

#### 3. Performance Issues
- Monitor with `bun --inspect`
- Use standalone build for production
- Implement proper caching headers

### Debug Mode:
```bash
# Enable debug logging
DEBUG=* bun run dev

# Payload debug
DEBUG=payload:* bun run dev
```

## Security Considerations

### 1. Environment Security:
- Use strong `PAYLOAD_SECRET`
- Secure database connection strings
- Enable HTTPS in production

### 2. Container Security:
- Non-root user in Docker
- Minimal base image (Alpine)
- Regular security updates

### 3. Application Security:
- CSP headers configured
- XSS protection enabled
- Regular dependency updates

## Scaling Strategies

### 1. Horizontal Scaling:
- Load balancer setup
- Shared database configuration
- Session state management

### 2. Database Scaling:
- PostgreSQL for production
- Read replicas for better performance
- Connection pooling

### 3. CDN Integration:
- Static asset delivery
- Image optimization
- Global edge caching

## Backup and Recovery

### Database Backup:
```bash
# SQLite backup
cp payload.db "backup-$(date +%Y%m%d-%H%M%S).db"

# Automated backup script
echo '#!/bin/bash
BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d-%H%M%S)
cp payload.db "$BACKUP_DIR/payload-$DATE.db"
find $BACKUP_DIR -name "payload-*.db" -mtime +7 -delete
' > backup.sh
chmod +x backup.sh
```

### Recovery Process:
1. Stop application
2. Restore database file
3. Run migrations if needed
4. Restart application

## Support and Maintenance

### Regular Maintenance:
- Update dependencies monthly
- Monitor performance metrics
- Review and rotate secrets
- Test backup and recovery procedures

### Updates:
```bash
# Update dependencies
bun update

# Update bun runtime
bun upgrade

# Test after updates
bun run build:comprehensive
bun test
```

For additional support, refer to:
- [Bun Documentation](https://bun.sh/docs)
- [Next.js Deployment Guide](https://nextjs.org/docs/deployment)
- [Payload CMS Documentation](https://payloadcms.com/docs) 