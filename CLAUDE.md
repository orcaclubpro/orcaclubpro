# ORCACLUB - Claude Development Guide

## Project Overview

**ORCACLUB est 2025** is a full-service branding, marketing, and consulting agency. We help businesses build powerful brands, execute strategic marketing campaigns, and navigate complex business challenges with expert consulting services. Built with cutting-edge technologies and optimized for performance, ORCACLUB provides a professional web application with integrated CMS capabilities, featuring a clean, modern interface designed to support branding initiatives, marketing operations, and client service delivery.

### Core Services
- **Branding** - Brand strategy, identity design, and positioning
- **Marketing** - Strategic campaigns, digital marketing, and growth initiatives
- **Consulting** - Business consulting, strategic planning, and expert guidance

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
│       ├── payload.config.ts  # CMS configuration
│       └── hooks/             # PayloadCMS hooks
│           └── revalidate.ts  # Cache revalidation hooks
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

## 🎨 Brand Guidelines

### ORCACLUB Brand Identity

**Established:** 2025
**Positioning:** Full-service branding, marketing, and consulting agency
**Tagline:** "est 2025" - Emphasizes fresh perspective and modern approach

### ORCACLUB Logo Styling
The ORCACLUB brand name should always be presented with consistent styling across the application:

**Typography Pattern:**
```tsx
// ✅ Correct - Use this pattern everywhere
<span className="text-xl md:text-2xl font-bold text-white">ORCA</span>
<span className="text-xl md:text-2xl font-bold gradient-text">CLUB</span>

// With "est 2025" tagline (for headers, hero sections, marketing materials)
<div className="flex items-center gap-2">
  <span className="text-xl md:text-2xl font-bold text-white">ORCA</span>
  <span className="text-xl md:text-2xl font-bold gradient-text">CLUB</span>
  <span className="text-xs md:text-sm text-gray-400 font-light ml-2">est 2025</span>
</div>

// Desktop header example
<button className="flex items-center focus:outline-none focus:ring-2 focus:ring-white/20 rounded-md px-2 py-1 group">
  <span className="text-xl md:text-2xl font-bold text-white">ORCA</span>
  <span className="text-xl md:text-2xl font-bold gradient-text">CLUB</span>
  <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 ml-1" />
</button>

// Mobile menu example
<div className="px-3 mb-3">
  <span className="text-sm font-bold text-white">ORCA</span>
  <span className="text-sm font-bold gradient-text">CLUB</span>
</div>
```

**Styling Rules:**
1. **"ORCA"** - Always `text-white` with `font-bold`
2. **"CLUB"** - Always uses `gradient-text` class (defined in globals.css)
3. **NO spacing** - The two words should appear together with no gap
4. **"est 2025" tagline** - Use `text-gray-400` with `font-light`, smaller size than main logo
5. **Responsive sizing** - Use `text-xl md:text-2xl` for headers, smaller sizes for mobile menus
6. **Consistent font weight** - Always `font-bold` for both parts of main logo

**The `gradient-text` Class:**
Defined in `src/app/globals.css` (lines 267-274):
```css
.gradient-text {
  background: linear-gradient(45deg, #67e8f9, #3b82f6, #1e40af, #67e8f9);
  background-size: 300% 300%;
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: gradientShift 4s ease-in-out infinite;
}
```

This creates an **animated gradient effect** that shifts between:
- `#67e8f9` - Intelligence cyan (primary brand color)
- `#3b82f6` - Intelligence blue
- `#1e40af` - Intelligence blue deep

The animation runs continuously, creating a dynamic, premium look that reinforces the brand's modern, professional identity.

**Where to Apply:**
- Header navigation (desktop and mobile)
- Page titles and hero sections
- Any prominent brand mention
- Marketing materials and CTAs
- Footer branding

**When to Include "est 2025":**
- Page titles and metadata (e.g., "ORCACLUB est 2025 | Branding, Marketing, and Consulting")
- Hero sections and main landing pages
- Marketing materials and promotional content
- About page and company history sections
- **NOT in navigation headers** (keeps header clean and scannable)

**Example Implementations:**
- `src/components/layout/header.tsx` - Navigation header
- `src/components/layout/dynamic-greeting.tsx` - Homepage hero
- `src/app/(frontend)/page.tsx` - Homepage metadata with "est 2025"
- `src/app/layout.tsx` - Root layout metadata

### Brand Messaging & Voice

**Brand Essence:**
ORCACLUB (est 2025) is a full-service branding, marketing, and consulting agency that helps businesses build powerful brands, execute strategic marketing campaigns, and navigate complex business challenges.

**Core Value Proposition:**
- **Branding** - Strategic brand development, identity design, and positioning
- **Marketing** - Data-driven campaigns, digital marketing, and growth strategies
- **Consulting** - Expert business guidance, strategic planning, and problem-solving

**Key Messaging Pillars:**
1. **Fresh Perspective** - Established in 2025, bringing modern thinking to traditional challenges
2. **Full-Service Excellence** - Comprehensive solutions across branding, marketing, and consulting
3. **Strategic Partnership** - Not just vendors, but true business partners invested in client success
4. **Measurable Results** - Focus on tangible outcomes and business growth

**Tone of Voice:**
- Professional yet approachable
- Strategic and insightful
- Confident without being arrogant
- Clear and jargon-free communication
- Modern and forward-thinking

**Avoid:**
- Overly technical jargon (unless in technical contexts)
- Generic marketing speak
- Unsubstantiated claims
- Over-promising
- Outdated business terminology

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

### Cache Revalidation & Hooks

We use PayloadCMS hooks to automatically refresh Next.js cached pages when CMS content changes. This ensures the frontend stays in sync with backend updates without manual intervention.

**Location:** `src/lib/payload/hooks/revalidate.ts`

#### How It Works
When you update a client or service in the PayloadCMS admin panel:
1. PayloadCMS triggers an `afterChange` hook
2. The hook calls Next.js `revalidatePath()` to invalidate cached pages
3. Next request to those pages fetches fresh data from the database
4. Frontend automatically reflects CMS changes

#### Implementation Pattern
```typescript
// Basic usage in collections
import { revalidateHomepage, revalidateHomepageOnDelete } from './hooks/revalidate'

const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  hooks: {
    afterChange: [revalidateHomepage],
    afterDelete: [revalidateHomepageOnDelete],
  },
  // ... rest of config
}
```

#### Multi-Path Revalidation
For content appearing on multiple pages:
```typescript
import { createMultiPathRevalidate, createMultiPathRevalidateOnDelete } from './hooks/revalidate'

const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  hooks: {
    afterChange: [createMultiPathRevalidate(['/', '/services', '/portfolio'])],
    afterDelete: [createMultiPathRevalidateOnDelete(['/', '/services', '/portfolio'])],
  },
}
```

#### Active Collections
Current collections with auto-revalidation:
- **Clients** → Revalidates `/` (homepage)
- **Services** → Revalidates `/` (homepage)

#### Preventing Infinite Loops
The hooks respect a `disableRevalidate` context flag to prevent infinite loops when updating documents within other hooks:
```typescript
await req.payload.update({
  collection: 'my-collection',
  id: doc.id,
  data: { /* ... */ },
  context: {
    disableRevalidate: true, // Prevents revalidation hook from running
  },
})
```

#### Monitoring
All revalidation events are logged with the `[Revalidation]` prefix:
```
[Revalidation] Homepage revalidated due to change in document: 67abc123
```

#### Best Practices
1. **Use path-based revalidation** for simplicity (default approach)
2. **Use multi-path hooks** when content appears on multiple pages
3. **Always set `disableRevalidate: true`** when updating docs inside hooks
4. **Monitor logs** to verify revalidation triggers correctly

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