import type { Metadata } from 'next'
import Link from 'next/link'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import ScrollReveal from '@/components/layout/scroll-reveal'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Sonar - ORCACLUB Blog | Insights & Analysis',
  description: 'Deep dives into branding, marketing, and business strategy. Expert insights and analysis from the ORCACLUB team.',
  keywords: [
    'branding insights',
    'marketing blog',
    'business strategy',
    'brand analysis',
    'marketing trends',
    'consulting insights',
  ],
  openGraph: {
    title: 'Sonar - ORCACLUB Blog | Insights & Analysis',
    description: 'Deep dives into branding, marketing, and business strategy. Expert insights from ORCACLUB.',
    url: 'https://orcaclub.pro/sonar',
    siteName: 'ORCACLUB',
    type: 'website',
  },
}

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
    featured: true,
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
    featured: false,
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
    featured: false,
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
    featured: false,
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
    featured: false,
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
    featured: false,
  },
]

const categories = [
  { name: 'All Posts', slug: 'all', count: blogPosts.length },
  { name: 'Branding', slug: 'branding', count: blogPosts.filter(p => p.category === 'Branding').length },
  { name: 'Marketing', slug: 'marketing', count: blogPosts.filter(p => p.category === 'Marketing').length },
  { name: 'Consulting', slug: 'consulting', count: blogPosts.filter(p => p.category === 'Consulting').length },
]

export default function SonarPage() {
  const featuredPost = blogPosts.find(post => post.featured)
  const regularPosts = blogPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-black relative">
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-7xl font-extralight mb-6 tracking-tight">
                <span className="text-white">Sonar</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto font-light leading-relaxed">
                Deep dives into branding, marketing, and business strategy.
                <br />
                <span className="text-gray-500">Signal through the noise.</span>
              </p>
            </div>
          </ScrollReveal>

          {/* Category Filter */}
          <ScrollReveal delay={100}>
            <div className="flex flex-wrap gap-3 justify-center mb-16">
              {categories.map((category) => (
                <Link
                  key={category.slug}
                  href={category.slug === 'all' ? '/sonar' : `/sonar/category/${category.slug}`}
                  className="group"
                >
                  <Badge
                    variant="outline"
                    className="px-4 py-2 text-sm border-gray-800 bg-gray-950/50 text-gray-400 hover:border-cyan-400/30 hover:text-cyan-400 transition-all duration-300 cursor-pointer"
                  >
                    {category.name}
                    <span className="ml-2 text-xs text-gray-600 group-hover:text-cyan-400/70">
                      ({category.count})
                    </span>
                  </Badge>
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="pb-20 px-8 relative z-10">
          <div className="max-w-7xl mx-auto">
            <ScrollReveal delay={200}>
              <Link href={`/sonar/${featuredPost.slug}`} className="group block">
                <Card className="bg-gray-950/50 border-gray-800 hover:border-cyan-400/30 transition-all duration-500 overflow-hidden">
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Featured Image Placeholder */}
                    <div className="relative h-80 md:h-auto bg-gradient-to-br from-cyan-500/10 to-blue-600/10 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-cyan-400/10 flex items-center justify-center">
                          <span className="text-3xl font-light text-cyan-400">★</span>
                        </div>
                        <Badge className="bg-cyan-400/20 text-cyan-400 border-0">
                          Featured
                        </Badge>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-8 md:p-12 flex flex-col justify-center">
                      <div className="mb-4">
                        <Badge variant="outline" className="border-cyan-400/30 text-cyan-400 mb-4">
                          {featuredPost.category}
                        </Badge>
                      </div>

                      <h2 className="text-3xl md:text-4xl font-light mb-4 text-white group-hover:text-cyan-400 transition-colors duration-300">
                        {featuredPost.title}
                      </h2>

                      <p className="text-gray-400 text-lg mb-6 leading-relaxed font-light">
                        {featuredPost.excerpt}
                      </p>

                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-xs text-gray-400">
                            {featuredPost.author.avatar}
                          </div>
                          <span>{featuredPost.author.name}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(featuredPost.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{featuredPost.readTime}</span>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center gap-2 text-cyan-400 group-hover:gap-4 transition-all duration-300">
                        <span className="text-sm font-light">Read Article</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* Regular Posts Grid */}
      <section className="pb-40 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {regularPosts.map((post, index) => (
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
        </div>
      </section>
    </div>
  )
}
