#!/bin/bash

# Docker Build Script for OrcaClubPro
# Provides easy commands for building and deploying the containerized application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="orcaclubpro"
VERSION=${VERSION:-"latest"}
DOCKERFILE=${DOCKERFILE:-"Dockerfile.enhanced"}

# Functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Help function
show_help() {
    cat << EOF
Docker Build Script for OrcaClubPro

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    build         Build the Docker image
    run           Run the container in production mode
    dev           Run the container in development mode
    push          Push the image to registry
    clean         Clean up Docker resources
    deploy        Full deployment (build + run)
    logs          Show container logs
    stop          Stop running containers
    health        Check container health

Options:
    -v, --version VERSION    Set image version (default: latest)
    -t, --tag TAG           Set custom image tag
    -h, --help              Show this help message

Examples:
    $0 build                 # Build production image
    $0 dev                   # Start development environment
    $0 deploy                # Build and run production
    $0 run -v 1.0.0          # Run specific version

EOF
}

# Build function
build_image() {
    local target=${1:-"runner"}
    local tag=${2:-"$IMAGE_NAME:$VERSION"}
    
    log_info "Building Docker image: $tag (target: $target)"
    
    docker build \
        -f $DOCKERFILE \
        --target $target \
        --tag $tag \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        .
    
    log_success "Image built successfully: $tag"
}

# Run production container
run_production() {
    local tag=${1:-"$IMAGE_NAME:$VERSION"}
    
    log_info "Starting production container"
    
    # Stop existing container if running
    docker stop orcaclubpro-app 2>/dev/null || true
    docker rm orcaclubpro-app 2>/dev/null || true
    
    docker run -d \
        --name orcaclubpro-app \
        --restart unless-stopped \
        -p 3000:3000 \
        -e NODE_ENV=production \
        -e DATABASE_URI=file:./data/payload.db \
        -e PAYLOAD_SECRET=${PAYLOAD_SECRET:-"change-this-in-production"} \
        -v orcaclubpro_db_data:/app/data \
        $tag
    
    log_success "Production container started"
    log_info "Application available at: http://localhost:3000"
}

# Run development container
run_development() {
    log_info "Starting development environment"
    
    docker-compose -f docker-compose.dev.yml up --build
}

# Deploy function (build + run)
deploy() {
    log_info "Starting full deployment"
    
    build_image "runner" "$IMAGE_NAME:$VERSION"
    run_production "$IMAGE_NAME:$VERSION"
    
    log_success "Deployment completed"
}

# Push to registry
push_image() {
    local tag=${1:-"$IMAGE_NAME:$VERSION"}
    
    log_info "Pushing image to registry: $tag"
    
    docker push $tag
    
    log_success "Image pushed successfully"
}

# Clean up Docker resources
clean_docker() {
    log_info "Cleaning up Docker resources"
    
    # Stop containers
    docker stop orcaclubpro-app orcaclubpro-dev 2>/dev/null || true
    docker rm orcaclubpro-app orcaclubpro-dev 2>/dev/null || true
    
    # Remove images
    docker rmi $IMAGE_NAME:$VERSION 2>/dev/null || true
    
    # Clean up system
    docker system prune -f
    
    log_success "Cleanup completed"
}

# Show logs
show_logs() {
    local container=${1:-"orcaclubpro-app"}
    
    log_info "Showing logs for container: $container"
    docker logs -f $container
}

# Stop containers
stop_containers() {
    log_info "Stopping containers"
    
    docker stop orcaclubpro-app orcaclubpro-dev 2>/dev/null || true
    
    log_success "Containers stopped"
}

# Health check
health_check() {
    log_info "Checking container health"
    
    if docker ps | grep -q orcaclubpro-app; then
        log_success "Container is running"
        
        # Test HTTP response
        if curl -f http://localhost:3000 >/dev/null 2>&1; then
            log_success "Application is responding"
        else
            log_warning "Application is not responding"
        fi
    else
        log_error "Container is not running"
    fi
}

# Main script logic
case "$1" in
    "build")
        build_image
        ;;
    "run")
        run_production
        ;;
    "dev")
        run_development
        ;;
    "push")
        push_image
        ;;
    "clean")
        clean_docker
        ;;
    "deploy")
        deploy
        ;;
    "logs")
        show_logs $2
        ;;
    "stop")
        stop_containers
        ;;
    "health")
        health_check
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac 