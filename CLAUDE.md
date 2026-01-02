# ORCACLUB - Claude Development Guide

## Project Overview

**ORCACLUB est 2025** is a **Technical Operations Development Studio** offering tailored development services. We provide businesses with fixed-price project tiers for web development, integrations, and business automation—delivered in 3-21 days with transparent pricing and fast turnaround.

### Business Model: Tailored Services

ORCACLUB operates as a solo technical operator running a **tailored service business**, NOT a traditional agency:

- **Fixed-Price Tiers** - Launch ($1K-3K), Scale ($3K-5K), Enterprise ($6K-30K)
- **Fast Delivery** - 3-5 days (Launch), 7-10 days (Scale), 14-21 days (Enterprise)
- **Transparent Pricing** - No opaque quotes or lengthy sales cycles
- **Self-Service** - Users select packages before consultation
- **MRR Component** - Monthly maintenance packages ($300-$1,200/mo)
- **Effective Rate** - $277-437/hr (through efficiency, not $75/hr contract rate)

### Core Service Offerings

**Project Tiers:**
1. **Launch Tier** ($1,000-3,000, 3-5 days)
   - Headless CMS setup (Payload/Sanity)
   - Infrastructure setup (hosting, SSL, domain)
   - Mobile responsive design
   - SEO configuration
   - Brand-aligned custom design

2. **Scale Tier** ($3,000-5,000, 7-10 days)
   - Everything in Launch
   - 2 custom integrations (Stripe, email, CRM)
   - Advanced analytics setup
   - Form automation
   - Email marketing integration

3. **Enterprise Tier** ($6,000-30,000, 14-21 days)
   - Everything in Scale
   - Shopify headless ecommerce integration
   - Custom API development
   - Advanced workflow automation
   - Database architecture
   - Admin dashboard

**Monthly Maintenance:**
- Essential Care: $300/mo (security, backups, 1hr changes)
- Growth Care: $600/mo (Essential + SEO, analytics, 3hr changes)
- Partner Care: $1,200/mo (Growth + priority support, strategy, 6hr changes)

**Hourly Overflow:** $75/hr for custom work outside packages

### Target Market

- E-commerce brands scaling operations
- Service businesses needing workflow automation
- Traditional businesses going digital
- Startups needing MVP development
- Franchises needing standardized systems

**Positioning:** "Fractional CTO + dev team" for businesses that need technical systems but can't afford full-time tech staff.

---

## 🏗️ Architecture & Structure

### Directory Structure (src/ based)

```
src/
├── app/                          # Next.js App Router (Route Groups)
│   ├── (payload)/               # PayloadCMS Admin Routes
│   │   ├── admin/               # CMS admin interface
│   │   └── layout.tsx          # Payload-specific layout
│   ├── (frontend)/             # Public-facing Routes
│   │   ├── project/            # Main conversion hub ⭐
│   │   ├── solutions/          # TOFU problem-solution pages
│   │   │   ├── headless-shopify-commerce/
│   │   │   ├── fast-website-launch/
│   │   │   ├── stripe-integration/
│   │   │   ├── business-automation/
│   │   │   ├── api-development/
│   │   │   ├── cms-setup/
│   │   │   └── shopify-automation/
│   │   ├── services/           # MOFU service pages
│   │   │   ├── web-development/
│   │   │   ├── integration-automation/
│   │   │   ├── digital-marketing/
│   │   │   └── seo-services/
│   │   ├── contact/            # Contact form with package selection
│   │   ├── portfolio/          # Portfolio showcase
│   │   ├── about/              # About page
│   │   ├── pricing/            # Detailed pricing (legacy, use /project)
│   │   ├── insights/           # Blog/insights
│   │   └── layout.tsx          # Frontend-specific layout
│   ├── (dashboard)/            # Dashboard/Admin Routes (future)
│   ├── api/                    # API routes
│   │   ├── health/             # Health check endpoint
│   │   ├── contact/            # Contact form API
│   │   └── booking/            # Booking API
│   ├── globals.css             # Global styles (Tailwind v4)
│   ├── layout.tsx              # Root application layout
│   └── page.tsx               # Homepage
├── components/                  # Shared UI Components
│   ├── ui/                     # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── card.tsx
│   │   └── ...
│   ├── layout/                 # Layout-specific components
│   │   ├── header.tsx          # Main navigation
│   │   ├── animated-background.tsx
│   │   ├── scroll-reveal.tsx
│   │   └── footer.tsx
│   └── sections/               # Page sections
│       ├── HeroSection.tsx
│       ├── ClientsSection.tsx
│       └── ServicesGrid.tsx
├── lib/                        # Utilities & Business Logic
│   ├── utils.ts               # General utility functions
│   └── payload/               # PayloadCMS configuration
│       ├── payload.config.ts  # CMS configuration
│       └── hooks/             # PayloadCMS hooks
│           └── revalidate.ts  # Cache revalidation
├── hooks/                      # Custom React Hooks
│   └── use-mobile.ts          # Mobile detection
├── types/                      # TypeScript Definitions
│   └── payload-types.ts       # Generated Payload types
└── data/                       # Static data
    └── services.ts            # Service definitions
```

### Route Groups Strategy

- **`(payload)`** - PayloadCMS admin interface
- **`(frontend)`** - Public-facing tailored service funnel
- **`(dashboard)`** - Future client dashboard (reserved)

**Key Benefits:**
- URL structure remains clean (route groups don't affect URLs)
- Each group has its own layout and styling
- Clear separation between admin, public, and dashboard

---

## 🎯 Tailored Service Funnel Architecture

The site is built around a **conversion funnel** that drives users to the `/project` page:

```
TOFU (Problem-Aware)
└─→ /solutions/* pages (7 pages)
    └─→ Target specific technical problems
    └─→ Link to /project with tier anchors

MOFU (Solution-Aware)
└─→ /services/* pages (4 pages)
    └─→ Brief overviews with tier recommendations
    └─→ Link to /project

BOFU (Decision Stage)
└─→ /project ⭐ MAIN CONVERSION HUB
    ├─→ 3 project tier cards
    ├─→ MRR maintenance packages
    ├─→ Hourly work option
    ├─→ How it works, Why ORCACLUB, FAQ
    └─→ Multiple CTAs to /contact

CONVERSION
└─→ /contact
    └─→ Package pre-selection via URL params
    └─→ Booking modal integration
```

### Critical Pages

**`/project` - Main Conversion Hub:**
- Displays all 3 project tiers with pricing and timelines
- Shows MRR maintenance packages
- Includes "How It Works" process
- FAQ section addressing objections
- Multiple CTAs throughout
- Anchor links: `#launch`, `#scale`, `#enterprise`

**`/solutions/*` - TOFU Content:**
- Problem-solution format (not educational)
- Targets technical keywords (e.g., "headless shopify", "stripe integration")
- Links directly to specific tiers on /project
- SEO optimized with structured data

**`/contact` - Conversion:**
- Package selection dropdown (pre-populated via URL params)
- Two modes: Contact Us + Schedule Consultation
- Integration with BookingModal component

---

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

---

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
    "@/types/*": ["./src/types/*"],
    "@/data/*": ["./src/data/*"]
  }
}
```

### Import Best Practices

```typescript
// ✅ Preferred - Use TypeScript path aliases
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMobile } from '@/hooks/use-mobile'

// ✅ Component-specific imports
import { Header } from '@/components/layout/header'
import AnimatedBackground from '@/components/layout/animated-background'

// ✅ PayloadCMS specific
import type { User } from '@/types/payload-types'
import { payloadConfig } from '@payload-config'

// ❌ Avoid relative imports across directories
import Button from '../../../components/ui/button'
```

---

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

- **Brand Colors**: Intelligence cyan (#67e8f9), blue variants
- **Background**: Black (bg-black) with subtle gradients
- **Text**: White, gray-400, gray-300 for hierarchy
- **Accents**: Cyan for CTAs and emphasis
- **Dark Mode**: Default (no light mode needed)

---

## 🎨 Brand Guidelines

### ORCACLUB Brand Identity

**Established:** 2025
**Positioning:** Technical Operations Development Studio
**Business Model:** Tailored Services (NOT traditional agency)
**Tagline:** "est 2025" - Emphasizes modern approach and fresh thinking

### ORCACLUB Logo Styling

The ORCACLUB brand name should always be presented with consistent styling:

**Typography Pattern:**

```tsx
// ✅ Correct - Use this pattern everywhere
<span className="text-xl md:text-2xl font-bold text-white">ORCA</span>
<span className="text-xl md:text-2xl font-bold gradient-text">CLUB</span>

// With "est 2025" tagline (for hero sections, marketing materials)
<div className="flex items-center gap-2">
  <span className="text-xl md:text-2xl font-bold text-white">ORCA</span>
  <span className="text-xl md:text-2xl font-bold gradient-text">CLUB</span>
  <span className="text-xs md:text-sm text-gray-400 font-light ml-2">est 2025</span>
</div>
```

**Styling Rules:**

1. **"ORCA"** - Always `text-white` with `font-bold`
2. **"CLUB"** - Always uses `gradient-text` class
3. **NO spacing** - The two words appear together with no gap
4. **"est 2025" tagline** - Use `text-gray-400` with `font-light`
5. **Responsive sizing** - `text-xl md:text-2xl` for headers
6. **Consistent font weight** - Always `font-bold` for both parts

**The `gradient-text` Class:**

Defined in `src/app/globals.css`:

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

Creates an animated gradient effect shifting between cyan and blue shades.

**Where to Apply:**

- Header navigation (desktop and mobile)
- Page titles and hero sections
- Prominent brand mentions
- Marketing CTAs
- Footer branding

**When to Include "est 2025":**

- Page metadata (e.g., "ORCACLUB est 2025 | Technical Operations Studio")
- Hero sections and landing pages
- About page and marketing materials
- **NOT in navigation headers** (keeps header clean)

**Example Implementations:**

- `src/components/layout/header.tsx` - Navigation header
- `src/components/sections/HeroSection.tsx` - Homepage hero
- `src/app/(frontend)/page.tsx` - Homepage metadata

### Brand Messaging & Voice

**Brand Essence:**

ORCACLUB (est 2025) is a Technical Operations Development Studio offering tailored development services. We deliver fixed-price projects in 3-21 days with transparent pricing—web development, integrations, and automation for businesses that need technical expertise but can't afford full-time staff.

**Core Value Proposition:**

- **Speed** - 3-21 day delivery vs months with traditional agencies
- **Transparency** - Fixed pricing, no opaque quotes or scope creep
- **Efficiency** - Direct developer access, no overhead
- **Expertise** - Modern tech stack (React, Next.js, Payload, Shopify)
- **Tailored** - Custom solutions adapted to each client's needs
- **Partnership** - Ongoing support via maintenance packages

**Key Messaging Pillars:**

1. **Fixed Pricing** - "Choose your tier, know your cost upfront"
2. **Fast Delivery** - "Launch in 3-21 days, not months"
3. **Technical Expertise** - "Modern stack, best practices, clean code"
4. **Solo Operator Advantage** - "Direct access to your developer, no middlemen"
5. **Tailored Solutions** - "Custom solutions adapted to your specific needs"

**Tone of Voice:**

- Professional yet efficient
- Technical but accessible
- Confident without overselling
- Clear and direct communication
- Speed and transparency focused

**Avoid:**

- Agency jargon ("discovery sessions", "ideation workshops")
- Generic marketing speak
- Over-promising timelines or features
- Underselling capabilities (you're an expert, not cheap)
- Hiding pricing or being vague about scope

**Messaging Examples:**

✅ "Launch in 3-5 days with transparent pricing"
✅ "Fixed-price tiers, no surprises"
✅ "Direct developer access, efficient execution"
✅ "Modern tech stack for fast, scalable solutions"

❌ "We'll transform your business" (vague)
❌ "Enterprise-level solutions" (agency speak)
❌ "Unlimited revisions" (unsustainable)

---

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

---

## 🧩 Component Guidelines

### Shared Components

**Core Layout Components:**

- `<AnimatedBackground />` - Used on every page for consistent background effect
- `<ScrollReveal>` - Wraps sections for scroll-based animations
- `<Header />` - Navigation with ORCACLUB branding and "View Packages" CTA
- `<Footer />` - Site footer with links and branding

**Reusable UI Components:**

- `@/components/ui/*` - shadcn/ui components (Button, Input, Card, etc.)
- `<BookingModal />` - Consultation booking modal (used on /project)

### Component Pattern: Page Structure

Every frontend page should follow this pattern:

```tsx
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Page Title | ORCACLUB",
  description: "Page description with keywords",
}

export default function Page() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
              Page <span className="gradient-text font-light">Headline</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light">
              Supporting copy
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            {/* Content */}
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
```

### Typography Hierarchy

- **H1**: `text-5xl md:text-7xl font-extralight` - Page titles
- **H2**: `text-4xl md:text-5xl font-extralight` - Section titles
- **H3**: `text-2xl md:text-3xl font-light` - Subsection titles
- **Body**: `text-xl text-gray-400 font-light` - Paragraph text
- **Small**: `text-sm text-gray-500 font-light` - Supporting text

### CTA Button Patterns

**Primary CTA (to /project):**

```tsx
<Link
  href="/project"
  className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500"
>
  View Project Tiers
</Link>
```

**Secondary CTA:**

```tsx
<Link
  href="/portfolio"
  className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
>
  View Our Work
</Link>
```

---

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
import type { User, Client } from '@/types/payload-types'

// Config import
import { payloadConfig } from '@payload-config'
```

### Cache Revalidation & Hooks

We use PayloadCMS hooks to automatically refresh Next.js cached pages when CMS content changes.

**Location:** `src/lib/payload/hooks/revalidate.ts`

#### How It Works

1. PayloadCMS triggers an `afterChange` hook
2. Hook calls Next.js `revalidatePath()` to invalidate cached pages
3. Next request fetches fresh data from database
4. Frontend automatically reflects CMS changes

#### Implementation Pattern

```typescript
import { revalidateHomepage, revalidateHomepageOnDelete } from './hooks/revalidate'

const MyCollection: CollectionConfig = {
  slug: 'my-collection',
  hooks: {
    afterChange: [revalidateHomepage],
    afterDelete: [revalidateHomepageOnDelete],
  },
}
```

#### Active Collections

- **Clients** → Revalidates `/` (homepage)
- **Services** → Revalidates `/` (homepage)

---

## 📱 Mobile & Responsive Design

### Breakpoint Strategy

```typescript
// Use Tailwind responsive prefixes
className="text-base md:text-lg lg:text-xl"

// Custom hook for mobile detection
import { useMobile } from '@/hooks/use-mobile'
const isMobile = useMobile()
```

**Mobile-First Approach:**

- Design for mobile first, then enhance for desktop
- Use Tailwind's responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`
- Test all pages on mobile devices
- Ensure touch-friendly button sizes (minimum 44x44px)

---

## 🚦 Best Practices

### File Naming Conventions

- **Components**: PascalCase (`Button.tsx`, `HeroSection.tsx`)
- **Files/Folders**: kebab-case (`use-mobile.ts`, `api-client.ts`)
- **Route Groups**: lowercase with parentheses (`(frontend)`, `(payload)`)
- **Pages**: `page.tsx` (Next.js App Router convention)

### Import Organization

```typescript
// 1. React and Next.js imports
import React from 'react'
import Link from 'next/link'
import type { Metadata } from 'next'

// 2. External libraries
import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

// 3. Internal imports (using aliases)
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import AnimatedBackground from '@/components/layout/animated-background'

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
}

export function Component({ children, className, variant = 'default', size = 'md' }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  )
}
```

---

## 🎯 SEO & Conversion Best Practices

### Metadata Pattern

Every page should have proper metadata:

```tsx
export const metadata: Metadata = {
  title: "Page Title - Keyword Rich | ORCACLUB",
  description: "Concise description under 160 characters with target keywords and CTA.",
  keywords: ["keyword 1", "keyword 2", "keyword 3"],
  openGraph: {
    title: "Page Title | ORCACLUB",
    description: "Description for social sharing",
    url: "https://orcaclub.pro/page-path",
    type: "website",
  },
}
```

### Internal Linking Strategy

**All paths lead to /project:**

- Solution pages link to `/project#{tier}` (e.g., `/project#enterprise`)
- Service pages link to `/project` with tier recommendations
- Homepage CTAs link to `/project`
- Navigation has prominent "View Packages" button → `/project`

### URL Parameter Strategy

Pre-populate contact form with package selection:

```tsx
// From /project page
<Link href="/contact?package=launch">Select Launch Tier</Link>

// Contact form auto-selects package
useEffect(() => {
  const params = new URLSearchParams(window.location.search)
  const pkg = params.get('package')
  if (pkg) setFormData(prev => ({ ...prev, package: pkg }))
}, [])
```

---

## 🐛 Debugging & Development

### Common Issues

1. **Import Path Errors**: Use TypeScript aliases (`@/components`) instead of relative paths
2. **Route Group Confusion**: Remember they don't affect URLs (`(frontend)/project` → `/project`)
3. **Tailwind Not Working**: Check v4 syntax with `@theme` directive
4. **PayloadCMS Types**: Run `bun run payload:generate` after schema changes

### Development Server

- Access app: `http://localhost:3000`
- PayloadCMS admin: `http://localhost:3000/admin`
- API health: `http://localhost:3000/api/health`

### Testing the Funnel

**Test these paths:**

1. Homepage → "View Project Tiers" → `/project`
2. `/solutions/fast-website-launch` → "Select Launch Tier" → `/project#launch`
3. `/services/web-development` → "View Project Tiers" → `/project`
4. `/project` → "Select Scale" → `/contact?package=scale`

---

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

## 📊 Business Context for Development

### Conversion Funnel Priorities

When building new features, always consider the funnel:

1. **BOFU (Highest Priority)**: `/project` page optimizations
2. **MOFU**: Service page improvements, tier recommendations
3. **TOFU**: New solution pages for keywords, SEO content
4. **Supporting**: Contact form, booking flow, analytics

### Key Metrics to Support

Ensure all development supports tracking these metrics:

- Solution page → /project click-through rate
- /project → Package selection rate
- Contact form with package → Submission rate
- Consultation → Client conversion rate
- MRR package attachment rate

### Feature Additions

Before adding new features, ask:

1. Does this support the tailored service model?
2. Does this funnel users to /project?
3. Does this reduce friction in package selection?
4. Does this increase transparency or speed?
5. Can this scale without manual intervention?

---

This project follows modern React/Next.js patterns with a focus on **tailored service delivery**, **conversion optimization**, and **solo operator efficiency**. The structure is designed to scale the business through clear package offerings, fast delivery, and transparent pricing—not through team expansion or custom agency work.
