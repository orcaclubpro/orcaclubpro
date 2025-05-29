# 🏗️ Build System Overview

## Quick Start

```bash
# Development
bun run dev                    # Standard dev server
bun run bun:dev               # With bun runtime

# Production Build
bun run build:prod            # Comprehensive production build
bun run bun:build:production  # With bun runtime optimization

# Testing Build Script
bun run scripts/build.js --help  # Show options
```

## Build Scripts Created

### 1. Enhanced package.json Scripts
- **`build:comprehensive`**: Runs the full build script with validation
- **`build:prod`**: Production build with optimizations
- **`clean`**: Removes build artifacts
- **`deploy:build`**: Full clean + production build

### 2. Comprehensive Build Script (`scripts/build.js`)
Features:
- ✅ Environment validation
- ✅ Dependency checks  
- ✅ Payload type generation
- ✅ Database migrations
- ✅ Next.js build optimization
- ✅ Production optimizations
- ✅ Detailed logging and error handling
- ✅ Build time tracking

### 3. Docker Configuration (`Dockerfile.bun`)
- Multi-stage build for optimization
- Bun runtime for performance
- Standalone Next.js output
- Security best practices

### 4. Enhanced Next.js Config (`next.config.mjs`)
- Standalone output for Docker
- Package import optimizations
- Bun runtime compatibility
- Performance optimizations

## Environment Variables

```env
# Build Configuration
NODE_ENV=production           # Enable production optimizations
SKIP_MIGRATIONS=true         # Skip database migrations
USE_BUN_RUNTIME=true         # Use bun runtime (default: true)
VERBOSE=true                 # Detailed error logging

# Runtime Configuration
NEXT_TELEMETRY_DISABLED=1    # Disable Next.js telemetry
DATABASE_URI=file:./payload.db  # Database connection
PAYLOAD_SECRET=your-secret   # Payload authentication
```

## Performance Benefits

### Bun Runtime Advantages:
- **SQLite**: 3-6x faster than better-sqlite3
- **Package Management**: Up to 25x faster than npm
- **Build Speed**: Faster transpilation and bundling
- **Memory Usage**: More efficient garbage collection

### Build Optimizations:
- Standalone output reduces deployment size
- Package import optimizations
- Console log removal in production
- Image format optimization (AVIF/WebP)

## Available Build Commands

| Command | Purpose | Use Case |
|---------|---------|----------|
| `bun run build` | Standard build | Most deployments |
| `bun run build:prod` | Production build | Production deployments |
| `bun run build:comprehensive` | Full validation build | CI/CD pipelines |
| `bun run bun:build:production` | Bun runtime build | Performance-critical deployments |
| `bun run clean` | Clean artifacts | Before fresh builds |
| `bun run deploy:build` | Full deployment build | Production releases |

## Deployment Quick Reference

### Docker:
```bash
docker build -f Dockerfile.bun -t orcaclubpro .
docker run -p 3000:3000 orcaclubpro
```

### VPS:
```bash
bun install
bun run build:prod
bun run start
```

### Vercel/Railway:
- Build Command: `bun run build:production`
- Start Command: `bun run start`

## Troubleshooting

### Build Failures:
```bash
VERBOSE=true bun run build:prod
```

### Runtime Issues:
```bash
USE_BUN_RUNTIME=false bun run start
```

### Clean Rebuild:
```bash
bun run clean && bun run build
```

For detailed deployment instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md). 