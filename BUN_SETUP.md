# Bun Setup Guide for OrcaClubPro

## Overview

This project now supports Bun as a package manager and runtime! Bun offers significant performance improvements, especially for SQLite operations (3-6x faster than better-sqlite3).

## Installation

### 1. Install Bun
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1 | iex"

# Or via npm
npm install -g bun
```

### 2. Install Dependencies with Bun
```bash
# Remove existing node_modules and lock files
rm -rf node_modules package-lock.json pnpm-lock.yaml

# Install with Bun
bun install
```

## Available Scripts

### Bun Runtime Scripts (Recommended for Performance)
```bash
# Development with Bun runtime (fastest)
bun run bun:dev

# Build with Bun runtime
bun run bun:build

# Start production server with Bun runtime
bun run bun:start

# Lint with Bun runtime
bun run bun:lint
```

### Bun Package Manager + Node Runtime (Safe Mode)
```bash
# Development with Node runtime (more compatible)
bun run bun:dev:safe

# Build with Node runtime
bun run bun:build:safe

# Start with Node runtime
bun run bun:start:safe
```

### Traditional Scripts (Fallback)
```bash
# Original scripts still work
bun run dev
bun run build
bun run start
bun run lint
```

### Payload CMS Scripts
```bash
# Generate TypeScript types
bun run payload:generate

# Run database migrations
bun run payload:migrate

# Create new migration
bun run payload:migrate:create
```

## Performance Benefits

### SQLite Performance
- **Bun's SQLite driver**: 3-6x faster than better-sqlite3
- **Better memory management**: More efficient than Node.js for database operations
- **Native performance**: Direct integration with SQLite

### Package Management
- **Faster installs**: Up to 25x faster than npm
- **Better caching**: More efficient dependency resolution
- **Smaller lockfile**: Binary format is more compact

### Runtime Performance
- **Faster startup**: Quicker cold starts
- **Better memory usage**: More efficient garbage collection
- **Native APIs**: Built-in fetch, WebSocket, etc.

## Compatibility Notes

### What Works Well
- ✅ Package management (excellent)
- ✅ SQLite operations (3-6x performance boost)
- ✅ Next.js development server
- ✅ Next.js build process
- ✅ Payload CMS operations
- ✅ TypeScript compilation

### Potential Issues
- ⚠️ Some Node.js APIs may not be fully compatible
- ⚠️ Certain npm packages might have compatibility issues
- ⚠️ Edge cases in Next.js runtime features

### Fallback Strategy
If you encounter issues with Bun runtime:
1. Use the "safe mode" scripts (`bun:*:safe`)
2. These use Bun as package manager but Node.js as runtime
3. Still get faster installs and dependency management

## Migration from pnpm

### 1. Remove pnpm artifacts
```bash
rm -rf node_modules pnpm-lock.yaml
```

### 2. Install with Bun
```bash
bun install
```

### 3. Update CI/CD (if applicable)
Update your deployment scripts to use Bun:
```yaml
# Example GitHub Actions
- name: Install dependencies
  run: bun install

- name: Build
  run: bun run bun:build
```

## Environment Variables

Your existing environment variables work the same:
```env
DATABASE_URI=file:./payload.db
PAYLOAD_SECRET=your-secret-here
```

## Troubleshooting

### If Bun runtime fails
```bash
# Use safe mode (Bun package manager + Node runtime)
bun run bun:dev:safe
```

### If installation fails
```bash
# Clear Bun cache
bun pm cache rm

# Reinstall
bun install
```

### Check Bun version
```bash
bun --version
```

## Recommended Workflow

1. **Start with Bun runtime**: Try `bun run bun:dev` first
2. **Fall back if needed**: Use `bun run bun:dev:safe` if issues arise
3. **Monitor performance**: You should see faster SQLite operations
4. **Report issues**: If you find compatibility problems, document them

## Performance Monitoring

You can verify the performance improvements:

### SQLite Query Performance
Your Payload CMS operations should be noticeably faster, especially:
- Database queries
- File uploads
- Admin panel interactions

### Development Server
- Faster hot reloads
- Quicker startup times
- More responsive development experience

## Next Steps

1. Try the new scripts: `bun run bun:dev`
2. Monitor for any compatibility issues
3. Enjoy the performance improvements!
4. Consider updating deployment scripts to use Bun

---

**Note**: This setup maintains backward compatibility. All your existing workflows will continue to work while giving you the option to use Bun's performance improvements. 