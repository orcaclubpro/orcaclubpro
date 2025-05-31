# 🔧 Docker Deployment Troubleshooting Guide

## Common Issues and Solutions

### 1. Bun Install Failure in Docker Build

**Error**: `failed to solve: process "/bin/sh -c bun install --frozen-lockfile --production=false" did not complete successfully: exit code: 1`

**Cause**: Lockfile mismatch or missing lockfile.

**Solutions**:

#### Quick Fix (Recommended)
```bash
# Run the automatic fix script
./fix-lockfile.sh
```

#### Manual Fix
```bash
# Remove conflicting lockfiles and regenerate
rm -f package-lock.json
rm -rf node_modules
bun install

# Then rebuild Docker image
./docker-quick-deploy.sh
```

#### If you prefer to keep npm
```bash
# Update the Dockerfile to use npm instead
# Edit Dockerfile.enhanced and replace bun install with:
# RUN npm ci --production=false
```

### 2. Docker Daemon Not Running

**Error**: `Docker daemon not running. Please start Docker.`

**Solutions**:
- **macOS**: Start Docker Desktop application
- **Linux**: `sudo systemctl start docker`
- **Windows**: Start Docker Desktop

### 3. Build Context Too Large

**Error**: Build takes very long or fails with context size errors.

**Solutions**:
```bash
# Clean up build context
echo "node_modules" >> .dockerignore
echo ".next" >> .dockerignore
echo "*.log" >> .dockerignore

# Or use the optimized .dockerignore we provided
```

### 4. Container Won't Start

**Error**: Container starts but immediately exits.

**Diagnosis**:
```bash
# Check container logs
docker logs orcaclubpro-app

# Check container status
docker ps -a | grep orcaclubpro
```

**Common Solutions**:
```bash
# If environment issues
cp env.docker.example .env
# Edit .env with proper PAYLOAD_SECRET

# If permission issues
docker exec -it orcaclubpro-app ls -la /app/data

# If port conflicts
docker run -p 3001:3000 orcaclubpro:latest  # Use different port
```

### 5. Health Check Failures

**Error**: Container runs but health checks fail.

**Diagnosis**:
```bash
# Manual health check
curl -f http://localhost:3000/api/health

# Check if application is bound correctly
docker exec orcaclubpro-app netstat -tlnp
```

**Solutions**:
```bash
# Wait longer for startup
sleep 30 && curl http://localhost:3000/api/health

# Check environment variables
docker exec orcaclubpro-app env | grep DATABASE_URI
```

### 6. Database Issues

**Error**: SQLite database errors or connection issues.

**Solutions**:
```bash
# Check database permissions
docker exec orcaclubpro-app ls -la /app/data

# Reset database volume
docker volume rm orcaclubpro_db_data
docker volume create orcaclubpro_db_data

# Check if database is properly mounted
docker exec orcaclubpro-app test -f /app/data/payload.db && echo "DB exists" || echo "DB missing"
```

### 7. Memory/Resource Issues

**Error**: Container gets killed or runs out of memory.

**Solutions**:
```bash
# Increase Docker memory limits (Docker Desktop)
# Or run with more memory
docker run --memory=1g --cpus=1.0 -d orcaclubpro:latest

# Check resource usage
docker stats orcaclubpro-app
```

### 8. Build Cache Issues

**Error**: Build fails with cached layers that are outdated.

**Solutions**:
```bash
# Clear build cache
docker builder prune -f

# Build without cache
docker build --no-cache -f Dockerfile.enhanced -t orcaclubpro:latest .

# Clean up everything
docker system prune -a -f
```

## 🛠️ Diagnostic Commands

### General Diagnostics
```bash
# Check Docker status
docker version
docker info

# Check available space
docker system df

# Check running containers
docker ps

# Check all containers
docker ps -a

# Check images
docker images

# Check volumes
docker volume ls
```

### Application Diagnostics
```bash
# Application logs
docker logs -f orcaclubpro-app

# Container shell access
docker exec -it orcaclubpro-app /bin/sh

# Check application files
docker exec orcaclubpro-app ls -la /app

# Check environment
docker exec orcaclubpro-app env

# Test network connectivity
docker exec orcaclubpro-app ping google.com

# Check process list
docker exec orcaclubpro-app ps aux
```

### Database Diagnostics
```bash
# Check database file
docker exec orcaclubpro-app ls -la /app/data/

# Database size
docker exec orcaclubpro-app du -h /app/data/payload.db

# SQLite version
docker exec orcaclubpro-app sqlite3 --version

# Test database connection
docker exec orcaclubpro-app sqlite3 /app/data/payload.db ".schema"
```

## 🔄 Recovery Procedures

### Complete Reset
```bash
# Stop and remove everything
./docker-cli-deploy.sh clean true

# Remove all images
docker rmi orcaclubpro:latest orcaclubpro:test 2>/dev/null || true

# Clean system
docker system prune -a -f

# Start fresh
./fix-lockfile.sh
./docker-quick-deploy.sh
```

### Backup and Restore
```bash
# Backup before troubleshooting
./docker-cli-deploy.sh backup

# If something goes wrong, restore
./docker-cli-deploy.sh restore backup-YYYYMMDD-HHMMSS.db
```

## 🚀 Performance Optimization

### Build Performance
```bash
# Use BuildKit
export DOCKER_BUILDKIT=1

# Multi-platform builds
./docker-cli-deploy.sh build-multi

# Use build cache
docker build --cache-from=orcaclubpro:latest -t orcaclubpro:latest .
```

### Runtime Performance
```bash
# Monitor resource usage
docker stats orcaclubpro-app

# Optimize memory
docker run --memory=512m --memory-swap=512m orcaclubpro:latest

# Use production environment
NODE_ENV=production ./docker-production-deploy.sh deploy
```

## 📊 Monitoring Setup

### Health Monitoring
```bash
# Continuous health check
watch -n 5 'curl -s http://localhost:3000/api/health | jq .'

# Log monitoring
docker logs -f orcaclubpro-app | grep ERROR

# Resource monitoring
watch -n 1 'docker stats --no-stream orcaclubpro-app'
```

### Alerting
```bash
# Simple uptime monitoring script
#!/bin/bash
while true; do
    if ! curl -f -s http://localhost:3000/api/health > /dev/null; then
        echo "$(date): Health check failed!" | tee -a monitor.log
        # Add notification logic here
    fi
    sleep 60
done
```

## 🆘 When All Else Fails

### Contact Information
1. **Check GitHub Issues**: Look for similar problems in your project's issues
2. **Docker Documentation**: [docs.docker.com](https://docs.docker.com)
3. **Payload CMS Docs**: [payloadcms.com/docs](https://payloadcms.com/docs)
4. **Next.js Docs**: [nextjs.org/docs](https://nextjs.org/docs)

### Collect Debug Information
```bash
# Generate debug report
echo "=== Docker Info ===" > debug-report.txt
docker version >> debug-report.txt
docker info >> debug-report.txt
echo -e "\n=== Container Logs ===" >> debug-report.txt
docker logs orcaclubpro-app >> debug-report.txt 2>&1
echo -e "\n=== Environment ===" >> debug-report.txt
cat .env >> debug-report.txt
echo -e "\n=== Package Info ===" >> debug-report.txt
cat package.json >> debug-report.txt
```

### Emergency Recovery
```bash
# If container is completely broken, extract data
docker run --rm -v orcaclubpro_db_data:/data -v $(pwd):/backup alpine \
    cp /data/payload.db /backup/emergency-backup.db

# Start completely fresh
docker system prune -a -f --volumes
./fix-lockfile.sh
./docker-quick-deploy.sh

# Restore data
cp emergency-backup.db payload.db
./docker-quick-deploy.sh
```

---

Remember: Most issues are resolved by ensuring you have the correct lockfile (bun.lockb) and proper environment configuration! 🎯 