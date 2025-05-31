#!/bin/bash

# 🐳 Advanced Docker CLI Deployment Solution for OrcaClubPro
# Based on Docker CLI best practices and automation patterns
# Provides enterprise-grade deployment workflows via Docker CLI

set -euo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_NAME="orcaclubpro"
readonly IMAGE_NAME="${PROJECT_NAME}"
readonly REGISTRY_URL="${REGISTRY_URL:-}"
readonly DOCKERFILE="${DOCKERFILE:-Dockerfile.enhanced}"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1" >&2
}

log_success() {
    echo -e "${GREEN}✓${NC} $1" >&2
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1" >&2
}

log_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

log_step() {
    echo -e "${CYAN}${BOLD}→${NC} $1" >&2
}

# Utility functions
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker CLI not found. Please install Docker."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon not running. Please start Docker."
        exit 1
    fi
    
    log_success "Docker CLI and daemon are available"
}

check_requirements() {
    log_step "Checking requirements"
    check_docker
    
    if [[ ! -f "$DOCKERFILE" ]]; then
        log_error "Dockerfile not found: $DOCKERFILE"
        exit 1
    fi
    
    if [[ ! -f "package.json" ]]; then
        log_error "package.json not found. Are you in the right directory?"
        exit 1
    fi
    
    log_success "All requirements satisfied"
}

# Environment management
setup_environment() {
    local env_file="${1:-.env}"
    
    log_step "Setting up environment"
    
    if [[ ! -f "$env_file" ]]; then
        if [[ -f "env.docker.example" ]]; then
            log_info "Creating $env_file from template"
            cp env.docker.example "$env_file"
            log_warning "Please edit $env_file with your configuration"
        else
            log_error "Environment file not found: $env_file"
            exit 1
        fi
    fi
    
    # Validate required environment variables
    source "$env_file"
    
    if [[ -z "${PAYLOAD_SECRET:-}" ]] || [[ "$PAYLOAD_SECRET" == "your-super-secret-key-change-this-in-production" ]]; then
        log_error "PAYLOAD_SECRET must be set to a secure value in $env_file"
        exit 1
    fi
    
    log_success "Environment configured"
}

# Build functions
build_image() {
    local tag="${1:-latest}"
    local target="${2:-runner}"
    local context="${3:-.}"
    
    log_step "Building Docker image: $IMAGE_NAME:$tag"
    
    # Build with Docker CLI using BuildKit
    DOCKER_BUILDKIT=1 docker build \
        --file "$DOCKERFILE" \
        --target "$target" \
        --tag "$IMAGE_NAME:$tag" \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --progress=plain \
        "$context"
    
    log_success "Image built successfully: $IMAGE_NAME:$tag"
}

build_multi_platform() {
    local tag="${1:-latest}"
    local platforms="${2:-linux/amd64,linux/arm64}"
    
    log_step "Building multi-platform image: $IMAGE_NAME:$tag"
    
    # Create and use buildx builder if not exists
    if ! docker buildx ls | grep -q "multiplatform-builder"; then
        log_info "Creating buildx builder for multi-platform builds"
        docker buildx create --name multiplatform-builder --use
    fi
    
    docker buildx build \
        --file "$DOCKERFILE" \
        --platform "$platforms" \
        --tag "$IMAGE_NAME:$tag" \
        --build-arg BUILDKIT_INLINE_CACHE=1 \
        --progress=plain \
        --push \
        .
    
    log_success "Multi-platform image built and pushed: $IMAGE_NAME:$tag"
}

# Container management
run_container() {
    local tag="${1:-latest}"
    local env_file="${2:-.env}"
    local port="${3:-3000}"
    local container_name="${PROJECT_NAME}-app"
    
    log_step "Running container: $container_name"
    
    # Stop existing container if running
    if docker ps -q --filter "name=$container_name" | grep -q .; then
        log_info "Stopping existing container"
        docker stop "$container_name"
    fi
    
    # Remove existing container if exists
    if docker ps -aq --filter "name=$container_name" | grep -q .; then
        log_info "Removing existing container"
        docker rm "$container_name"
    fi
    
    # Run new container
    docker run \
        --detach \
        --name "$container_name" \
        --env-file "$env_file" \
        --publish "$port:3000" \
        --volume "${PROJECT_NAME}_db_data:/app/data" \
        --restart unless-stopped \
        --security-opt no-new-privileges:true \
        --user 1001:1001 \
        --memory 512m \
        --cpus 0.5 \
        "$IMAGE_NAME:$tag"
    
    log_success "Container started: $container_name"
    log_info "Application available at: http://localhost:$port"
}

run_development() {
    local container_name="${PROJECT_NAME}-dev"
    
    log_step "Starting development environment"
    
    # Stop existing dev container
    docker stop "$container_name" 2>/dev/null || true
    docker rm "$container_name" 2>/dev/null || true
    
    # Run development container with volume mounts
    docker run \
        --interactive \
        --tty \
        --name "$container_name" \
        --env NODE_ENV=development \
        --env DATABASE_URI=file:./data/payload.db \
        --env PAYLOAD_SECRET=development-secret \
        --publish 3000:3000 \
        --volume "$(pwd):/app" \
        --volume "${PROJECT_NAME}_node_modules:/app/node_modules" \
        --volume "${PROJECT_NAME}_dev_db_data:/app/data" \
        --workdir /app \
        "$IMAGE_NAME:latest" \
        bun run dev
}

# Registry operations
push_image() {
    local tag="${1:-latest}"
    local registry_tag="$REGISTRY_URL/$IMAGE_NAME:$tag"
    
    if [[ -z "$REGISTRY_URL" ]]; then
        log_error "REGISTRY_URL not set. Please set it to push images."
        exit 1
    fi
    
    log_step "Pushing image to registry: $registry_tag"
    
    # Tag for registry
    docker tag "$IMAGE_NAME:$tag" "$registry_tag"
    
    # Push to registry
    docker push "$registry_tag"
    
    log_success "Image pushed: $registry_tag"
}

pull_image() {
    local tag="${1:-latest}"
    local registry_tag="$REGISTRY_URL/$IMAGE_NAME:$tag"
    
    if [[ -z "$REGISTRY_URL" ]]; then
        log_error "REGISTRY_URL not set. Please set it to pull images."
        exit 1
    fi
    
    log_step "Pulling image from registry: $registry_tag"
    
    docker pull "$registry_tag"
    docker tag "$registry_tag" "$IMAGE_NAME:$tag"
    
    log_success "Image pulled: $registry_tag"
}

# Service management (Docker Swarm)
deploy_swarm_service() {
    local tag="${1:-latest}"
    local replicas="${2:-1}"
    local service_name="${PROJECT_NAME}-service"
    
    log_step "Deploying Docker Swarm service: $service_name"
    
    # Initialize swarm if not already done
    if ! docker info | grep -q "Swarm: active"; then
        log_info "Initializing Docker Swarm"
        docker swarm init
    fi
    
    # Create or update service
    if docker service ls --filter "name=$service_name" | grep -q "$service_name"; then
        log_info "Updating existing service"
        docker service update \
            --image "$IMAGE_NAME:$tag" \
            --replicas "$replicas" \
            "$service_name"
    else
        log_info "Creating new service"
        docker service create \
            --name "$service_name" \
            --replicas "$replicas" \
            --publish 3000:3000 \
            --env-file .env \
            --mount type=volume,source="${PROJECT_NAME}_db_data",target=/app/data \
            --constraint 'node.role == manager' \
            "$IMAGE_NAME:$tag"
    fi
    
    log_success "Service deployed: $service_name"
}

# Monitoring and maintenance
show_logs() {
    local container_name="${1:-${PROJECT_NAME}-app}"
    local follow="${2:-false}"
    
    log_step "Showing logs for: $container_name"
    
    if [[ "$follow" == "true" ]]; then
        docker logs --follow "$container_name"
    else
        docker logs --tail 100 "$container_name"
    fi
}

health_check() {
    local container_name="${1:-${PROJECT_NAME}-app}"
    local endpoint="${2:-http://localhost:3000/api/health}"
    
    log_step "Checking application health"
    
    # Check container status
    if ! docker ps --filter "name=$container_name" | grep -q "$container_name"; then
        log_error "Container not running: $container_name"
        return 1
    fi
    
    log_success "Container is running: $container_name"
    
    # Check application health endpoint
    if command -v curl &> /dev/null; then
        if curl -f -s "$endpoint" > /dev/null; then
            log_success "Application health check passed"
        else
            log_warning "Application health check failed"
        fi
    else
        log_info "curl not available, skipping health endpoint check"
    fi
    
    # Show container stats
    docker stats --no-stream "$container_name"
}

# Cleanup functions
stop_containers() {
    log_step "Stopping containers"
    
    docker stop "${PROJECT_NAME}-app" "${PROJECT_NAME}-dev" 2>/dev/null || true
    
    log_success "Containers stopped"
}

cleanup() {
    local remove_volumes="${1:-false}"
    
    log_step "Cleaning up Docker resources"
    
    # Stop and remove containers
    docker stop "${PROJECT_NAME}-app" "${PROJECT_NAME}-dev" 2>/dev/null || true
    docker rm "${PROJECT_NAME}-app" "${PROJECT_NAME}-dev" 2>/dev/null || true
    
    # Remove images
    docker rmi "$IMAGE_NAME:latest" 2>/dev/null || true
    
    # Remove volumes if requested
    if [[ "$remove_volumes" == "true" ]]; then
        log_warning "Removing volumes (data will be lost)"
        docker volume rm "${PROJECT_NAME}_db_data" "${PROJECT_NAME}_dev_db_data" "${PROJECT_NAME}_node_modules" 2>/dev/null || true
    fi
    
    # Clean up system
    docker system prune -f
    
    log_success "Cleanup completed"
}

# Backup and restore
backup_database() {
    local backup_file="backup-$(date +%Y%m%d-%H%M%S).db"
    local container_name="${PROJECT_NAME}-app"
    
    log_step "Creating database backup: $backup_file"
    
    if ! docker ps --filter "name=$container_name" | grep -q "$container_name"; then
        log_error "Container not running: $container_name"
        exit 1
    fi
    
    docker exec "$container_name" cp /app/data/payload.db "/tmp/$backup_file"
    docker cp "$container_name:/tmp/$backup_file" "./$backup_file"
    
    log_success "Database backed up to: $backup_file"
}

restore_database() {
    local backup_file="$1"
    local container_name="${PROJECT_NAME}-app"
    
    if [[ -z "$backup_file" ]]; then
        log_error "Backup file not specified"
        exit 1
    fi
    
    if [[ ! -f "$backup_file" ]]; then
        log_error "Backup file not found: $backup_file"
        exit 1
    fi
    
    log_step "Restoring database from: $backup_file"
    
    if ! docker ps --filter "name=$container_name" | grep -q "$container_name"; then
        log_error "Container not running: $container_name"
        exit 1
    fi
    
    docker cp "$backup_file" "$container_name:/tmp/restore.db"
    docker exec "$container_name" cp /tmp/restore.db /app/data/payload.db
    docker restart "$container_name"
    
    log_success "Database restored from: $backup_file"
}

# Help function
show_help() {
    cat << EOF
🐳 Advanced Docker CLI Deployment Solution for OrcaClubPro

Usage: $0 [COMMAND] [OPTIONS]

COMMANDS:
  build [TAG]              Build Docker image
  build-multi [TAG]        Build multi-platform image
  run [TAG] [PORT]         Run production container
  dev                      Start development environment
  
  push [TAG]               Push image to registry
  pull [TAG]               Pull image from registry
  
  deploy [TAG] [REPLICAS]  Deploy as Docker Swarm service
  
  logs [CONTAINER] [follow] Show container logs
  health [CONTAINER]       Check application health
  stats [CONTAINER]        Show container statistics
  
  backup                   Backup database
  restore [FILE]           Restore database from backup
  
  stop                     Stop all containers
  clean [volumes]          Clean up resources
  
  setup                    Setup environment
  check                    Check requirements

EXAMPLES:
  $0 setup                 # Initial setup
  $0 build latest          # Build latest image
  $0 run latest 3000       # Run on port 3000
  $0 dev                   # Development mode
  $0 deploy latest 3       # Deploy 3 replicas
  $0 push latest           # Push to registry
  $0 logs orcaclubpro-app true  # Follow logs
  $0 health                # Check health
  $0 backup                # Backup database
  $0 clean true            # Clean including volumes

ENVIRONMENT:
  REGISTRY_URL             Container registry URL
  DOCKERFILE               Dockerfile to use (default: Dockerfile.enhanced)

For more information, see DOCKER_DEPLOYMENT.md
EOF
}

# Main command dispatcher
main() {
    case "${1:-help}" in
        "setup")
            check_requirements
            setup_environment
            ;;
        "check")
            check_requirements
            ;;
        "build")
            check_requirements
            build_image "${2:-latest}"
            ;;
        "build-multi")
            check_requirements
            build_multi_platform "${2:-latest}" "${3:-linux/amd64,linux/arm64}"
            ;;
        "run")
            check_requirements
            setup_environment
            run_container "${2:-latest}" ".env" "${3:-3000}"
            ;;
        "dev")
            check_requirements
            run_development
            ;;
        "push")
            check_requirements
            push_image "${2:-latest}"
            ;;
        "pull")
            check_requirements
            pull_image "${2:-latest}"
            ;;
        "deploy")
            check_requirements
            setup_environment
            deploy_swarm_service "${2:-latest}" "${3:-1}"
            ;;
        "logs")
            show_logs "${2:-${PROJECT_NAME}-app}" "${3:-false}"
            ;;
        "health")
            health_check "${2:-${PROJECT_NAME}-app}"
            ;;
        "stats")
            docker stats --no-stream "${2:-${PROJECT_NAME}-app}"
            ;;
        "backup")
            backup_database
            ;;
        "restore")
            restore_database "$2"
            ;;
        "stop")
            stop_containers
            ;;
        "clean")
            cleanup "${2:-false}"
            ;;
        "help"|"-h"|"--help"|"")
            show_help
            ;;
        *)
            log_error "Unknown command: $1"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 