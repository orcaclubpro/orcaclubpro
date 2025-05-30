import Navigation from "../components/navigation"
import ScrollReveal from "../components/scroll-reveal"
import Link from "next/link"
import type { Metadata } from 'next'
import { 
  Target, 
  Users, 
  Award, 
  Zap, 
  Brain, 
  Shield, 
  ArrowRight, 
  CheckCircle,
  TrendingUp
} from "lucide-react"

export const metadata: Metadata = {
  title: "About Us - Leading Software Development Company & Web Design Agency | orcaclub",
  description: "Learn about orcaclub, a premier software development company specializing in custom web design, AI automation, and digital transformation. Meet our expert team of software consultants and developers.",
  keywords: [
    "about software company",
    "software development company",
    "web design agency",
    "software agency team",
    "custom software development company",
    "AI automation company",
    "software consultants",
    "digital transformation agency",
    "software engineering company",
    "technology consulting firm",
    "enterprise software company",
    "web development agency",
    "software development team",
    "innovation software company",
    "business automation experts",
    "software solutions company",
    "professional software developers",
    "award winning software company",
    "expert web designers",
    "software company history"
  ],
  openGraph: {
    title: "About Us - Leading Software Development Company & Web Design Agency",
    description: "Learn about orcaclub, a premier software development company specializing in custom web design, AI automation, and digital transformation. Meet our expert team.",
    type: "website",
    url: "https://orcaclub.pro/about",
    images: [{
      url: "/og-about.jpg",
      width: 1200,
      height: 630,
      alt: "About orcaclub - Software Development Company Team"
    }]
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - Leading Software Development Company & Web Design Agency",
    description: "Learn about orcaclub, a premier software development company specializing in custom web design, AI automation, and digital transformation."
  },
  alternates: {
    canonical: "https://orcaclub.pro/about"
  }
}

const values = [
  {
    icon: Target,
    title: "Precision Engineering",
    description: "Every solution crafted with mathematical precision and psychological intelligence for maximum impact."
  },
  {
    icon: Brain,
    title: "Intelligent Innovation", 
    description: "We harness AI and advanced technologies to create solutions that learn, adapt, and evolve with your business."
  },
  {
    icon: Shield,
    title: "Uncompromising Quality",
    description: "Our commitment to excellence ensures every project meets the highest standards of performance and reliability."
  },
  {
    icon: Users,
    title: "Partnership Approach",
    description: "We believe in building lasting relationships, working as an extension of your team to achieve shared success."
  }
]

const achievements = [
  {
    icon: Award,
    metric: "50+",
    label: "Successful Projects",
    description: "Delivered across various industries"
  },
  {
    icon: TrendingUp,
    metric: "250%",
    label: "Average ROI",
    description: "For our clients' investments"
  },
  {
    icon: Users,
    metric: "98%",
    label: "Client Satisfaction",
    description: "Long-term partnership rate"
  },
  {
    icon: Zap,
    metric: "<48hrs",
    label: "Response Time",
    description: "For critical issues"
  }
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <div className="pt-32 pb-20 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <ScrollReveal>
            <div className="text-center mb-20">
              <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
                Crafting the future of{" "}
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-medium">
                  digital innovation
                </span>
              </h1>
              <p className="text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed">
                We are orcaclub—a premier software development company that transforms businesses through 
                intelligent design, cutting-edge technology, and mathematical precision.
              </p>
            </div>
          </ScrollReveal>

          {/* Our Story */}
          <ScrollReveal delay={200}>
            <section className="mb-20">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl font-light mb-6">Our Mission</h2>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    Founded on the principle that technology should amplify human intelligence, 
                    orcaclub emerged from a vision to bridge the gap between complex technological 
                    possibilities and practical business solutions.
                  </p>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    As a leading <strong>software development company</strong>, we specialize in creating 
                    tailored solutions that not only meet today&apos;s challenges but anticipate tomorrow&apos;s 
                    opportunities. Our approach combines mathematical precision with psychological 
                    understanding to deliver results that exceed expectations.
                  </p>
                  <p className="text-gray-400 leading-relaxed">
                    Every project we undertake reflects our commitment to excellence, innovation, 
                    and the transformative power of intelligent software design.
                  </p>
                </div>
                <div className="relative">
                  <div className="workspace-card rounded-2xl p-8 bg-gradient-to-br from-gray-900/50 to-gray-800/30 border border-gray-700/50">
                    <blockquote className="text-lg text-gray-300 italic mb-6">
                      &ldquo;We don&apos;t just build software—we engineer competitive advantages through 
                      intelligent design and strategic innovation.&rdquo;
                    </blockquote>
                    <cite className="text-cyan-400 font-medium">orcaclub Team</cite>
                  </div>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* Our Values */}
          <ScrollReveal delay={400}>
            <section className="mb-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-light mb-6">
                  What drives our{" "}
                  <span className="gradient-text font-medium">excellence</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  Our core values shape every decision, every line of code, and every client interaction.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, index) => (
                  <ScrollReveal key={index} delay={index * 100}>
                    <div className="workspace-card rounded-2xl p-6 text-center group">
                      <value.icon className="w-12 h-12 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <h3 className="text-lg font-medium text-white mb-3">{value.title}</h3>
                      <p className="text-gray-400 text-sm leading-relaxed">{value.description}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Achievements */}
          <ScrollReveal delay={600}>
            <section className="mb-20">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-light mb-6">
                  Results that{" "}
                  <span className="gradient-text font-medium">speak volumes</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                  Our track record demonstrates our commitment to delivering exceptional outcomes for every client.
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {achievements.map((achievement, index) => (
                  <ScrollReveal key={index} delay={index * 100}>
                    <div className="workspace-card rounded-2xl p-6 text-center group">
                      <achievement.icon className="w-8 h-8 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                      <div className="text-3xl font-light text-white mb-2 font-mono">{achievement.metric}</div>
                      <div className="text-lg font-medium text-gray-300 mb-2">{achievement.label}</div>
                      <p className="text-gray-400 text-sm">{achievement.description}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </section>
          </ScrollReveal>

          {/* Our Approach */}
          <ScrollReveal delay={800}>
            <section className="mb-20">
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                  <div className="workspace-card rounded-2xl p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20">
                    <h3 className="text-xl font-medium text-cyan-400 mb-4">Our Approach</h3>
                    <ul className="space-y-4">
                      {[
                        "Mathematical precision in every design decision",
                        "AI-powered solutions that learn and adapt",
                        "User psychology integrated into interface architecture",
                        "Continuous optimization and performance monitoring",
                        "Transparent communication throughout the process"
                      ].map((item, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <h2 className="text-3xl font-light mb-6">The orcaclub Difference</h2>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    As a premier <strong>software development company</strong>, we don&apos;t just follow 
                    industry standards—we set them. Our methodology combines rigorous technical 
                    expertise with creative problem-solving to deliver solutions that are both 
                    innovative and reliable.
                  </p>
                  <p className="text-gray-400 leading-relaxed mb-6">
                    From initial consultation to final deployment, we maintain the highest standards 
                    of quality, security, and performance. Our <strong>software consultants</strong> 
                    work closely with your team to ensure every solution aligns perfectly with your 
                    business objectives.
                  </p>
                  <Link
                    href="/services"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-medium"
                  >
                    Explore Our Services <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </section>
          </ScrollReveal>

          {/* CTA */}
          <ScrollReveal delay={1000}>
            <section className="text-center bg-gradient-to-r from-gray-900/50 to-gray-800/30 rounded-2xl p-12 border border-gray-700/50">
              <h2 className="text-3xl font-light mb-6">Ready to transform your business?</h2>
              <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                Partner with a <strong>software development company</strong> that understands your vision 
                and has the expertise to bring it to life.
              </p>
              <Link
                href="/contact"
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-lg font-medium hover:scale-105 transition-transform inline-flex items-center gap-2"
              >
                Start Your Project <ArrowRight size={20} />
              </Link>
            </section>
          </ScrollReveal>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-xl tracking-tight mb-4">
            <span className="font-light">ORCA</span>
            <span className="font-medium bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              CLUB
            </span>
          </div>
          <p className="text-gray-400 text-sm">Premier software development company & digital innovation partner</p>
        </div>
      </footer>
    </div>
  )
} 