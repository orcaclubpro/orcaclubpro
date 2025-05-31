# 🐳 Docker Deployment Guide for OrcaClubPro

## Overview

This guide covers the enhanced Docker containerization solution for your Next.js + Payload CMS + SQLite application with Bun runtime optimization. The solution is designed for easy deployment across different environments while maintaining security and performance best practices.

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Bun installed locally (for development)
- Git repository access

### 1. Clone and Setup
```bash
git clone <your-repo>
cd orcaclubpro
```

### 2. Configure Environment
```bash
# Copy the environment template
cp env.docker.example .env

# Edit the .env file with your configuration
# IMPORTANT: Change PAYLOAD_SECRET for production!
```

### 3. Deploy with One Command
```bash
# Build and run production container
./scripts/docker-build.sh deploy
```

Your application will be available at `http://localhost:3000`

## 📋 Docker Files Overview

### Core Files
- `Dockerfile.enhanced` - Multi-stage production Dockerfile
- `docker-compose.yml` - Production deployment configuration
- `docker-compose.dev.yml` - Development environment
- `.dockerignore` - Optimized build context
- `scripts/docker-build.sh` - Build and deployment automation

## 🏗️ Enhanced Dockerfile Features

### Multi-Stage Build Architecture
1. **Base Stage**: Sets up Alpine Linux with Bun and security hardening
2. **Dependencies Stage**: Installs npm packages with caching optimization
3. **Builder Stage**: Generates Payload types and builds Next.js application
4. **Runtime Stage**: Minimal production image with standalone output

### Key Improvements Over Original
- **Security**: Non-root user, minimal attack surface
- **Performance**: BuildKit caching, standalone output
- **Size**: Optimized layers, minimal runtime dependencies
- **Reliability**: Health checks, proper signal handling with dumb-init

### Features
- ✅ Next.js standalone output for minimal deployment
- ✅ Multi-stage builds for size optimization
- ✅ Build caching for faster subsequent builds
- ✅ Security hardening (non-root user, minimal permissions)
- ✅ Health checks for container monitoring
- ✅ Proper signal handling with dumb-init
- ✅ Volume mounting for database persistence
- ✅ Environment-specific configurations

## 🛠️ Build Script Usage

The `scripts/docker-build.sh` script provides easy commands for all Docker operations:

```bash
# Build production image
./scripts/docker-build.sh build

# Run production container
./scripts/docker-build.sh run

# Development environment with hot reloading
./scripts/docker-build.sh dev

# Full deployment (build + run)
./scripts/docker-build.sh deploy

# View container logs
./scripts/docker-build.sh logs

# Check application health
./scripts/docker-build.sh health

# Stop containers
./scripts/docker-build.sh stop

# Clean up Docker resources
./scripts/docker-build.sh clean

# Push to registry
./scripts/docker-build.sh push
```

## 🔧 Environment Configuration

### Required Environment Variables
```env
NODE_ENV=production
DATABASE_URI=file:./data/payload.db
PAYLOAD_SECRET=your-super-secret-key-change-this
```

### Optional Configuration
```env
PORT=3000
NEXT_TELEMETRY_DISABLED=1
USE_BUN_RUNTIME=true
SKIP_MIGRATIONS=false
```

## 🚀 Deployment Options

### 1. Local Development
```bash
# Start development environment with hot reloading
./scripts/docker-build.sh dev

# Or use Docker Compose directly
docker-compose -f docker-compose.dev.yml up --build
```

### 2. Production Deployment
```bash
# Option 1: Using build script (recommended)
./scripts/docker-build.sh deploy

# Option 2: Using Docker Compose
docker-compose up --build -d

# Option 3: Direct Docker commands
docker build -f Dockerfile.enhanced -t orcaclubpro:latest .
docker run -d -p 3000:3000 --name orcaclubpro-app orcaclubpro:latest
```

### 3. Cloud Platform Deployment

#### Docker Registry Push
```bash
# Tag for your registry
docker tag orcaclubpro:latest your-registry.com/orcaclubpro:latest

# Push to registry
docker push your-registry.com/orcaclubpro:latest
```

#### Platform-Specific Examples

**Fly.io**
```bash
# Install flyctl and login
curl -L https://fly.io/install.sh | sh
fly auth login

# Deploy
fly deploy --dockerfile Dockerfile.enhanced
```

**Railway**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway up
```

**Google Cloud Run**
```bash
# Build and push
gcloud builds submit --tag gcr.io/PROJECT-ID/orcaclubpro

# Deploy
gcloud run deploy --image gcr.io/PROJECT-ID/orcaclubpro --platform managed
```

## 📊 Performance Optimizations

### Build Performance
- **Multi-stage builds**: Separates build and runtime environments
- **Layer caching**: Optimized COPY order for better cache utilization
- **BuildKit**: Advanced caching and parallel builds
- **Minimal base images**: Alpine Linux for smaller size

### Runtime Performance
- **Standalone output**: Next.js optimization for containerized deployment
- **Bun runtime**: Faster startup and better memory usage
- **Resource limits**: Configured memory and CPU limits
- **Health checks**: Proper container monitoring

### Size Optimization
```bash
# Compare image sizes
docker images | grep orcaclubpro

# Expected results:
# orcaclubpro   latest   ~150-200MB (vs 800MB+ unoptimized)
```

## 🔒 Security Features

### Container Security
- **Non-root user**: Runs as user `nextjs` (uid: 1001)
- **Read-only filesystem**: Where possible
- **No new privileges**: Security option enabled
- **Minimal attack surface**: Only necessary packages installed

### Environment Security
- **Secret management**: Environment variable based secrets
- **Database isolation**: Persistent volume for database files
- **Network isolation**: Container-level network policies

## 📈 Monitoring & Health Checks

### Built-in Health Checks
The container includes health checks that monitor:
- Application response time
- Database connectivity
- Memory usage

### Accessing Logs
```bash
# View real-time logs
./scripts/docker-build.sh logs

# Or directly with Docker
docker logs -f orcaclubpro-app
```

### Container Stats
```bash
# Monitor resource usage
docker stats orcaclubpro-app
```

## 🗄️ Database Management

### Database Persistence
The SQLite database is persisted using Docker volumes:
- **Development**: Named volume `dev_db_data`
- **Production**: Named volume `db_data`

### Database Migration
```bash
# Migrations run automatically during build
# To run manually in container:
docker exec orcaclubpro-app bun payload migrate
```

### Database Backup
```bash
# Backup database
docker exec orcaclubpro-app cp /app/data/payload.db /tmp/backup.db
docker cp orcaclubpro-app:/tmp/backup.db ./backup-$(date +%Y%m%d).db
```

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clean Docker build cache
docker builder prune

# Rebuild without cache
docker build --no-cache -f Dockerfile.enhanced -t orcaclubpro:latest .
```

#### Container Won't Start
```bash
# Check logs
./scripts/docker-build.sh logs

# Check container status
docker ps -a | grep orcaclubpro
```

#### Permission Issues
```bash
# Check volume permissions
docker exec orcaclubpro-app ls -la /app/data
```

#### Memory Issues
```bash
# Increase memory limits in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 1G
```

### Debug Mode
```bash
# Run container in interactive mode
docker run -it --rm orcaclubpro:latest sh

# Run with verbose logging
docker run -e VERBOSE=true orcaclubpro:latest
```

## 🔄 CI/CD Integration

### GitHub Actions Example
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
      
      - name: Build Docker image
        run: docker build -f Dockerfile.enhanced -t orcaclubpro:latest .
      
      - name: Push to registry
        run: |
          docker tag orcaclubpro:latest ${{ secrets.REGISTRY_URL }}/orcaclubpro:latest
          docker push ${{ secrets.REGISTRY_URL }}/orcaclubpro:latest
```

## 📚 Additional Resources

### Best Practices
- Always use `.env` files for environment-specific configuration
- Regularly update base images for security patches
- Monitor container resource usage in production
- Implement proper backup strategies for database
- Use container orchestration (Kubernetes, Docker Swarm) for production clusters

### Useful Commands
```bash
# View container resource usage
docker stats

# Clean up unused resources
docker system prune -af

# Update base images
docker pull oven/bun:alpine

# Export container as tar
docker save orcaclubpro:latest | gzip > orcaclubpro.tar.gz
```

## 🎯 Next Steps

1. **Production Setup**: Configure environment variables for your production environment
2. **SSL/TLS**: Set up reverse proxy (nginx/Traefik) for HTTPS
3. **Monitoring**: Implement application monitoring (Prometheus, Grafana)
4. **Backup Strategy**: Set up automated database backups
5. **CI/CD**: Implement automated deployment pipeline
6. **Scaling**: Consider container orchestration for high availability

## 🆘 Support

For issues with the Docker deployment:
1. Check the troubleshooting section above
2. Review container logs with `./scripts/docker-build.sh logs`
3. Verify environment configuration
4. Test with development setup first

---

**Happy Deploying! 🚀** 