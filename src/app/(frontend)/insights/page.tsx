import Link from "next/link"
import Image from "next/image"
import { Calendar, Clock, ArrowRight, TrendingUp, Code, Brain, Target } from "lucide-react"

const blogPosts = [
  {
    id: 1,
    title: "The Psychology of Minimalist Web Design",
    excerpt:
      "How reducing visual complexity can increase user engagement and conversion rates through cognitive load reduction.",
    category: "Design Psychology",
    readTime: "8 min read",
    publishDate: "2024-01-15",
    author: "ORCACLUB Team",
    image: "/placeholder.svg?height=300&width=500",
    tags: ["UX Design", "Psychology", "Conversion"],
  },
  {
    id: 2,
    title: "AI Workflows: Beyond the Hype",
    excerpt: "A technical deep-dive into implementing practical AI solutions that deliver measurable business value.",
    category: "AI & Automation",
    readTime: "12 min read",
    publishDate: "2024-01-08",
    author: "ORCACLUB Team",
    image: "/placeholder.svg?height=300&width=500",
    tags: ["AI", "Automation", "Business Strategy"],
  },
  {
    id: 3,
    title: "Performance Optimization: The 1.5 Second Rule",
    excerpt:
      "Why page load speed is critical for user retention and how to achieve sub-1.5 second load times consistently.",
    category: "Performance",
    readTime: "10 min read",
    publishDate: "2024-01-01",
    author: "ORCACLUB Team",
    image: "/placeholder.svg?height=300&width=500",
    tags: ["Performance", "Web Development", "SEO"],
  },
  {
    id: 4,
    title: "The Future of SEO: Technical Excellence",
    excerpt: "Moving beyond keywords to technical SEO strategies that create lasting competitive advantages.",
    category: "SEO Strategy",
    readTime: "15 min read",
    publishDate: "2023-12-20",
    author: "ORCACLUB Team",
    image: "/placeholder.svg?height=300&width=500",
    tags: ["SEO", "Technical Strategy", "Digital Marketing"],
  },
  {
    id: 5,
    title: "Building Trust Through Code Quality",
    excerpt:
      "How clean, well-documented code becomes a competitive advantage and builds long-term client relationships.",
    category: "Development",
    readTime: "6 min read",
    publishDate: "2023-12-15",
    author: "ORCACLUB Team",
    image: "/placeholder.svg?height=300&width=500",
    tags: ["Code Quality", "Best Practices", "Client Relations"],
  },
  {
    id: 6,
    title: "The Economics of Premium Positioning",
    excerpt: "Why charging more can actually increase demand and how to position your services at the premium tier.",
    category: "Business Strategy",
    readTime: "9 min read",
    publishDate: "2023-12-10",
    author: "ORCACLUB Team",
    image: "/placeholder.svg?height=300&width=500",
    tags: ["Pricing Strategy", "Brand Positioning", "Business Growth"],
  },
]

const categories = [
  { name: "All", icon: TrendingUp, count: 6 },
  { name: "Design Psychology", icon: Brain, count: 1 },
  { name: "AI & Automation", icon: Brain, count: 1 },
  { name: "Performance", icon: Code, count: 1 },
  { name: "SEO Strategy", icon: Target, count: 1 },
  { name: "Development", icon: Code, count: 1 },
  { name: "Business Strategy", icon: TrendingUp, count: 1 },
]

export default function InsightsPage() {
  return (
    <>
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
          Expert Software Development{" "}
          <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-medium">
            Insights
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
          In-depth technical knowledge and strategic thinking from our <strong>software development</strong> experts. 
          Discover insights on <strong>AI automation</strong>, <strong>web design</strong>, and digital transformation 
          to help you make informed decisions about your technology strategy.
        </p>
      </div>

      {/* Categories Filter */}
      <div className="flex flex-wrap gap-4 mb-12 justify-center">
        {categories.map((category, index) => (
          <button
            key={index}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              index === 0
                ? "bg-blue-600 text-white"
                : "border border-slate-700 text-gray-300 hover:border-cyan-400 hover:text-cyan-400"
            }`}
          >
            <category.icon className="w-4 h-4" />
            {category.name}
            <span className="text-xs opacity-70">({category.count})</span>
          </button>
        ))}
      </div>

      {/* Featured Post */}
      <div className="mb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center p-8 border border-slate-800 rounded-lg">
          <div>
            <span className="text-cyan-400 text-sm font-medium">Featured Article</span>
            <h2 className="text-3xl font-light mt-2 mb-4">{blogPosts[0].title}</h2>
            <p className="text-gray-400 leading-relaxed mb-6">{blogPosts[0].excerpt}</p>

            <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(blogPosts[0].publishDate).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {blogPosts[0].readTime}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {blogPosts[0].tags.map((tag, tagIndex) => (
                <span
                  key={tagIndex}
                  className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-xs text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <Link
              href={`/insights/${blogPosts[0].id}`}
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
            >
              Read Article <ArrowRight size={16} />
            </Link>
          </div>

          <div>
            <Image
              src={blogPosts[0].image || "/placeholder.svg"}
              alt={blogPosts[0].title}
              width={500}
              height={320}
              className="w-full h-80 object-cover rounded-lg border border-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {blogPosts.slice(1).map((post) => (
          <article key={post.id} className="group">
            <div className="border border-slate-800 rounded-lg overflow-hidden hover:border-cyan-400/50 transition-colors">
              <Image
                src={post.image || "/placeholder.svg"}
                alt={post.title}
                width={400}
                height={192}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
              />

              <div className="p-6">
                <span className="text-cyan-400 text-xs font-medium">{post.category}</span>
                <h3 className="text-lg font-medium mt-2 mb-3 group-hover:text-cyan-400 transition-colors">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">{post.excerpt}</p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(post.publishDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    {post.readTime}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.slice(0, 2).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 2 && (
                    <span className="px-2 py-1 text-xs text-gray-500">+{post.tags.length - 2}</span>
                  )}
                </div>

                <Link
                  href={`/insights/${post.id}`}
                  className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors text-sm font-medium"
                >
                  Read More <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>

      {/* Newsletter Signup */}
      <div className="mt-20 text-center p-8 border border-slate-800 rounded-lg">
        <h2 className="text-2xl font-light mb-4">Stay Updated</h2>
        <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
          Get our latest insights delivered directly to your inbox. Technical deep-dives, industry analysis, and
          strategic thinking.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors"
          />
          <button className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-3 rounded-lg font-medium hover:scale-105 transition-transform">
            Subscribe
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3">No spam. Unsubscribe anytime. Quality over quantity.</p>
      </div>
    </>
  )
}
