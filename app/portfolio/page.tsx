import Navigation from "../components/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from 'next'
import { ExternalLink, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Portfolio - Software Development Projects & Web Design Examples | orcaclub",
  description: "View our portfolio of successful software development projects, beautiful web designs, AI automation solutions & digital transformations. See real results from our software company's work.",
  keywords: [
    "software development portfolio",
    "web design portfolio",
    "software company projects",
    "AI automation examples",
    "web design examples",
    "software development case studies",
    "custom software projects",
    "digital transformation portfolio",
    "software agency work",
    "business automation projects",
    "web application examples",
    "software consultant portfolio",
    "technology solutions examples",
    "innovative software projects",
    "successful web designs",
    "software development showcase",
    "AI workflow examples",
    "enterprise software portfolio",
    "mobile app development portfolio",
    "ecommerce development examples"
  ],
  openGraph: {
    title: "Portfolio - Software Development Projects & Web Design Examples",
    description: "View our portfolio of successful software development projects, beautiful web designs, AI automation solutions & digital transformations. See real results from our work.",
    type: "website",
    url: "https://orcaclub.pro/portfolio",
    images: [{
      url: "/og-portfolio.jpg",
      width: 1200,
      height: 630,
      alt: "orcaclub Portfolio - Software Development & Web Design Projects"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "Portfolio - Software Development Projects & Web Design Examples",
    description: "View our portfolio of successful software development projects, beautiful web designs, AI automation solutions & digital transformations."
  },
  alternates: {
    canonical: "https://orcaclub.pro/portfolio"
  }
}

const portfolioItems = [
  {
    id: 1,
    title: "E-commerce Platform",
    category: "Web Design",
    description: "Complete redesign of a luxury fashion e-commerce platform with focus on conversion optimization.",
    image: "/placeholder.svg?height=400&width=600",
    metrics: ["300% increase in conversions", "50% faster load times", "95% user satisfaction"],
    technologies: ["Next.js", "TypeScript", "Tailwind CSS", "Stripe"],
    link: "#",
  },
  {
    id: 2,
    title: "AI Customer Service",
    category: "AI Workflows",
    description: "Intelligent automation system that handles 80% of customer inquiries with human-like responses.",
    image: "/placeholder.svg?height=400&width=600",
    metrics: ["80% automation rate", "24/7 availability", "90% customer satisfaction"],
    technologies: ["OpenAI", "Node.js", "PostgreSQL", "Redis"],
    link: "#",
  },
  {
    id: 3,
    title: "SaaS Dashboard",
    category: "Web Design",
    description: "Comprehensive analytics dashboard for a B2B SaaS platform with real-time data visualization.",
    image: "/placeholder.svg?height=400&width=600",
    metrics: ["40% increase in user engagement", "60% reduction in support tickets", "99.9% uptime"],
    technologies: ["React", "D3.js", "Node.js", "MongoDB"],
    link: "#",
  },
  {
    id: 4,
    title: "SEO Optimization",
    category: "SEO",
    description: "Complete technical SEO overhaul for a growing startup, resulting in 10x organic traffic growth.",
    image: "/placeholder.svg?height=400&width=600",
    metrics: ["1000% organic traffic increase", "Top 3 rankings for key terms", "50% improvement in Core Web Vitals"],
    technologies: ["Technical SEO", "Schema Markup", "Performance Optimization"],
    link: "#",
  },
]

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <div className="pt-32 pb-20 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
              Our{" "}
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-medium">
                Portfolio
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Selected works that demonstrate our commitment to excellence and innovation. Each project represents a
              unique challenge solved with precision and creativity.
            </p>
          </div>

          {/* Portfolio Grid */}
          <div className="space-y-20">
            {portfolioItems.map((item, index) => (
              <div
                key={item.id}
                className={`grid lg:grid-cols-2 gap-12 items-center ${index % 2 === 1 ? "lg:grid-flow-col-dense" : ""}`}
              >
                {/* Image */}
                <div className={`${index % 2 === 1 ? "lg:col-start-2" : ""}`}>
                  <div className="relative group">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.title}
                      width={600}
                      height={320}
                      className="w-full h-80 object-cover rounded-lg border border-slate-800 group-hover:border-cyan-400/50 transition-colors"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-4 left-4 right-4">
                        <Link
                          href={item.link}
                          className="inline-flex items-center gap-2 text-white hover:text-cyan-400 transition-colors"
                        >
                          View Project <ExternalLink size={16} />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className={`${index % 2 === 1 ? "lg:col-start-1 lg:row-start-1" : ""}`}>
                  <div className="space-y-6">
                    <div>
                      <span className="text-cyan-400 text-sm font-medium">{item.category}</span>
                      <h2 className="text-3xl font-light mt-2 mb-4">{item.title}</h2>
                      <p className="text-gray-400 leading-relaxed">{item.description}</p>
                    </div>

                    {/* Metrics */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Results</h3>
                      <div className="space-y-2">
                        {item.metrics.map((metric, metricIndex) => (
                          <div key={metricIndex} className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                            <span className="text-gray-300 text-sm">{metric}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technologies */}
                    <div>
                      <h3 className="text-lg font-medium mb-3">Technologies</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.technologies.map((tech, techIndex) => (
                          <span
                            key={techIndex}
                            className="px-3 py-1 bg-slate-900 border border-slate-700 rounded-full text-sm text-gray-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Link
                      href={item.link}
                      className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                    >
                      View Case Study <ArrowRight size={16} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Section */}
          <div className="mt-20 text-center">
            <h2 className="text-3xl font-light mb-6">Ready to create something extraordinary?</h2>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Let&apos;s discuss how we can help transform your digital presence with the same precision and innovation.
            </p>
            <Link
              href="/contact"
              className="bg-linear-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-lg font-medium hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              Start Your Project <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-xl tracking-tight mb-4">
            <span className="font-light">ORCA</span>
            <span className="font-medium bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              CLUB
            </span>
          </div>
          <p className="text-gray-400 text-sm">Premium software agency & digital innovation</p>
        </div>
      </footer>
    </div>
  )
}
