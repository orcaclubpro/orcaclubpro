import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, ArrowLeft, Tag } from 'lucide-react'
import ScrollReveal from '@/components/layout/scroll-reveal'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

// This would come from PayloadCMS in production
const blogPosts = {
  'building-memorable-brands-2025': {
    slug: 'building-memorable-brands-2025',
    title: 'Building Memorable Brands in 2025',
    excerpt: 'The landscape of branding has evolved dramatically. Learn how to create brands that resonate with modern audiences and stand the test of time.',
    content: `
      <p>In today's rapidly evolving marketplace, creating a memorable brand is more crucial—and more challenging—than ever before. The digital age has democratized brand building while simultaneously raising the bar for what it takes to stand out.</p>

      <h2>The New Rules of Branding</h2>
      <p>Traditional branding principles still matter, but they must be adapted for the modern consumer. Today's audiences expect authenticity, consistency, and meaningful engagement across every touchpoint.</p>

      <h3>1. Authenticity Over Perfection</h3>
      <p>Modern consumers can spot inauthenticity from a mile away. The brands that succeed in 2025 are those that embrace their unique story, flaws and all, and communicate with genuine transparency.</p>

      <h3>2. Consistency Across Channels</h3>
      <p>With consumers interacting with brands across dozens of touchpoints—from social media to email to in-person experiences—maintaining a consistent brand voice and visual identity is essential.</p>

      <h3>3. Purpose-Driven Positioning</h3>
      <p>Brands that stand for something beyond profit are winning hearts and minds. Whether it's sustainability, social justice, or innovation, having a clear purpose gives your brand deeper meaning.</p>

      <h2>Building Your Brand Foundation</h2>
      <p>Every memorable brand starts with a solid foundation. This includes:</p>

      <ul>
        <li><strong>Clear Brand Strategy:</strong> Define your target audience, unique value proposition, and competitive positioning.</li>
        <li><strong>Visual Identity System:</strong> Create a cohesive visual language including logo, color palette, typography, and imagery style.</li>
        <li><strong>Brand Voice Guidelines:</strong> Establish how your brand communicates—tone, language, and messaging frameworks.</li>
        <li><strong>Customer Experience Mapping:</strong> Design every touchpoint to reinforce your brand promise.</li>
      </ul>

      <h2>The Role of Digital in Modern Branding</h2>
      <p>Digital channels have transformed how brands reach and engage audiences. Social media, content marketing, and digital experiences are now central to brand building.</p>

      <p>However, digital success requires more than just presence—it demands strategic thinking about how to create value for your audience while building brand equity.</p>

      <h2>Measuring Brand Success</h2>
      <p>In 2025, brand success must be measurable. Track metrics like brand awareness, sentiment analysis, customer loyalty scores, and share of voice to understand how your brand is performing.</p>

      <p>The brands that thrive in this era are those that combine timeless principles with modern tactics, creating experiences that resonate deeply with their target audiences.</p>
    `,
    author: {
      name: 'Sarah Chen',
      avatar: 'SC',
      bio: 'Brand Strategist with 15+ years building iconic brands for Fortune 500 companies and startups.',
    },
    publishedAt: '2025-01-15',
    updatedAt: '2025-01-15',
    category: 'Branding',
    tags: ['Brand Strategy', 'Brand Identity', 'Marketing', 'Business Growth'],
    readTime: '8 min read',
  },
  'data-driven-marketing-strategies': {
    slug: 'data-driven-marketing-strategies',
    title: 'Data-Driven Marketing Strategies That Work',
    excerpt: 'Harness the power of analytics to create marketing campaigns that deliver measurable results.',
    content: `
      <p>Marketing in 2025 is no longer about gut feelings and creative hunches alone. The most successful campaigns are built on a foundation of solid data analysis and continuous optimization.</p>

      <h2>The Data-First Mindset</h2>
      <p>Modern marketers must balance creativity with analytical rigor. Every campaign decision should be informed by data, from audience targeting to message testing to channel selection.</p>

      <h3>Key Data Sources</h3>
      <ul>
        <li><strong>Web Analytics:</strong> User behavior, conversion paths, and engagement metrics</li>
        <li><strong>CRM Data:</strong> Customer lifetime value, purchase patterns, and retention rates</li>
        <li><strong>Social Insights:</strong> Audience demographics, engagement rates, and sentiment</li>
        <li><strong>Market Research:</strong> Competitive intelligence and industry trends</li>
      </ul>

      <h2>Building Your Analytics Stack</h2>
      <p>Choose tools that integrate seamlessly and provide actionable insights. The goal is not just to collect data, but to turn it into strategic advantage.</p>

      <h2>Testing and Optimization</h2>
      <p>A/B testing should be standard practice for all marketing initiatives. Test headlines, images, calls-to-action, and entire campaign concepts to identify what resonates with your audience.</p>
    `,
    author: {
      name: 'Marcus Rodriguez',
      avatar: 'MR',
      bio: 'Marketing Analytics Expert specializing in performance marketing and conversion optimization.',
    },
    publishedAt: '2025-01-12',
    updatedAt: '2025-01-12',
    category: 'Marketing',
    tags: ['Marketing Analytics', 'Data Science', 'Performance Marketing', 'ROI'],
    readTime: '6 min read',
  },
  // Add more posts as needed...
}

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = blogPosts[slug as keyof typeof blogPosts]

  if (!post) {
    return {
      title: 'Post Not Found - ORCACLUB Sonar',
    }
  }

  return {
    title: `${post.title} - ORCACLUB Sonar`,
    description: post.excerpt,
    keywords: post.tags,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://orcaclub.pro/sonar/${post.slug}`,
      siteName: 'ORCACLUB',
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = blogPosts[slug as keyof typeof blogPosts]

  if (!post) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-light text-white mb-4">Post Not Found</h1>
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

  return (
    <div className="min-h-screen bg-black relative">
      {/* Back Navigation */}
      <div className="pt-24 pb-8 px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/sonar"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-cyan-400 transition-colors duration-300 text-sm font-light"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sonar
          </Link>
        </div>
      </div>

      {/* Article Header */}
      <article className="pb-40 px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <header className="mb-12">
              {/* Category */}
              <div className="mb-6">
                <Link href={`/sonar/category/${post.category.toLowerCase()}`}>
                  <Badge
                    variant="outline"
                    className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 transition-colors duration-300"
                  >
                    {post.category}
                  </Badge>
                </Link>
              </div>

              {/* Title */}
              <h1 className="text-4xl md:text-6xl font-light text-white mb-6 leading-tight tracking-tight">
                {post.title}
              </h1>

              {/* Meta Info */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-sm text-gray-300">
                    {post.author.avatar}
                  </div>
                  <div>
                    <div className="text-gray-300 font-light">{post.author.name}</div>
                    <div className="text-xs text-gray-500">{post.author.bio}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {new Date(post.publishedAt).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>{post.readTime}</span>
                </div>
              </div>

              <Separator className="mt-8 bg-gray-800" />
            </header>
          </ScrollReveal>

          {/* Featured Image Placeholder */}
          <ScrollReveal delay={100}>
            <div className="relative h-96 bg-gradient-to-br from-cyan-500/10 to-blue-600/10 rounded-2xl mb-12 flex items-center justify-center border border-gray-800">
              <div className="text-center">
                <div className="w-24 h-24 mx-auto rounded-full bg-cyan-400/10 flex items-center justify-center mb-4">
                  <span className="text-4xl font-light text-cyan-400">○</span>
                </div>
                <p className="text-gray-500 text-sm">Featured Image</p>
              </div>
            </div>
          </ScrollReveal>

          {/* Article Content */}
          <ScrollReveal delay={200}>
            <div
              className="prose prose-invert prose-lg max-w-none
                prose-headings:font-light prose-headings:text-white prose-headings:tracking-tight
                prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
                prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-gray-300 prose-p:leading-relaxed prose-p:font-light prose-p:mb-6
                prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:text-cyan-300 prose-a:transition-colors
                prose-strong:text-white prose-strong:font-medium
                prose-ul:text-gray-300 prose-ul:leading-relaxed
                prose-li:mb-2 prose-li:font-light
                prose-blockquote:border-l-cyan-400 prose-blockquote:text-gray-400 prose-blockquote:italic
              "
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </ScrollReveal>

          {/* Tags */}
          <ScrollReveal delay={300}>
            <Separator className="my-12 bg-gray-800" />
            <div className="flex items-start gap-4">
              <Tag className="w-5 h-5 text-gray-500 mt-1" />
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-gray-700 text-gray-400 bg-gray-950/50 hover:border-cyan-400/30 hover:text-cyan-400 transition-all duration-300"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Author Bio */}
          <ScrollReveal delay={400}>
            <div className="mt-16 p-8 bg-gray-950/50 border border-gray-800 rounded-2xl">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center text-lg text-gray-300 shrink-0">
                  {post.author.avatar}
                </div>
                <div>
                  <h3 className="text-xl font-light text-white mb-2">
                    Written by {post.author.name}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-light">
                    {post.author.bio}
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Related Articles CTA */}
          <ScrollReveal delay={500}>
            <div className="mt-16 text-center">
              <Link
                href="/sonar"
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors duration-300"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="font-light">Explore more insights</span>
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </article>
    </div>
  )
}
