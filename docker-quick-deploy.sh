#!/bin/bash

# 🚀 Quick Docker CLI Deployment for OrcaClubPro
# One-command deployment solution

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🐳 OrcaClubPro Quick Deployment${NC}"
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon not running. Please start Docker first.${NC}"
    exit 1
fi

# Setup environment if needed
if [[ ! -f ".env" ]]; then
    if [[ -f "env.docker.example" ]]; then
        echo -e "${BLUE}📝 Setting up environment...${NC}"
        cp env.docker.example .env
        echo -e "${YELLOW}⚠️  Please edit .env with your configuration${NC}"
        echo -e "${YELLOW}⚠️  IMPORTANT: Change PAYLOAD_SECRET before production!${NC}"
        echo ""
        echo -e "${BLUE}📝 Generated .env file with default values.${NC}"
        echo -e "${BLUE}📝 You can continue with the build or edit .env first.${NC}"
        echo ""
    fi
fi

# Check for lockfile mismatch and offer to fix it
if [[ -f "package-lock.json" ]] && [[ ! -f "bun.lockb" ]]; then
    echo -e "${YELLOW}⚠️  Found package-lock.json but no bun.lockb${NC}"
    echo -e "${BLUE}📝 This is fine - Docker will handle the conversion automatically${NC}"
    echo ""
fi

# Build the image with error handling
echo -e "${BLUE}🏗️  Building Docker image...${NC}"
if ! docker build -f Dockerfile.enhanced -t orcaclubpro:latest .; then
    echo -e "${RED}❌ Docker build failed!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Troubleshooting tips:${NC}"
    echo -e "   1. Check if all dependencies in package.json are compatible"
    echo -e "   2. Try running: bun install locally first"
    echo -e "   3. Check Docker logs above for specific error details"
    echo -e "   4. Try: docker system prune -f to clean up cache"
    echo ""
    exit 1
fi

# Stop existing container
echo -e "${BLUE}🛑 Stopping existing container...${NC}"
docker stop orcaclubpro-app 2>/dev/null || true
docker rm orcaclubpro-app 2>/dev/null || true

# Create volume for database persistence
docker volume create orcaclubpro_db_data 2>/dev/null || true

# Run the container
echo -e "${BLUE}🚀 Starting application...${NC}"
if ! docker run -d \
    --name orcaclubpro-app \
    --env-file .env \
    -p 3000:3000 \
    -v orcaclubpro_db_data:/app/data \
    --restart unless-stopped \
    orcaclubpro:latest; then
    echo -e "${RED}❌ Failed to start container!${NC}"
    echo -e "${YELLOW}💡 Check Docker logs: docker logs orcaclubpro-app${NC}"
    exit 1
fi

# Wait a moment for container to start
sleep 3

# Check if container is running
if docker ps | grep -q orcaclubpro-app; then
    echo ""
    echo -e "${GREEN}✅ Deployment complete!${NC}"
    echo -e "${GREEN}🌐 Application available at: http://localhost:3000${NC}"
    echo -e "${GREEN}📊 Health check: http://localhost:3000/api/health${NC}"
    echo ""
    echo -e "${BLUE}📋 Useful commands:${NC}"
    echo "  docker logs -f orcaclubpro-app    # View logs"
    echo "  docker stop orcaclubpro-app       # Stop application"
    echo "  docker start orcaclubpro-app      # Start application"
    echo "  docker restart orcaclubpro-app    # Restart application"
    echo ""
    
    # Try to check if the app is responding
    sleep 5
    if command -v curl &> /dev/null; then
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            echo -e "${GREEN}✅ Health check passed - application is responding!${NC}"
        else
            echo -e "${YELLOW}⚠️  Health check pending - application may still be starting...${NC}"
            echo -e "${BLUE}📝 Check logs if issues persist: docker logs orcaclubpro-app${NC}"
        fi
    fi
else
    echo -e "${RED}❌ Container failed to start properly!${NC}"
    echo -e "${YELLOW}💡 Check logs: docker logs orcaclubpro-app${NC}"
    exit 1
fi 