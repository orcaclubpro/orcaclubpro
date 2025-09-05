# OrcaClubPro - Claude Development Guide

## Project Overview

OrcaClubPro is a modern web application built with cutting-edge technologies, optimized for performance and developer experience. This is a professional SaaS platform with integrated CMS capabilities, featuring a clean, modern interface and robust backend infrastructure.

## 🏗️ Architecture & Structure

### Directory Structure (src/ based)
```
src/
├── app/                          # Next.js App Router (Route Groups)
│   ├── (payload)/               # PayloadCMS Admin Routes
│   │   ├── admin/               # CMS admin interface
│   │   └── layout.tsx          # Payload-specific layout
│   ├── (frontend)/             # Public-facing Routes
│   │   ├── about/              # About page
│   │   ├── contact/            # Contact page
│   │   ├── services/           # Services overview
│   │   ├── portfolio/          # Portfolio showcase
│   │   ├── insights/           # Blog/insights
│   │   └── layout.tsx          # Frontend-specific layout
│   ├── (dashboard)/            # Dashboard/Admin Routes
│   │   ├── analytics/          # Analytics dashboard
│   │   ├── user/[userId]/      # Dynamic user routes
│   │   ├── components/         # Dashboard-specific components
│   │   └── layout.tsx          # Dashboard-specific layout
│   ├── api/                    # API routes
│   │   └── health/             # Health check endpoint
│   ├── globals.css             # Global styles (Tailwind v4)
│   ├── layout.tsx              # Root application layout
│   └── page.tsx               # Homepage
├── components/                  # Shared UI Components
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx          # Button component
│   │   ├── input.tsx           # Input component
│   │   ├── card.tsx            # Card component
│   │   ├── avatar.tsx          # Avatar component
│   │   └── ...                 # Other UI primitives
│   └── layout/                 # Layout-specific components
│       ├── navigation.tsx      # Main navigation
│       ├── floating-navigation.tsx  # Floating nav
│       ├── animated-background.tsx  # Background effects
│       ├── scroll-reveal.tsx   # Scroll animations
│       └── dynamic-greeting.tsx # Dynamic greetings
├── lib/                        # Utilities & Business Logic
│   ├── utils.ts               # General utility functions
│   └── payload/               # PayloadCMS configuration
│       └── payload.config.ts  # CMS configuration
├── hooks/                      # Custom React Hooks
│   └── use-mobile.ts          # Mobile detection hook
├── types/                      # TypeScript Definitions
│   └── payload-types.ts       # Generated Payload types
└── styles/                     # Additional Styles
    └── (reserved for future use)
```

### Route Groups Strategy
We use Next.js route groups to organize the application into logical sections:

- **`(payload)`** - PayloadCMS admin interface and related routes
- **`(frontend)`** - Public-facing marketing and content pages
- **`(dashboard)`** - Authenticated dashboard and user management

**Key Benefits:**
- URL structure remains clean (route groups don't affect URLs)
- Each group can have its own layout and styling
- Clear separation of concerns between admin, public, and dashboard areas

## 🛠️ Technology Stack

### Core Framework
- **Next.js 15.3.1** - React framework with App Router
- **React 19** - UI library with latest features
- **TypeScript 5** - Type safety and developer experience

### Runtime & Package Management
- **Bun 1.2.15** - Ultra-fast JavaScript runtime and package manager
- **Node.js** - Fallback runtime (configured for compatibility)

### Styling & UI
- **Tailwind CSS 4.1.8** - Utility-first CSS framework (v4 with @theme directive)
- **shadcn/ui** - High-quality component library built on Radix UI
- **Radix UI** - Unstyled, accessible UI primitives
- **Framer Motion 12** - Animation library
- **Lucide React** - Icon library

### Backend & Database
- **PayloadCMS 3.38.0** - Headless CMS
- **SQLite** - Database with Drizzle ORM
- **GraphQL** - API layer

### Development Tools
- **Turbopack** - Fast bundler for development
- **ESLint 9** - Linting
- **PostCSS** - CSS processing

## 📝 TypeScript Configuration

### Path Aliases
```json
{
  "paths": {
    "@payload-config": ["./src/lib/payload/payload.config.ts"],
    "@/*": ["./src/*"],
    "@/components/*": ["./src/components/*"],
    "@/lib/*": ["./src/lib/*"],
    "@/app/*": ["./src/app/*"],
    "@/ui/*": ["./src/components/ui/*"],
    "@/hooks/*": ["./src/hooks/*"],
    "@/types/*": ["./src/types/*"]
  }
}
```

### Import Best Practices
```typescript
// ✅ Preferred - Use TypeScript path aliases
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

// ✅ Component-specific imports
import { Navigation } from '@/components/layout/navigation'
import { DashboardLayout } from '@/app/(dashboard)/components/layout'

// ✅ PayloadCMS specific
import type { User } from '@/types/payload-types'
import { payloadConfig } from '@payload-config'

// ❌ Avoid relative imports across directories
import Button from '../../../components/ui/button'
```

## 🎨 Styling Philosophy

### Tailwind CSS v4 Approach
We use Tailwind CSS v4 with the new `@theme` directive for design tokens:

```css
/* globals.css */
@import "tailwindcss";
@plugin "tailwindcss-animate";

@theme {
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --color-primary: 222.2 47.4% 11.2%;
  --color-intelligence-cyan: #67e8f9;
  --radius: 0.5rem;
}
```

### Component Styling Standards
1. **Use shadcn/ui components** as base building blocks
2. **Extend with custom classes** when needed
3. **Follow design system tokens** defined in globals.css
4. **Use CSS variables** for dynamic theming
5. **Prefer Tailwind utilities** over custom CSS

### Color System
- **Brand Colors**: Intelligence cyan, blue variants
- **Status Colors**: Success, caution, alert
- **shadcn/ui System**: Primary, secondary, muted, accent
- **Dark Mode**: Automatic with Tailwind's dark: prefix

## 🚀 Development Workflow

### Available Commands

**Development (Recommended):**
```bash
bun run bun:dev          # Fastest - Bun runtime + Turbopack
bun run dev              # Standard - Node runtime + Turbopack
```

**Building:**
```bash
bun run bun:build        # Build with Bun runtime
bun run build            # Standard build
bun run build:production # Production optimized build
```

**PayloadCMS:**
```bash
bun run payload:generate   # Generate TypeScript types
bun run payload:migrate    # Run database migrations
```

**Linting:**
```bash
bun run bun:lint        # Lint with Bun runtime
bun run lint            # Standard linting
```

### Performance Optimizations

**Bun Benefits:**
- 3-6x faster SQLite operations
- 25x faster package installs
- Faster development server startup
- Better memory efficiency

**Next.js Optimizations:**
- Turbopack for faster builds
- App Router for better performance
- Route groups for code organization
- Image optimization with `next/image`

## 🧩 Component Guidelines

### UI Component Structure
```typescript
// src/components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)
```

### Layout Component Pattern
```typescript
// src/components/layout/navigation.tsx
import { cn } from '@/lib/utils'

interface NavigationProps {
  className?: string
  variant?: 'default' | 'floating'
}

export function Navigation({ className, variant = 'default' }: NavigationProps) {
  return (
    <nav className={cn(
      "navigation-base-styles",
      variant === 'floating' && "floating-specific-styles",
      className
    )}>
      {/* Navigation content */}
    </nav>
  )
}
```

## 🔧 PayloadCMS Integration

### Configuration
PayloadCMS is configured in `src/lib/payload/payload.config.ts` with:
- SQLite database integration
- TypeScript type generation
- Admin panel at `/admin`
- GraphQL API endpoints

### Type Safety
```typescript
// Generated types available at
import type { User, Post } from '@/types/payload-types'

// Config import
import { payloadConfig } from '@payload-config'
```

## 📱 Mobile & Responsive Design

### Breakpoint Strategy
```typescript
// Use Tailwind responsive prefixes
className="text-base md:text-lg lg:text-xl"

// Custom hook for mobile detection
import { useMobile } from '@/hooks/use-mobile'
const isMobile = useMobile()
```

## 🚦 Best Practices

### File Naming Conventions
- **Components**: PascalCase (`Button.tsx`, `NavigationMenu.tsx`)
- **Files/Folders**: kebab-case (`use-mobile.ts`, `api-client.ts`)
- **Route Groups**: lowercase with parentheses (`(dashboard)`, `(payload)`)

### Import Organization
```typescript
// 1. React and Next.js imports
import React from 'react'
import Link from 'next/link'

// 2. External libraries
import { motion } from 'framer-motion'
import { cn } from 'class-variance-authority'

// 3. Internal imports (using aliases)
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'

// 4. Relative imports (only for same directory)
import './component.css'
```

### Component Props Pattern
```typescript
interface ComponentProps {
  children?: React.ReactNode
  className?: string
  variant?: 'default' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  // Add other props with clear types
}
```

## 🐛 Debugging & Development

### Common Issues
1. **Import Path Errors**: Use TypeScript aliases instead of relative paths
2. **Route Group Confusion**: Remember they don't affect URLs
3. **Tailwind Not Working**: Check v4 syntax with @theme directive
4. **PayloadCMS Types**: Run `bun run payload:generate` after schema changes

### Development Server
- Access app: `http://localhost:3000`
- PayloadCMS admin: `http://localhost:3000/admin`
- API health: `http://localhost:3000/api/health`

## 📦 Deployment

### Vercel Deployment
```json
{
  "buildCommand": "bun run bun:build",
  "installCommand": "bun install"
}
```

### Environment Variables
Configure in `.env.local`:
```bash
DATABASE_URI=sqlite:./payload.db
PAYLOAD_SECRET=your-secret-key
NEXT_PUBLIC_SERVER_URL=http://localhost:3000
```

---

This project follows modern React/Next.js patterns with a focus on performance, type safety, and developer experience. The structure is designed to scale while maintaining clear separation of concerns and excellent maintainability.