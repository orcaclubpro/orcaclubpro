'use client'

import Link from "next/link"
import {
  ArrowRight,
  Server,
  Shield,
  Zap,
  Globe,
  Lock,
  RefreshCw,
  Cloud,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronDown,
  Database,
  Activity,
  Image,
  Code,
  Layers,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  HardDrive,
  Network,
  FileCode,
  Eye
} from "lucide-react"
import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import { useState } from "react"

// Hosting stack features
const hostingStack = [
  {
    icon: Globe,
    title: "Edge Deployment",
    description: "Your website is deployed to Vercel's global edge network, serving content from the data center closest to each visitor. This means lightning-fast load times whether your customers are in New York, London, or Tokyo.",
    tech: "Vercel Edge Network"
  },
  {
    icon: Network,
    title: "Global CDN",
    description: "Content is cached and delivered through Cloudflare's CDN with over 300 points of presence worldwide. Static assets, images, and pages load instantly from edge locations near your users.",
    tech: "Cloudflare CDN"
  },
  {
    icon: Lock,
    title: "Automatic SSL",
    description: "Every website gets a free SSL certificate automatically provisioned and renewed. Modern TLS 1.3 encryption protects all data in transit. Your visitors see the secure padlock, Google sees a trusted site.",
    tech: "Let's Encrypt + TLS 1.3"
  },
  {
    icon: ShieldCheck,
    title: "DDoS Protection",
    description: "Enterprise-grade DDoS mitigation handles millions of malicious requests per second without affecting your legitimate traffic. Your site stays online even under attack.",
    tech: "Cloudflare Shield"
  },
  {
    icon: Database,
    title: "Automated Backups",
    description: "Your website is automatically backed up daily with 30-day retention. Every deployment creates a snapshot you can instantly roll back to. Never lose your work.",
    tech: "Continuous Deployment"
  },
  {
    icon: Activity,
    title: "99.9% Uptime",
    description: "Our infrastructure is built on platforms with proven 99.99% uptime. Real-time monitoring detects issues in seconds, and automatic failover keeps your site running.",
    tech: "Uptime Guarantee"
  }
]

// Security features
const securityFeatures = [
  {
    icon: Lock,
    title: "SSL/TLS Encryption",
    description: "All traffic encrypted with modern TLS 1.3. Automatic certificate provisioning and renewal. HTTPS everywhere, no configuration needed."
  },
  {
    icon: Shield,
    title: "Web Application Firewall",
    description: "Protection against SQL injection, XSS, and OWASP Top 10 vulnerabilities. Malicious requests blocked before they reach your application."
  },
  {
    icon: RefreshCw,
    title: "Security Updates",
    description: "Automatic security patches for dependencies and frameworks. We monitor for vulnerabilities and update proactively."
  },
  {
    icon: Eye,
    title: "Malware Scanning",
    description: "Continuous scanning for malicious code and suspicious activity. Instant alerts and remediation if threats are detected."
  },
  {
    icon: FileCode,
    title: "Secure Headers",
    description: "Properly configured security headers including CSP, HSTS, X-Frame-Options, and more. Defense in depth against common attacks."
  },
  {
    icon: ShieldAlert,
    title: "Bot Protection",
    description: "Intelligent bot detection blocks scrapers, credential stuffers, and automated attacks while allowing legitimate search engine crawlers."
  }
]

// Performance features
const performanceFeatures = [
  {
    icon: Globe,
    title: "Global CDN",
    description: "Content served from 300+ edge locations worldwide. Your visitors always connect to the closest server."
  },
  {
    icon: Layers,
    title: "Edge Caching",
    description: "Intelligent caching at the edge reduces server load and delivers content in milliseconds."
  },
  {
    icon: Image,
    title: "Image Optimization",
    description: "Automatic image compression, WebP conversion, and responsive sizing. Faster loads, less bandwidth."
  },
  {
    icon: Code,
    title: "Code Minification",
    description: "JavaScript, CSS, and HTML automatically minified and compressed. Smaller files, faster transfers."
  },
  {
    icon: Zap,
    title: "Lazy Loading",
    description: "Images and components load only when needed. Faster initial page loads, better Core Web Vitals."
  },
  {
    icon: Gauge,
    title: "Performance Monitoring",
    description: "Real-time performance metrics and alerts. We proactively optimize before issues affect users."
  }
]

// Problems with bad hosting
const hostingProblems = [
  {
    icon: Clock,
    problem: "Slow Load Times",
    description: "Shared hosting means your site competes for resources with hundreds of others. When traffic spikes, everyone suffers."
  },
  {
    icon: ShieldAlert,
    problem: "Security Vulnerabilities",
    description: "Outdated servers, missing patches, and weak configurations leave your site exposed to hackers and malware."
  },
  {
    icon: AlertTriangle,
    problem: "Frequent Downtime",
    description: "Cheap hosting providers oversell capacity. When one site has issues, it takes down neighbors. No redundancy means no reliability."
  },
  {
    icon: HardDrive,
    problem: "No Real Support",
    description: "Generic support tickets, offshore call centers, and canned responses. When your site is down, you need someone who actually knows your setup."
  }
]

// Comparison data
const comparisonData = [
  {
    feature: "SSL Certificate",
    orcaclub: "Included (Automatic)",
    diy: "Manual Setup Required",
    shared: "Often Extra Cost"
  },
  {
    feature: "CDN",
    orcaclub: "Global Edge Network",
    diy: "Self-Configure",
    shared: "Not Included"
  },
  {
    feature: "DDoS Protection",
    orcaclub: "Enterprise-Grade",
    diy: "Additional Service",
    shared: "Basic or None"
  },
  {
    feature: "Backups",
    orcaclub: "Daily + Instant Rollback",
    diy: "Self-Managed",
    shared: "Weekly (Maybe)"
  },
  {
    feature: "Uptime SLA",
    orcaclub: "99.9% Guaranteed",
    diy: "Depends on Setup",
    shared: "99% (Often Missed)"
  },
  {
    feature: "Support",
    orcaclub: "Direct Developer Access",
    diy: "Self-Reliant",
    shared: "Ticket Queue"
  },
  {
    feature: "Performance",
    orcaclub: "Edge Optimized",
    diy: "Varies",
    shared: "Resource Contention"
  },
  {
    feature: "Security Updates",
    orcaclub: "Automatic",
    diy: "Manual",
    shared: "Infrequent"
  }
]

// Tiers showing hosting is included
const tiers = [
  {
    name: "LAUNCH",
    price: "$1K-3K",
    timeline: "3-5 days",
    hostingIncluded: [
      "Edge Deployment",
      "Automatic SSL",
      "Global CDN",
      "Daily Backups",
      "99.9% Uptime"
    ],
    color: "cyan"
  },
  {
    name: "SCALE",
    price: "$3K-5K",
    timeline: "7-10 days",
    hostingIncluded: [
      "Everything in Launch",
      "DDoS Protection",
      "WAF Security",
      "Performance Monitoring",
      "Priority Support"
    ],
    color: "blue",
    highlighted: true
  },
  {
    name: "ENTERPRISE",
    price: "$6K-30K",
    timeline: "14-21 days",
    hostingIncluded: [
      "Everything in Scale",
      "Multi-Region Deploy",
      "Custom CDN Rules",
      "Advanced Analytics",
      "Dedicated Support"
    ],
    color: "indigo"
  }
]

// FAQs
const faqs = [
  {
    question: "Is hosting really included with all packages?",
    answer: "Yes! Enterprise-grade hosting is included with every project tier (Launch, Scale, and Enterprise). You get SSL certificates, CDN, DDoS protection, automated backups, and 99.9% uptime guarantee at no additional cost. No separate hosting fees, ever."
  },
  {
    question: "What is your uptime guarantee?",
    answer: "We guarantee 99.9% uptime for all hosted websites. Our infrastructure is built on Vercel and Cloudflare's global edge networks, which have a proven track record of reliability. If we ever fail to meet this guarantee, you'll receive service credits."
  },
  {
    question: "Can you migrate my existing website?",
    answer: "Absolutely. We handle complete website migrations including DNS transfers, content migration, email setup, and SSL configuration. Most migrations are completed within 24-48 hours with zero downtime using our staging and DNS propagation strategy."
  },
  {
    question: "What happens if my website goes down?",
    answer: "Our monitoring systems detect issues within seconds and automatically attempt recovery. For critical issues, our team is notified immediately. With maintenance packages, you get priority support with response times as fast as 30 minutes for critical issues."
  },
  {
    question: "Do I get backups of my website?",
    answer: "Yes. All websites include automated daily backups with 30-day retention. You can request a restore at any time, and we can roll back to any previous version within minutes. Enterprise tier includes continuous deployment with instant rollback capabilities."
  },
  {
    question: "How fast will my website load?",
    answer: "Our hosting infrastructure is optimized for sub-2-second load times globally. We achieve this through edge deployment (serving from the closest data center to each visitor), aggressive caching, image optimization, code minification, and lazy loading. Most of our sites achieve 90+ PageSpeed scores."
  }
]

// Related services
const relatedServices = [
  { name: "Web Design", href: "/services/web-development", description: "Custom website design and development" },
  { name: "CMS Development", href: "/services/web-development", description: "Headless CMS implementation" },
  { name: "Technical SEO", href: "/services/seo-services", description: "Search engine optimization" }
]

export default function HostingContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-cyan-400 text-sm mb-8">
              <Server className="w-4 h-4" />
              Included With Every Project
            </div>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
              Hosting That <span className="gradient-text font-light">Just Works</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-4">
              Enterprise-grade <strong className="text-white font-normal">web hosting</strong> with SSL,
              CDN, and security—<strong className="text-cyan-400 font-normal">included free</strong> with
              every project. No separate hosting fees, ever.
            </p>
            <p className="text-lg text-gray-500 max-w-3xl mx-auto font-light mb-8">
              We handle the infrastructure so you can focus on your business.
              Vercel edge deployment, Cloudflare CDN, automatic SSL, and 99.9% uptime guarantee.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/project"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:from-cyan-400/30 hover:to-blue-500/30 transition-all duration-300"
              >
                Get Hosting Included <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
              >
                Have Questions? <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                The <span className="text-red-400 font-light">Hosting Nightmare</span> You Know Too Well
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                Bad hosting costs you customers, rankings, and peace of mind.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {hostingProblems.map((item, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-6 rounded-2xl bg-red-500/5 border border-red-400/20 backdrop-blur-xl h-full">
                  <item.icon className="w-10 h-10 text-red-400 mb-4" />
                  <h3 className="text-lg font-medium text-red-400 mb-2">{item.problem}</h3>
                  <p className="text-gray-400 font-light text-sm leading-relaxed">{item.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Our Hosting Stack */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Our <span className="gradient-text font-light">Hosting Stack</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                Enterprise-grade infrastructure that powers the fastest websites on the internet.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {hostingStack.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group h-full">
                  <feature.icon className="w-10 h-10 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-cyan-400/70 font-mono mb-2">{feature.tech}</div>
                  <h3 className="text-xl font-medium text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400 font-light leading-relaxed text-sm">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                <span className="gradient-text font-light">Security</span> Built In
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                Defense in depth. Multiple layers of protection for your website and your customers.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityFeatures.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-6 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group h-full">
                  <feature.icon className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 font-light text-sm leading-relaxed">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Performance Features */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                <span className="gradient-text font-light">Performance</span> Optimized
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                Sub-2-second load times globally. Fast sites rank higher and convert better.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceFeatures.map((feature, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className="p-6 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group h-full">
                  <feature.icon className="w-8 h-8 text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                  <p className="text-gray-400 font-light text-sm leading-relaxed">{feature.description}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          {/* Performance Stats */}
          <ScrollReveal delay={400}>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { stat: "< 2s", label: "Global Load Time" },
                { stat: "300+", label: "Edge Locations" },
                { stat: "99.9%", label: "Uptime SLA" },
                { stat: "90+", label: "PageSpeed Score" }
              ].map((item, index) => (
                <div key={index} className="text-center p-6 rounded-xl bg-gradient-to-br from-cyan-400/5 to-blue-500/5 border border-cyan-400/20">
                  <div className="text-3xl font-bold text-cyan-400 mb-2">{item.stat}</div>
                  <div className="text-sm text-gray-400 font-light">{item.label}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Included with All Tiers */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-400/10 border border-green-400/20 rounded-full text-green-400 text-sm mb-6">
                <CheckCircle className="w-4 h-4" />
                No Additional Cost
              </div>
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Hosting <span className="gradient-text font-light">Included</span> with Every Tier
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                Enterprise-grade infrastructure is part of every package. Not an upsell. Not an add-on.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {tiers.map((tier, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <div className={`p-8 rounded-2xl backdrop-blur-xl transition-all duration-300 h-full ${
                  tier.highlighted
                    ? 'bg-gradient-to-br from-cyan-400/10 to-blue-500/10 border-2 border-cyan-400/50'
                    : 'bg-black/40 border border-white/10 hover:border-cyan-400/30'
                }`}>
                  {tier.highlighted && (
                    <div className="text-xs font-bold text-cyan-400 mb-4 uppercase tracking-wider">Most Popular</div>
                  )}
                  <h3 className={`text-2xl font-bold mb-2 ${tier.highlighted ? 'gradient-text' : 'text-white'}`}>
                    {tier.name}
                  </h3>
                  <div className="text-3xl font-extralight text-white mb-1">{tier.price}</div>
                  <div className="text-sm text-gray-400 mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    {tier.timeline}
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-4">Hosting Included:</div>
                    <ul className="space-y-3">
                      {tier.hostingIncluded.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-300 font-light">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={400}>
            <div className="mt-12 text-center">
              <Link
                href="/project"
                className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500"
              >
                View All Packages <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                How We <span className="gradient-text font-light">Compare</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                ORCACLUB managed hosting vs DIY hosting vs cheap shared hosting.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 text-gray-400 font-light">Feature</th>
                    <th className="text-center py-4 px-4">
                      <div className="text-cyan-400 font-bold">ORCACLUB</div>
                      <div className="text-xs text-gray-500 font-light">Managed</div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="text-gray-300 font-medium">DIY</div>
                      <div className="text-xs text-gray-500 font-light">Self-Hosted</div>
                    </th>
                    <th className="text-center py-4 px-4">
                      <div className="text-gray-300 font-medium">Shared</div>
                      <div className="text-xs text-gray-500 font-light">Budget Hosting</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 text-gray-300 font-light">{row.feature}</td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-cyan-400 font-medium">{row.orcaclub}</span>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-400 font-light">{row.diy}</td>
                      <td className="py-4 px-4 text-center text-gray-500 font-light">{row.shared}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Frequently Asked <span className="gradient-text font-light">Questions</span>
              </h2>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-2xl overflow-hidden">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index
                return (
                  <div key={index} className="border-b border-white/10 last:border-0">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full py-6 px-8 flex items-center justify-between text-left group hover:bg-white/5 transition-colors"
                    >
                      <span className="text-lg font-medium text-white group-hover:text-cyan-400 transition-colors pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown className={`w-5 h-5 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96' : 'max-h-0'}`}
                    >
                      <div className="px-8 pb-6 text-gray-300 font-light leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Related Services */}
      <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Related <span className="gradient-text font-light">Services</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-6">
            {relatedServices.map((service, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <Link
                  href={service.href}
                  className="block p-6 rounded-xl bg-black/20 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 hover:bg-black/40 transition-all duration-300 group"
                >
                  <h3 className="text-lg font-medium text-white mb-2 group-hover:text-cyan-400 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-400 font-light mb-3">{service.description}</p>
                  <span className="text-cyan-400 text-sm font-light flex items-center gap-2">
                    Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
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
              Get <span className="gradient-text font-light">Hosting Included</span>
              <br />with Your Website
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
              Stop paying separately for hosting, SSL, and security.
              Get enterprise-grade infrastructure included with every project.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/project"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500"
              >
                View Packages <ArrowRight size={20} />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
              >
                Questions? Let&apos;s Talk <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
            <p className="text-xs text-gray-600 mt-8 font-light">
              Free consultation | Hosting included | 99.9% uptime guarantee
            </p>
          </ScrollReveal>
        </div>
      </section>
    </div>
  )
}
