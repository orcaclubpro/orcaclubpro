import type { Metadata } from 'next'
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import {
  ArrowRight,
  Code2,
  Layers,
  Zap,
  Globe,
  Database,
  Workflow,
  CheckCircle,
  Clock,
  MessageSquare,
  Rocket,
} from "lucide-react"

export const metadata: Metadata = {
  title: 'Hire a Professional Full Stack Web Developer | Freelance Web Developer | ORCACLUB',
  description: 'Looking to hire a web developer? Meet the full stack developer behind ORCACLUB. Professional freelance web developer specializing in React, Next.js, Shopify, and custom API integrations. Fast delivery, transparent pricing.',
  keywords: [
    'web developer',
    'full stack developer',
    'freelance web developer',
    'hire web developer',
    'professional web developer',
    'React developer',
    'Next.js developer',
    'Shopify developer',
    'freelance developer for hire',
    'custom web development',
    'frontend developer',
    'backend developer',
    'JavaScript developer',
    'TypeScript developer',
    'API developer',
  ],
  openGraph: {
    title: 'Hire a Professional Full Stack Web Developer | ORCACLUB',
    description: 'Meet the full stack web developer behind ORCACLUB. Specializing in React, Next.js, Shopify, and custom integrations. Fast delivery in 3-21 days.',
    url: 'https://orcaclub.pro/founder',
    siteName: 'ORCACLUB',
    type: 'profile',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ORCACLUB - Professional Full Stack Web Developer for Hire',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hire a Professional Full Stack Web Developer | ORCACLUB',
    description: 'Full stack developer specializing in React, Next.js, Shopify, and custom business solutions. Fast delivery, transparent pricing.',
    images: ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://orcaclub.pro/founder',
  },
}

const techStack = [
  { name: 'React', category: 'Frontend' },
  { name: 'Next.js', category: 'Frontend' },
  { name: 'TypeScript', category: 'Language' },
  { name: 'Node.js', category: 'Backend' },
  { name: 'MongoDB', category: 'Database' },
  { name: 'PostgreSQL', category: 'Database' },
  { name: 'Shopify', category: 'E-commerce' },
  { name: 'Stripe', category: 'Payments' },
  { name: 'Payload CMS', category: 'CMS' },
  { name: 'Tailwind CSS', category: 'Styling' },
  { name: 'REST APIs', category: 'Integration' },
  { name: 'GraphQL', category: 'Integration' },
]

const expertise = [
  {
    icon: Code2,
    title: 'Full Stack Development',
    description: 'End-to-end web development from responsive frontends to scalable backend systems. Modern tech stack with React, Next.js, and Node.js.',
  },
  {
    icon: Globe,
    title: 'Shopify & E-commerce',
    description: 'Headless Shopify storefronts, custom checkout flows, inventory management, and seamless payment integrations.',
  },
  {
    icon: Database,
    title: 'API & Integration',
    description: 'Custom API development, third-party integrations (Stripe, CRMs, marketing tools), and data synchronization.',
  },
  {
    icon: Workflow,
    title: 'Business Automation',
    description: 'Workflow automation, custom admin dashboards, booking systems, and internal tools that save time and reduce errors.',
  },
]

const process = [
  {
    icon: MessageSquare,
    step: '01',
    title: 'Discovery Call',
    description: 'Free 30-minute consultation to understand your goals, timeline, and requirements.',
  },
  {
    icon: Layers,
    step: '02',
    title: 'Scope & Proposal',
    description: 'Clear project scope, fixed pricing, and transparent timeline. No surprises.',
  },
  {
    icon: Zap,
    step: '03',
    title: 'Rapid Development',
    description: 'Development begins within 48 hours. Daily updates and direct communication.',
  },
  {
    icon: Rocket,
    step: '04',
    title: 'Launch & Support',
    description: 'Go live with full documentation, training, and optional ongoing maintenance.',
  },
]

export default function FounderPage() {
  // Person schema for SEO
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://orcaclub.pro/founder#person",
    "name": "ORCACLUB Developer",
    "jobTitle": "Full Stack Web Developer",
    "description": "Professional full stack web developer and founder of ORCACLUB, specializing in React, Next.js, Shopify, and custom business solutions.",
    "url": "https://orcaclub.pro/founder",
    "sameAs": [
      "https://orcaclub.pro"
    ],
    "worksFor": {
      "@type": "Organization",
      "@id": "https://orcaclub.pro/#organization",
      "name": "ORCACLUB",
      "url": "https://orcaclub.pro"
    },
    "knowsAbout": [
      "Web Development",
      "Full Stack Development",
      "React",
      "Next.js",
      "TypeScript",
      "Node.js",
      "Shopify Development",
      "E-commerce",
      "API Development",
      "Business Automation"
    ],
    "hasOccupation": {
      "@type": "Occupation",
      "name": "Full Stack Web Developer",
      "occupationLocation": {
        "@type": "Country",
        "name": "United States"
      },
      "skills": "React, Next.js, TypeScript, Node.js, Shopify, Stripe, MongoDB, PostgreSQL, API Development"
    }
  }

  // Breadcrumb schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://orcaclub.pro"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Founder",
        "item": "https://orcaclub.pro/founder"
      }
    ]
  }

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="min-h-screen bg-black relative overflow-hidden">
        <AnimatedBackground />

        {/* Hero Section */}
        <section className="pt-32 pb-20 px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center">
                <p className="text-cyan-400 text-sm font-medium tracking-widest uppercase mb-6">
                  Full Stack Web Developer
                </p>
                <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
                  Meet Your{" "}
                  <span className="gradient-text font-light">Web Developer</span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-8">
                  Looking to <strong className="text-white font-normal">hire a web developer</strong>?
                  I&apos;m the <strong className="text-white font-normal">full stack developer</strong> behind{" "}
                  <span className="font-bold text-white">ORCA</span>
                  <span className="font-bold gradient-text">CLUB</span>.
                  I build fast, modern websites and business tools that help companies grow.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Link
                    href="/project"
                    className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-cyan-400/30 hover:to-blue-500/30 hover:border-cyan-400/60 transition-all duration-300"
                  >
                    View Packages <ArrowRight className="w-5 h-5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
                  >
                    Start Your Project <ArrowRight size={16} className="opacity-50" />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* About Section */}
        <section className="py-20 px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="grid lg:grid-cols-2 gap-16 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                    A <span className="gradient-text font-light">Professional Web Developer</span> You Can Trust
                  </h2>
                  <p className="text-gray-400 leading-relaxed mb-6 font-light">
                    As a <strong className="text-white font-normal">freelance web developer</strong>, I&apos;ve spent years mastering the full stack.
                    From pixel-perfect frontends to robust backend systems, I handle every aspect of web development so you can focus on your business.
                  </p>
                  <p className="text-gray-400 leading-relaxed mb-6 font-light">
                    When you <strong className="text-white font-normal">hire a web developer</strong> through ORCACLUB, you get direct access to me.
                    No middlemen, no project managers who don&apos;t code. Just a <strong className="text-white font-normal">professional web developer</strong> who
                    understands your goals and delivers results fast.
                  </p>
                  <ul className="space-y-3">
                    {[
                      '50+ projects delivered successfully',
                      '3-21 day delivery timelines',
                      'Direct developer communication',
                      'Transparent fixed pricing',
                    ].map((item, index) => (
                      <li key={index} className="flex items-center gap-3 text-gray-300 font-light">
                        <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative">
                  <div className="rounded-2xl p-8 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-400/20">
                    <blockquote className="text-lg text-gray-300 italic mb-6 font-light">
                      &ldquo;I don&apos;t just write code. I solve business problems with technology.
                      Every project is an opportunity to create something that makes a real difference.&rdquo;
                    </blockquote>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                        <Code2 className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <cite className="text-white font-medium not-italic">ORCACLUB</cite>
                        <p className="text-gray-400 text-sm font-light">Full Stack Developer</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Expertise Section */}
        <section className="py-20 px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                  Full Stack <span className="gradient-text font-light">Expertise</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                  From frontend interfaces to backend infrastructure,
                  I deliver complete solutions as your dedicated <strong className="text-white font-normal">web developer</strong>.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 gap-8">
              {expertise.map((item, index) => (
                <ScrollReveal key={index} delay={index * 100}>
                  <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group">
                    <item.icon className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                    <h3 className="text-xl font-medium text-white mb-3">{item.title}</h3>
                    <p className="text-gray-400 font-light leading-relaxed">{item.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Tech Stack Section */}
        <section className="py-20 px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                  Modern <span className="gradient-text font-light">Tech Stack</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                  I use industry-leading technologies to build fast, scalable, and maintainable applications.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <div className="flex flex-wrap justify-center gap-4">
                {techStack.map((tech, index) => (
                  <div
                    key={index}
                    className="px-6 py-3 rounded-full bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/40 hover:bg-cyan-400/5 transition-all duration-300"
                  >
                    <span className="text-white font-light">{tech.name}</span>
                    <span className="text-gray-500 text-sm ml-2 font-light">/ {tech.category}</span>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </section>

        {/* Process Section */}
        <section className="py-20 px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                  How We <span className="gradient-text font-light">Work Together</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                  A streamlined process that gets your project from idea to launch quickly.
                </p>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {process.map((item, index) => (
                <ScrollReveal key={index} delay={index * 100}>
                  <div className="text-center p-6 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 flex items-center justify-center">
                      <item.icon className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="text-cyan-400 text-sm font-mono mb-2">{item.step}</div>
                    <h3 className="text-lg font-medium text-white mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-400 font-light">{item.description}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* Why Hire Me Section */}
        <section className="py-20 px-8 relative z-10">
          <div className="max-w-6xl mx-auto">
            <ScrollReveal>
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                  Why <span className="gradient-text font-light">Hire Me</span>?
                </h2>
              </div>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                { icon: Clock, title: 'Fast Delivery', desc: '3-21 days vs months with agencies' },
                { icon: MessageSquare, title: 'Direct Access', desc: 'Talk to the developer, not a manager' },
                { icon: CheckCircle, title: 'Fixed Pricing', desc: 'Know your costs upfront, no surprises' },
              ].map((benefit, index) => (
                <ScrollReveal key={index} delay={index * 100}>
                  <div className="p-8 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 text-center">
                    <benefit.icon className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                    <h3 className="text-xl font-medium text-cyan-400 mb-2">{benefit.title}</h3>
                    <p className="text-gray-300 font-light">{benefit.desc}</p>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-8 border-t border-slate-800/50 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal>
              <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
                Ready to <span className="gradient-text font-light">Hire a Web Developer</span>?
              </h2>
              <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
                Whether you need a simple website or a complex business application,
                I&apos;m here to help. Let&apos;s discuss your project and find the right solution.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link
                  href="/project"
                  className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500"
                >
                  View Packages <ArrowRight size={20} />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
                >
                  Start Your Project <ArrowRight size={16} className="opacity-50" />
                </Link>
              </div>
              <p className="text-xs text-gray-600 mt-8 font-light">
                Free consultation | Fixed pricing | 3-21 day delivery
              </p>
            </ScrollReveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 py-16 px-8 relative z-10">
          <div className="max-w-6xl mx-auto text-center">
            <div className="text-2xl tracking-tight mb-4">
              <span className="font-bold text-white">ORCA</span>
              <span className="font-bold gradient-text">CLUB</span>
            </div>
            <p className="text-gray-500 text-sm font-light">
              Full Stack Web Developer | React | Next.js | Shopify | Custom Solutions
            </p>
          </div>
        </footer>
      </div>
    </>
  )
}
