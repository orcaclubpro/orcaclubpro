#!/bin/bash

# ☁️ Cloud Docker CLI Deployment for OrcaClubPro
# Multi-cloud deployment support via Docker CLI

set -euo pipefail

# Configuration
readonly PROJECT_NAME="orcaclubpro"
readonly REGISTRY_URL="${REGISTRY_URL:-}"
readonly CLOUD_PLATFORM="${CLOUD_PLATFORM:-}"

# Colors
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly BOLD='\033[1m'
readonly NC='\033[0m'

# Logging
log_info() { echo -e "${BLUE}ℹ${NC} $1" >&2; }
log_success() { echo -e "${GREEN}✓${NC} $1" >&2; }
log_warning() { echo -e "${YELLOW}⚠${NC} $1" >&2; }
log_error() { echo -e "${RED}✗${NC} $1" >&2; }
log_step() { echo -e "${CYAN}${BOLD}→${NC} $1" >&2; }

# Cloud platform detection
detect_platform() {
    if command -v fly &>/dev/null; then
        echo "fly"
    elif command -v railway &>/dev/null; then
        echo "railway"
    elif command -v gcloud &>/dev/null; then
        echo "gcp"
    elif command -v az &>/dev/null; then
        echo "azure"
    elif command -v aws &>/dev/null; then
        echo "aws"
    else
        echo "docker"
    fi
}

# Fly.io deployment
deploy_flyio() {
    log_step "Deploying to Fly.io"
    
    # Create fly.toml if it doesn't exist
    if [[ ! -f "fly.toml" ]]; then
        cat > fly.toml << EOF
app = "${PROJECT_NAME}"
primary_region = "sjc"

[experimental]
  auto_rollback = true

[http_service]
  internal_port = 3000
  force_https = true

[[services]]
  http_checks = []
  internal_port = 3000
  processes = ["app"]
  protocol = "tcp"
  script_checks = []

  [services.concurrency]
    hard_limit = 25
    soft_limit = 20
    type = "connections"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

  [[services.tcp_checks]]
    grace_period = "1s"
    interval = "15s"
    restart_limit = 0
    timeout = "2s"

[[vm]]
  memory = "512mb"
  cpu_kind = "shared"
  cpus = 1

[env]
  NODE_ENV = "production"
  PORT = "3000"
EOF
        log_info "Created fly.toml configuration"
    fi
    
    # Deploy
    fly deploy --dockerfile Dockerfile.enhanced
    
    log_success "Deployed to Fly.io"
}

# Railway deployment
deploy_railway() {
    log_step "Deploying to Railway"
    
    # Create railway.json if it doesn't exist
    if [[ ! -f "railway.json" ]]; then
        cat > railway.json << EOF
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.enhanced"
  },
  "deploy": {
    "startCommand": "bun run start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE"
  }
}
EOF
        log_info "Created railway.json configuration"
    fi
    
    # Deploy
    railway up
    
    log_success "Deployed to Railway"
}

# Google Cloud Run deployment
deploy_gcp() {
    log_step "Deploying to Google Cloud Run"
    
    local project_id="${GCP_PROJECT_ID:-}"
    local region="${GCP_REGION:-us-central1}"
    
    if [[ -z "$project_id" ]]; then
        log_error "GCP_PROJECT_ID environment variable not set"
        exit 1
    fi
    
    # Build and push to GCR
    local image_url="gcr.io/$project_id/$PROJECT_NAME:latest"
    
    docker build -f Dockerfile.enhanced -t "$image_url" .
    docker push "$image_url"
    
    # Deploy to Cloud Run
    gcloud run deploy "$PROJECT_NAME" \
        --image "$image_url" \
        --platform managed \
        --region "$region" \
        --allow-unauthenticated \
        --memory 512Mi \
        --cpu 1 \
        --port 3000 \
        --set-env-vars NODE_ENV=production \
        --set-env-vars DATABASE_URI=file:./data/payload.db \
        --set-env-vars PAYLOAD_SECRET="$PAYLOAD_SECRET" \
        --timeout 300
    
    log_success "Deployed to Google Cloud Run"
}

# Azure Container Instances deployment
deploy_azure() {
    log_step "Deploying to Azure Container Instances"
    
    local resource_group="${AZURE_RESOURCE_GROUP:-${PROJECT_NAME}-rg}"
    local location="${AZURE_LOCATION:-eastus}"
    local registry_name="${AZURE_REGISTRY_NAME:-${PROJECT_NAME}acr}"
    
    # Create resource group if it doesn't exist
    if ! az group show --name "$resource_group" &>/dev/null; then
        az group create --name "$resource_group" --location "$location"
        log_info "Created resource group: $resource_group"
    fi
    
    # Create Azure Container Registry if it doesn't exist
    if ! az acr show --name "$registry_name" --resource-group "$resource_group" &>/dev/null; then
        az acr create \
            --resource-group "$resource_group" \
            --name "$registry_name" \
            --sku Basic \
            --admin-enabled true
        log_info "Created Azure Container Registry: $registry_name"
    fi
    
    # Build and push to ACR
    az acr build \
        --registry "$registry_name" \
        --image "$PROJECT_NAME:latest" \
        --file Dockerfile.enhanced \
        .
    
    # Deploy to Container Instances
    az container create \
        --resource-group "$resource_group" \
        --name "$PROJECT_NAME" \
        --image "${registry_name}.azurecr.io/${PROJECT_NAME}:latest" \
        --registry-login-server "${registry_name}.azurecr.io" \
        --registry-username "$(az acr credential show --name "$registry_name" --query username -o tsv)" \
        --registry-password "$(az acr credential show --name "$registry_name" --query passwords[0].value -o tsv)" \
        --dns-name-label "$PROJECT_NAME" \
        --ports 3000 \
        --memory 1 \
        --cpu 1 \
        --environment-variables \
            NODE_ENV=production \
            DATABASE_URI=file:./data/payload.db \
            PAYLOAD_SECRET="$PAYLOAD_SECRET"
    
    log_success "Deployed to Azure Container Instances"
}

# AWS ECS deployment
deploy_aws() {
    log_step "Deploying to AWS ECS"
    
    local cluster_name="${AWS_CLUSTER_NAME:-${PROJECT_NAME}-cluster}"
    local service_name="${PROJECT_NAME}-service"
    local task_family="${PROJECT_NAME}-task"
    
    # Create ECR repository if it doesn't exist
    if ! aws ecr describe-repositories --repository-names "$PROJECT_NAME" &>/dev/null; then
        aws ecr create-repository --repository-name "$PROJECT_NAME"
        log_info "Created ECR repository: $PROJECT_NAME"
    fi
    
    # Get ECR login token
    aws ecr get-login-password --region "${AWS_REGION:-us-east-1}" | \
        docker login --username AWS --password-stdin \
        "${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION:-us-east-1}.amazonaws.com"
    
    # Build and push to ECR
    local ecr_url="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION:-us-east-1}.amazonaws.com/$PROJECT_NAME:latest"
    docker build -f Dockerfile.enhanced -t "$ecr_url" .
    docker push "$ecr_url"
    
    # Create ECS cluster if it doesn't exist
    if ! aws ecs describe-clusters --clusters "$cluster_name" --query 'clusters[0].status' --output text | grep -q ACTIVE; then
        aws ecs create-cluster --cluster-name "$cluster_name"
        log_info "Created ECS cluster: $cluster_name"
    fi
    
    # Create task definition
    cat > task-definition.json << EOF
{
  "family": "$task_family",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "$PROJECT_NAME",
      "image": "$ecr_url",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "DATABASE_URI", "value": "file:./data/payload.db"},
        {"name": "PAYLOAD_SECRET", "value": "$PAYLOAD_SECRET"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/$PROJECT_NAME",
          "awslogs-region": "${AWS_REGION:-us-east-1}",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
EOF
    
    aws ecs register-task-definition --cli-input-json file://task-definition.json
    
    log_success "Deployed to AWS ECS"
}

# Generic Docker registry deployment
deploy_docker_registry() {
    log_step "Deploying to Docker Registry"
    
    if [[ -z "$REGISTRY_URL" ]]; then
        log_error "REGISTRY_URL environment variable not set"
        exit 1
    fi
    
    local image_tag="$REGISTRY_URL/$PROJECT_NAME:latest"
    
    # Build and push
    docker build -f Dockerfile.enhanced -t "$image_tag" .
    docker push "$image_tag"
    
    log_success "Image pushed to registry: $image_tag"
    log_info "Use this image to deploy on your target platform"
}

# Environment setup for cloud
setup_cloud_environment() {
    local platform="$1"
    
    log_step "Setting up environment for $platform"
    
    # Create cloud-specific environment file
    local cloud_env_file=".env.${platform}"
    
    if [[ ! -f "$cloud_env_file" ]]; then
        cp env.docker.example "$cloud_env_file"
        
        # Platform-specific modifications
        case "$platform" in
            "fly")
                echo "PORT=3000" >> "$cloud_env_file"
                echo "HOSTNAME=0.0.0.0" >> "$cloud_env_file"
                ;;
            "railway")
                echo "RAILWAY_STATIC_URL=\${RAILWAY_STATIC_URL}" >> "$cloud_env_file"
                ;;
            "gcp")
                echo "GOOGLE_CLOUD_PROJECT=\${GCP_PROJECT_ID}" >> "$cloud_env_file"
                ;;
        esac
        
        log_info "Created cloud environment file: $cloud_env_file"
        log_warning "Please edit $cloud_env_file with your configuration"
    fi
}

# Show cloud deployment status
show_cloud_status() {
    local platform="$1"
    
    echo -e "${BOLD}☁️ Cloud Deployment Status - ${platform}${NC}"
    echo ""
    
    case "$platform" in
        "fly")
            if command -v fly &>/dev/null; then
                fly status
            fi
            ;;
        "railway")
            if command -v railway &>/dev/null; then
                railway status
            fi
            ;;
        "gcp")
            if command -v gcloud &>/dev/null; then
                gcloud run services list --filter="metadata.name:$PROJECT_NAME"
            fi
            ;;
        "azure")
            if command -v az &>/dev/null; then
                az container show --resource-group "${AZURE_RESOURCE_GROUP:-${PROJECT_NAME}-rg}" --name "$PROJECT_NAME" --output table
            fi
            ;;
        "aws")
            if command -v aws &>/dev/null; then
                aws ecs describe-services --cluster "${AWS_CLUSTER_NAME:-${PROJECT_NAME}-cluster}" --services "${PROJECT_NAME}-service"
            fi
            ;;
    esac
}

# Help function
show_help() {
    cat << EOF
☁️ Cloud Docker CLI Deployment for OrcaClubPro

Usage: $0 [PLATFORM] [COMMAND]

PLATFORMS:
  fly         Deploy to Fly.io
  railway     Deploy to Railway
  gcp         Deploy to Google Cloud Run
  azure       Deploy to Azure Container Instances
  aws         Deploy to AWS ECS
  registry    Push to Docker registry

COMMANDS:
  deploy      Deploy to specified platform
  status      Show deployment status
  setup       Setup platform-specific environment

EXAMPLES:
  $0 fly deploy           # Deploy to Fly.io
  $0 railway setup        # Setup Railway environment
  $0 gcp status          # Check GCP deployment status
  $0 registry deploy     # Push to Docker registry

ENVIRONMENT VARIABLES:
  REGISTRY_URL           Docker registry URL
  GCP_PROJECT_ID         Google Cloud Project ID
  AWS_ACCOUNT_ID         AWS Account ID
  AWS_REGION             AWS Region (default: us-east-1)
  AZURE_RESOURCE_GROUP   Azure Resource Group
  PAYLOAD_SECRET         Payload CMS secret key

EOF
}

# Main function
main() {
    local platform="${1:-$(detect_platform)}"
    local command="${2:-deploy}"
    
    if [[ "$platform" == "help" ]] || [[ "$platform" == "-h" ]] || [[ "$platform" == "--help" ]]; then
        show_help
        exit 0
    fi
    
    case "$command" in
        "setup")
            setup_cloud_environment "$platform"
            ;;
        "deploy")
            case "$platform" in
                "fly")
                    deploy_flyio
                    ;;
                "railway")
                    deploy_railway
                    ;;
                "gcp")
                    deploy_gcp
                    ;;
                "azure")
                    deploy_azure
                    ;;
                "aws")
                    deploy_aws
                    ;;
                "registry"|"docker")
                    deploy_docker_registry
                    ;;
                *)
                    log_error "Unknown platform: $platform"
                    show_help
                    exit 1
                    ;;
            esac
            ;;
        "status")
            show_cloud_status "$platform"
            ;;
        *)
            log_error "Unknown command: $command"
            show_help
            exit 1
            ;;
    esac
}

# Run main function
main "$@" 