# orcaclubpro
sick site bro

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app) and enhanced with [Payload CMS](https://payloadcms.com) and [Bun](https://bun.sh) for optimal performance.

## Tech Stack

- **Frontend**: Next.js 15 with App Router
- **Backend**: Payload CMS 3.0+
- **Database**: SQLite with Drizzle ORM
- **Styling**: Tailwind CSS
- **Package Manager**: Bun (with pnpm fallback)
- **Runtime**: Bun (with Node.js fallback)

## Getting Started

### Quick Start (Recommended)
```bash
# Install Bun if you haven't already
curl -fsSL https://bun.sh/install | bash

# Install dependencies
bun install

# Run development server with Bun runtime (fastest)
bun run bun:dev
```

### Alternative Methods
```bash
# Development with Node runtime (more compatible)
bun run bun:dev:safe

# Traditional methods still work
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Payload CMS Admin
Access the admin panel at [http://localhost:3000/admin](http://localhost:3000/admin)

## Available Scripts

### Bun Scripts (Recommended)
- `bun run bun:dev` - Development with Bun runtime (fastest)
- `bun run bun:build` - Build with Bun runtime
- `bun run bun:start` - Production server with Bun runtime
- `bun run bun:lint` - Lint with Bun runtime

### Safe Mode Scripts (Bun package manager + Node runtime)
- `bun run bun:dev:safe` - Development with Node runtime
- `bun run bun:build:safe` - Build with Node runtime
- `bun run bun:start:safe` - Production server with Node runtime

### Payload CMS Scripts
- `bun run payload:generate` - Generate TypeScript types
- `bun run payload:migrate` - Run database migrations
- `bun run payload:migrate:create` - Create new migration

## Performance Benefits

### Why Bun?
- **3-6x faster SQLite operations** compared to better-sqlite3
- **Up to 25x faster package installs** compared to npm
- **Faster development server** startup and hot reloads
- **Better memory efficiency** for database operations

### Benchmarks
Your Payload CMS operations will be significantly faster:
- Database queries
- File uploads
- Admin panel interactions
- Development hot reloads

## Setup Guide

For detailed Bun setup instructions, see [BUN_SETUP.md](./BUN_SETUP.md)

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about the technologies used:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Payload CMS Documentation](https://payloadcms.com/docs) - learn about Payload CMS features.
- [Bun Documentation](https://bun.sh/docs) - learn about Bun runtime and package manager.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

For Bun deployment on Vercel, update your build commands:
```json
{
  "buildCommand": "bun run bun:build",
  "installCommand": "bun install"
}
```

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
