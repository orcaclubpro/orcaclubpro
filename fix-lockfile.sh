#!/bin/bash

# 🔧 Fix Lockfile Issues for Docker Deployment
# Resolves package manager conflicts and ensures smooth Docker builds

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🔧 Fixing lockfile and dependency issues${NC}"
echo ""

# Check current state
if [[ -f "bun.lockb" ]]; then
    echo -e "${GREEN}✅ bun.lockb found - no action needed${NC}"
    exit 0
fi

if [[ -f "package-lock.json" ]]; then
    echo -e "${YELLOW}⚠️  Found package-lock.json, converting to bun lockfile${NC}"
    
    # Remove package-lock.json and node_modules
    echo -e "${BLUE}📝 Cleaning old dependencies...${NC}"
    rm -f package-lock.json
    rm -rf node_modules
    
    # Install with bun to generate bun.lockb
    echo -e "${BLUE}📝 Installing dependencies with bun...${NC}"
    bun install
    
    echo -e "${GREEN}✅ Generated bun.lockb successfully${NC}"
    echo ""
else
    echo -e "${BLUE}📝 No lockfile found, generating fresh bun.lockb...${NC}"
    bun install
    echo -e "${GREEN}✅ Generated bun.lockb successfully${NC}"
    echo ""
fi

# Test if Docker build works now
echo -e "${BLUE}🧪 Testing Docker build...${NC}"
if docker build -f Dockerfile.enhanced -t orcaclubpro:test . --no-cache; then
    echo -e "${GREEN}✅ Docker build test successful!${NC}"
    echo -e "${BLUE}📝 Cleaning up test image...${NC}"
    docker rmi orcaclubpro:test 2>/dev/null || true
else
    echo -e "${RED}❌ Docker build still failing${NC}"
    echo -e "${YELLOW}💡 You may need to check package.json dependencies${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 All fixes applied successfully!${NC}"
echo -e "${BLUE}📝 You can now run: ./docker-quick-deploy.sh${NC}" 