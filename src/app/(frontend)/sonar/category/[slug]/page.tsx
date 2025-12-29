import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, ArrowLeft } from 'lucide-react'
import ScrollReveal from '@/components/layout/scroll-reveal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

// Placeholder blog posts data
const blogPosts = [
  {
    slug: 'building-memorable-brands-2025',
    title: 'Building Memorable Brands in 2025',
    excerpt: 'The landscape of branding has evolved dramatically. Learn how to create brands that resonate with modern audiences and stand the test of time.',
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
    },
    publishedAt: '2025-01-15',
    category: 'Branding',
    readTime: '8 min read',
  },
  {
    slug: 'data-driven-marketing-strategies',
    title: 'Data-Driven Marketing Strategies That Work',
    excerpt: 'Harness the power of analytics to create marketing campaigns that deliver measurable results. A practical guide to modern marketing.',
    author: {
      name: 'Marcus Rodriguez',
      avatar: 'MR',
    },
    publishedAt: '2025-01-12',
    category: 'Marketing',
    readTime: '6 min read',
  },
  {
    slug: 'strategic-consulting-for-startups',
    title: 'Strategic Consulting for Early-Stage Startups',
    excerpt: 'Navigate the challenges of startup growth with expert guidance. Learn how strategic consulting can accelerate your business trajectory.',
    author: {
      name: 'Dr. Emily Watson',
      avatar: 'EW',
    },
    publishedAt: '2025-01-10',
    category: 'Consulting',
    readTime: '10 min read',
  },
  {
    slug: 'visual-identity-design-principles',
    title: 'The Art of Visual Identity Design',
    excerpt: 'Explore the principles behind creating cohesive visual identities that communicate brand values and resonate with target audiences.',
    author: {
      name: 'Jordan Lee',
      avatar: 'JL',
    },
    publishedAt: '2025-01-08',
    category: 'Branding',
    readTime: '7 min read',
  },
  {
    slug: 'social-media-strategy-2025',
    title: 'Social Media Strategy in the Age of AI',
    excerpt: 'How artificial intelligence is reshaping social media marketing and what it means for your brand\'s digital presence.',
    author: {
      name: 'Alex Thompson',
      avatar: 'AT',
    },
    publishedAt: '2025-01-05',
    category: 'Marketing',
    readTime: '9 min read',
  },
  {
    slug: 'brand-positioning-frameworks',
    title: 'Brand Positioning Frameworks for Competitive Markets',
    excerpt: 'Stand out in crowded markets with proven positioning strategies. Learn how to differentiate your brand effectively.',
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
    },
    publishedAt: '2025-01-03',
    category: 'Branding',
    readTime: '11 min read',
  },
]

const categoryInfo = {
  branding: {
    name: 'Branding',
    description: 'Strategic insights on building memorable brands, visual identity design, and brand positioning.',
  },
  marketing: {
    name: 'Marketing',
    description: 'Data-driven marketing strategies, digital campaigns, and growth tactics that deliver results.',
  },
  consulting: {
    name: 'Consulting',
    description: 'Expert guidance on business strategy, organizational growth, and navigating complex challenges.',
  },
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const category = categoryInfo[slug as keyof typeof categoryInfo]

  if (!category) {
    return {
      title: 'Category Not Found - ORCACLUB Sonar',
    }
  }

  return {
    title: `${category.name} - ORCACLUB Sonar`,
    description: category.description,
    openGraph: {
      title: `${category.name} Insights - ORCACLUB Sonar`,
      description: category.description,
      url: `https://orcaclub.pro/sonar/category/${slug}`,
      siteName: 'ORCACLUB',
      type: 'website',
    },
  }
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params
  const category = categoryInfo[slug as keyof typeof categoryInfo]

  if (!category) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-light text-white mb-4">Category Not Found</h1>
          <Link
            href="/sonar"
            className="text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
          >
            ← Back to Sonar
          </Link>
        </div>
      </div>
    )
  }

  // Filter posts by category
  const categoryPosts = blogPosts.filter(
    (post) => post.category.toLowerCase() === slug
  )

  return (
    <div className="min-h-screen bg-black relative">
      {/* Back Navigation */}
      <div className="pt-24 pb-8 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/sonar"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors duration-300 text-sm font-light"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Posts
          </Link>
        </div>
      </div>

      {/* Category Header */}
      <section className="pb-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <Badge
                variant="outline"
                className="border-cyan-400/30 text-cyan-400 mb-6 text-sm px-4 py-2"
              >
                {category.name}
              </Badge>
              <h1 className="text-4xl md:text-6xl font-extralight mb-6 tracking-tight text-white">
                {category.name} <span className="gradient-text font-light">Insights</span>
              </h1>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                {category.description}
              </p>
              <div className="mt-6 text-sm text-gray-500">
                {categoryPosts.length} {categoryPosts.length === 1 ? 'article' : 'articles'}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Posts Grid */}
      <section className="pb-40 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          {categoryPosts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg font-light">
                No articles found in this category yet.
              </p>
              <Link
                href="/sonar"
                className="inline-block mt-6 text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
              >
                Browse all articles
              </Link>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categoryPosts.map((post, index) => (
                <ScrollReveal key={post.slug} delay={100 * (index + 1)}>
                  <Link href={`/sonar/${post.slug}`} className="group block h-full">
                    <Card className="bg-gray-950/50 border-gray-800 hover:border-cyan-400/30 transition-all duration-500 h-full flex flex-col">
                      {/* Image Placeholder */}
                      <div className="relative h-48 bg-gradient-to-br from-gray-900 to-gray-950 border-b border-gray-800">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-gray-800/50 flex items-center justify-center">
                            <span className="text-xl text-gray-600 font-light">○</span>
                          </div>
                        </div>
                      </div>

                      <CardHeader>
                        <div className="mb-3">
                          <Badge variant="outline" className="border-gray-700 text-gray-400 text-xs">
                            {post.category}
                          </Badge>
                        </div>
                        <h3 className="text-xl font-light text-white group-hover:text-cyan-400 transition-colors duration-300 leading-tight">
                          {post.title}
                        </h3>
                      </CardHeader>

                      <CardContent className="flex-grow">
                        <p className="text-gray-400 text-sm leading-relaxed font-light">
                          {post.excerpt}
                        </p>
                      </CardContent>

                      <CardFooter className="flex-col items-start gap-4 border-t border-gray-800/50 mt-auto">
                        <div className="flex items-center gap-3 text-xs text-gray-500 w-full">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center text-[10px] text-gray-400">
                              {post.author.avatar}
                            </div>
                            <span>{post.author.name}</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between w-full text-xs text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" />
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
