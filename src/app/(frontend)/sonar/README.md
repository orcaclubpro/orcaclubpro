# Sonar - ORCACLUB Blog

A simple, modern, minimalistic blog interface for ORCACLUB.

## Structure

```
sonar/
├── page.tsx                      # Blog listing page (main index)
├── [slug]/
│   └── page.tsx                  # Individual blog post page
└── category/
    └── [slug]/
        └── page.tsx              # Category-filtered blog posts
```

## Pages

### 1. Blog Listing (`/sonar`)
- **File**: `page.tsx`
- **Features**:
  - Featured blog post with prominent display
  - Grid of regular blog posts (2-3 columns responsive)
  - Category filter navigation
  - Clean, minimalistic card design
  - Author avatars, dates, read time, and categories

### 2. Individual Blog Post (`/sonar/[slug]`)
- **File**: `[slug]/page.tsx`
- **Features**:
  - Full blog post with rich content
  - Author bio and information
  - Tags display
  - Formatted with prose classes for typography
  - Back navigation to blog listing
  - Related content CTA

### 3. Category Page (`/sonar/category/[slug]`)
- **File**: `category/[slug]/page.tsx`
- **Features**:
  - Filtered posts by category
  - Category header with description
  - Same card layout as main listing
  - Post count display
  - Back navigation

## Design System

### Colors
- **Background**: Black (`bg-black`)
- **Text**: White/Gray hierarchy (`text-white`, `text-gray-400`, `text-gray-500`)
- **Accent**: Intelligence cyan (`text-cyan-400`, `border-cyan-400/30`)
- **Cards**: Dark with subtle borders (`bg-gray-950/50`, `border-gray-800`)

### Typography
- **Headings**: Font-light/extralight with tight tracking
- **Body**: Font-light with relaxed leading
- **Hierarchy**: Clear size scaling (text-xl → text-4xl → text-6xl)

### Components Used
- `Card`, `CardHeader`, `CardContent`, `CardFooter` from `@/components/ui/card`
- `Badge` from `@/components/ui/badge`
- `Separator` from `@/components/ui/separator`
- `ScrollReveal` from `@/components/layout/scroll-reveal`

### Animations
- Scroll reveal on all sections with staggered delays
- Hover transitions on cards and links
- Gradient text effects for brand emphasis

## Data Structure

Currently using placeholder data with this structure:

```typescript
{
  slug: string              // URL-friendly identifier
  title: string            // Post title
  excerpt: string          // Brief description
  author: {
    name: string          // Author name
    avatar: string        // 2-letter initials
    bio?: string          // Author bio (for detail page)
  }
  publishedAt: string     // ISO date string
  category: string        // Category name
  tags?: string[]         // Array of tags (for detail page)
  readTime: string        // e.g., "8 min read"
  featured?: boolean      // Show as featured post
  content?: string        // HTML content (for detail page)
}
```

## Categories

Currently supports:
- **Branding** - Strategic insights on building memorable brands
- **Marketing** - Data-driven marketing strategies and campaigns
- **Consulting** - Expert guidance on business strategy and growth

## Next Steps: PayloadCMS Integration

To connect with PayloadCMS:

1. **Use the Posts collection** from `payload.config.ts`
2. **Fetch posts** with Payload's `find()` API:
   ```typescript
   const payload = await getPayload({ config })
   const posts = await payload.find({
     collection: 'posts',
     where: { _status: { equals: 'published' } },
     sort: '-publishedDate',
     limit: 10,
   })
   ```
3. **Replace placeholder data** with actual CMS data
4. **Use Lexical richText** for post content rendering
5. **Implement** category and tag relationships

## SEO & Metadata

All pages include:
- Dynamic metadata generation
- OpenGraph tags
- Twitter Card support
- Structured canonical URLs
- Keyword optimization
- Proper meta descriptions

## Accessibility

- Semantic HTML structure
- Proper heading hierarchy
- Alt text support for images (placeholders)
- Keyboard navigation support via Links
- ARIA-compliant Badge and Card components

## Performance

- Lightweight design with minimal dependencies
- Scroll-based lazy animations
- Optimized with Next.js App Router
- Static generation ready (add `generateStaticParams`)
- Responsive images support ready

---

**Brand Alignment**: All pages follow ORCACLUB brand guidelines with proper use of the gradient-text class, intelligence cyan accents, and clean minimalist aesthetic.
