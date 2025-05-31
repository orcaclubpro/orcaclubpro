# 🐳 Complete Docker CLI Deployment Guide for OrcaClubPro

## Overview

This guide provides multiple Docker CLI deployment solutions for your Next.js + Payload CMS + SQLite application, designed based on Docker CLI best practices and context7 research. Each solution targets different deployment scenarios and complexity levels.

## 🚀 Available Deployment Scripts

### 1. `docker-quick-deploy.sh` - One-Command Deployment
**Perfect for**: Quick local deployment and testing

```bash
./docker-quick-deploy.sh
```

**Features**:
- ✅ Single command deployment
- ✅ Automatic environment setup
- ✅ Volume persistence
- ✅ Immediate feedback with status

**Use Case**: Local development, quick demos, initial testing

---

### 2. `docker-cli-deploy.sh` - Advanced CLI Management
**Perfect for**: Development teams and advanced users

```bash
# Available commands
./docker-cli-deploy.sh setup        # Initial setup
./docker-cli-deploy.sh build        # Build image
./docker-cli-deploy.sh run          # Run production container
./docker-cli-deploy.sh dev          # Development environment
./docker-cli-deploy.sh deploy       # Build + run
./docker-cli-deploy.sh push         # Push to registry
./docker-cli-deploy.sh logs         # View logs
./docker-cli-deploy.sh health       # Health check
./docker-cli-deploy.sh backup       # Backup database
./docker-cli-deploy.sh clean        # Cleanup resources
```

**Features**:
- ✅ Comprehensive command set
- ✅ Multi-platform builds (ARM64/AMD64)
- ✅ Docker Swarm service deployment
- ✅ Database backup/restore
- ✅ Health monitoring
- ✅ Resource management

**Use Case**: Development workflows, staging environments, team collaboration

---

### 3. `docker-production-deploy.sh` - Enterprise Production
**Perfect for**: Production deployments with security and monitoring

```bash
./docker-production-deploy.sh deploy     # Full production deployment
./docker-production-deploy.sh rollback   # Rollback to previous version
./docker-production-deploy.sh status     # Check deployment status
./docker-production-deploy.sh verify     # Verify deployment health
```

**Features**:
- ✅ Security hardening (restricted networks, capabilities)
- ✅ Automatic backup before deployment
- ✅ Health verification with retries
- ✅ Rollback capability
- ✅ Resource limits and monitoring
- ✅ Read-only filesystem
- ✅ Version tagging and image management

**Use Case**: Production environments, enterprise deployments, mission-critical applications

---

### 4. `docker-cloud-deploy.sh` - Multi-Cloud Support
**Perfect for**: Cloud platform deployments

```bash
# Supported platforms
./docker-cloud-deploy.sh fly deploy      # Deploy to Fly.io
./docker-cloud-deploy.sh railway deploy  # Deploy to Railway
./docker-cloud-deploy.sh gcp deploy      # Deploy to Google Cloud Run
./docker-cloud-deploy.sh azure deploy    # Deploy to Azure Container Instances
./docker-cloud-deploy.sh aws deploy      # Deploy to AWS ECS
./docker-cloud-deploy.sh registry deploy # Push to Docker registry

# Setup and status
./docker-cloud-deploy.sh fly setup       # Setup platform environment
./docker-cloud-deploy.sh gcp status      # Check deployment status
```

**Features**:
- ✅ Auto-detection of available cloud CLIs
- ✅ Platform-specific configuration generation
- ✅ Registry integration
- ✅ Environment-specific settings
- ✅ Status monitoring per platform

**Use Case**: Cloud deployments, multi-environment setups, CI/CD pipelines

## 📋 Quick Start Guide

### Step 1: Choose Your Deployment Method

| Script | Complexity | Use Case | Time to Deploy |
|--------|------------|----------|----------------|
| `docker-quick-deploy.sh` | 🟢 Simple | Local/Demo | ~2 minutes |
| `docker-cli-deploy.sh` | 🟡 Moderate | Development | ~5 minutes |
| `docker-production-deploy.sh` | 🔴 Advanced | Production | ~10 minutes |
| `docker-cloud-deploy.sh` | 🟡 Moderate | Cloud | ~5-15 minutes |

### Step 2: Basic Setup

```bash
# 1. Ensure Docker is running
docker --version

# 2. Setup environment (all scripts can do this automatically)
cp env.docker.example .env
# Edit .env with your configuration

# 3. Choose and run your preferred deployment script
```

### Step 3: Quick Deployment Examples

#### Local Development
```bash
# Quick local deployment
./docker-quick-deploy.sh

# Or development environment with hot reloading
./docker-cli-deploy.sh dev
```

#### Production Environment
```bash
# Secure production deployment
./docker-production-deploy.sh deploy
```

#### Cloud Deployment
```bash
# Deploy to Fly.io
./docker-cloud-deploy.sh fly deploy

# Deploy to Railway
./docker-cloud-deploy.sh railway deploy
```

## 🔧 Environment Configuration

### Required Variables
```env
NODE_ENV=production
DATABASE_URI=file:./data/payload.db
PAYLOAD_SECRET=your-super-secret-key-change-this-in-production
```

### Optional Variables
```env
PORT=3000
REGISTRY_URL=your-registry.com/namespace
USE_BUN_RUNTIME=true
SKIP_MIGRATIONS=false
```

### Cloud-Specific Variables
```env
# Google Cloud
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1

# AWS
AWS_ACCOUNT_ID=123456789012
AWS_REGION=us-east-1

# Azure
AZURE_RESOURCE_GROUP=orcaclubpro-rg
AZURE_LOCATION=eastus
```

## 🎯 Script Comparison Matrix

| Feature | Quick | CLI | Production | Cloud |
|---------|-------|-----|------------|-------|
| One-command deploy | ✅ | ✅ | ✅ | ✅ |
| Development mode | ❌ | ✅ | ❌ | ❌ |
| Security hardening | ❌ | ⚠️ | ✅ | ⚠️ |
| Health monitoring | ⚠️ | ✅ | ✅ | ✅ |
| Backup/Restore | ❌ | ✅ | ✅ | ❌ |
| Multi-platform builds | ❌ | ✅ | ❌ | ✅ |
| Cloud integration | ❌ | ❌ | ❌ | ✅ |
| Rollback capability | ❌ | ❌ | ✅ | ⚠️ |
| Resource limits | ⚠️ | ✅ | ✅ | ✅ |
| Registry support | ❌ | ✅ | ✅ | ✅ |

## 🛡️ Security Features

### Production Security (`docker-production-deploy.sh`)
- **Restricted Networks**: Isolated container networking
- **Capability Dropping**: Minimal Linux capabilities
- **Read-only Filesystem**: Prevents runtime modifications
- **Non-root User**: Runs as user ID 1001
- **Security Options**: `no-new-privileges`, `seccomp`
- **Resource Limits**: Memory and CPU constraints
- **Health Monitoring**: Automatic health verification

### General Security (All Scripts)
- **Environment Isolation**: Secrets via environment variables
- **Volume Persistence**: Database isolation
- **Port Binding**: Localhost-only binding for production
- **Image Scanning**: Docker Scout integration where available

## 📊 Monitoring and Observability

### Health Checks
All scripts include health monitoring via:
- **Container health checks**: Docker native health monitoring
- **Application health endpoint**: `/api/health` endpoint verification
- **Resource monitoring**: Memory and CPU usage tracking

### Logging
```bash
# View real-time logs
docker logs -f orcaclubpro-app

# Or use script shortcuts
./docker-cli-deploy.sh logs
./docker-production-deploy.sh status
```

### Metrics
```bash
# Container statistics
docker stats orcaclubpro-app

# Or use built-in monitoring
./docker-cli-deploy.sh health
```

## 🔄 Backup and Recovery

### Database Backup
```bash
# Create backup
./docker-cli-deploy.sh backup

# Restore from backup
./docker-cli-deploy.sh restore backup-20231201-120000.db
```

### Container Backup
```bash
# Export container
docker export orcaclubpro-app > orcaclubpro-backup.tar

# Save image
docker save orcaclubpro:latest | gzip > orcaclubpro-image.tar.gz
```

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Deploy OrcaClubPro

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to production
        run: ./docker-production-deploy.sh deploy
        env:
          PAYLOAD_SECRET: ${{ secrets.PAYLOAD_SECRET }}
```

### GitLab CI Example
```yaml
deploy:
  stage: deploy
  script:
    - ./docker-cloud-deploy.sh fly deploy
  environment:
    name: production
    url: https://your-app.fly.dev
```

## 🏗️ Advanced Usage Patterns

### Multi-Environment Deployment
```bash
# Development
NODE_ENV=development ./docker-cli-deploy.sh dev

# Staging
ENVIRONMENT=staging ./docker-production-deploy.sh deploy

# Production
ENVIRONMENT=production ./docker-production-deploy.sh deploy
```

### Registry Workflow
```bash
# Build and push to registry
REGISTRY_URL=your-registry.com ./docker-cli-deploy.sh push

# Deploy from registry on another machine
REGISTRY_URL=your-registry.com ./docker-cli-deploy.sh pull
./docker-cli-deploy.sh run
```

### Swarm Deployment
```bash
# Deploy as Docker Swarm service
./docker-cli-deploy.sh deploy latest 3  # 3 replicas
```

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
```bash
# Clear Docker cache
docker builder prune -f

# Rebuild without cache
DOCKER_BUILDKIT=1 docker build --no-cache -f Dockerfile.enhanced .
```

#### Container Won't Start
```bash
# Check logs
./docker-cli-deploy.sh logs

# Verify environment
source .env && echo $PAYLOAD_SECRET
```

#### Permission Issues
```bash
# Check volume permissions
docker exec orcaclubpro-app ls -la /app/data

# Reset volumes
./docker-cli-deploy.sh clean true
```

#### Health Check Failures
```bash
# Manual health check
curl -f http://localhost:3000/api/health

# Container health status
docker inspect --format='{{.State.Health.Status}}' orcaclubpro-app
```

### Debug Mode
```bash
# Run with verbose logging
VERBOSE=true ./docker-cli-deploy.sh deploy

# Interactive container access
docker exec -it orcaclubpro-app /bin/sh
```

## 🎯 Best Practices

### Development
- Use `docker-cli-deploy.sh dev` for hot reloading
- Use volume mounts for rapid iteration
- Enable verbose logging for debugging

### Staging
- Use `docker-production-deploy.sh` with staging environment
- Test rollback procedures
- Validate health checks

### Production
- Always use `docker-production-deploy.sh`
- Set strong `PAYLOAD_SECRET`
- Enable monitoring and alerting
- Regular database backups
- Test disaster recovery procedures

### Cloud
- Use platform-specific optimizations
- Configure auto-scaling where available
- Set up proper monitoring and logging
- Use managed databases for persistence

## 📚 Additional Resources

### Documentation Files
- `DOCKER_DEPLOYMENT.md` - Comprehensive deployment guide
- `DOCKER_SOLUTION_SUMMARY.md` - Architecture overview
- `env.docker.example` - Environment template

### Script Files
- `docker-quick-deploy.sh` - Quick deployment
- `docker-cli-deploy.sh` - Advanced CLI management  
- `docker-production-deploy.sh` - Production deployment
- `docker-cloud-deploy.sh` - Cloud deployment

### Docker Files
- `Dockerfile.enhanced` - Optimized multi-stage build
- `docker-compose.yml` - Production configuration
- `docker-compose.dev.yml` - Development configuration
- `.dockerignore` - Build context optimization

---

## 🎉 Success! Your Application is Containerized

Your OrcaClubPro application now has enterprise-grade Docker CLI deployment capabilities:

✅ **Multiple deployment options** for different scenarios  
✅ **Security-hardened** production deployments  
✅ **Cloud platform support** for major providers  
✅ **Monitoring and health checks** built-in  
✅ **Backup and recovery** procedures  
✅ **CI/CD ready** with automation scripts  

Choose the script that best fits your needs and deploy with confidence! 🚀 