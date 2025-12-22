"use client"

import AnimatedBackground from "@/components/layout/animated-background"
import ScrollReveal from "@/components/layout/scroll-reveal"
import Link from "next/link"
import { motion, useInView } from "framer-motion"
import { useRef, useState, useEffect } from "react"
import {
  ArrowRight,
  Code2,
  Rocket,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  LineChart,
  Smartphone,
  Globe,
  Lock,
  Database,
  Layers,
  ShoppingCart,
  BarChart3,
  Mail,
  ChevronDown,
  Sparkles,
  Shield
} from "lucide-react"

export default function WebDevelopmentContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Process Timeline Section */}
      <ProcessSection />

      {/* Technology & Capabilities Section */}
      <TechnologySection />

      {/* FAQ & CTA Section */}
      <FAQSection />
    </div>
  )
}

// Hero Section with Value Proposition
function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [code, setCode] = useState('')

  const fullCode = `function YourBusiness() {
  return (
    <Website>
      <FastDelivery />
      <CustomTools />
      <ModernTech />
    </Website>
  )
}`

  useEffect(() => {
    if (isInView && code.length < fullCode.length) {
      const timeout = setTimeout(() => {
        setCode(fullCode.slice(0, code.length + 1))
      }, 30)
      return () => clearTimeout(timeout)
    }
  }, [isInView, code, fullCode])

  return (
    <section ref={ref} className="pt-32 pb-20 px-8 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Content */}
          <div>
            <ScrollReveal>
              <div className="inline-block px-4 py-2 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-sm font-medium text-cyan-400 uppercase tracking-wider mb-6">
                Custom Web Development
              </div>
            </ScrollReveal>

            <ScrollReveal delay={200}>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
                Custom Websites Built in{" "}
                <span className="gradient-text">Weeks</span>, Not Months
              </h1>
            </ScrollReveal>

            <ScrollReveal delay={400}>
              <p className="text-xl md:text-2xl text-gray-400 mb-8 leading-relaxed">
                Launch-ready websites in 2-4 weeks. Custom business tools, analytics dashboards, and seamless integrations—without sacrificing quality.
              </p>
            </ScrollReveal>

            {/* Comparison Stats */}
            <ScrollReveal delay={600}>
              <div className="grid grid-cols-2 gap-6 mb-10 max-w-md">
                <div className="bg-slate-900/60 backdrop-blur-xl border border-red-400/20 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-2">Traditional Agency</div>
                  <div className="text-3xl font-bold text-red-400">3-6 mo</div>
                </div>
                <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-400/30 rounded-lg p-4 relative overflow-hidden">
                  <div className="absolute top-2 right-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-sm text-gray-400 mb-2">OrcaClub</div>
                  <div className="text-3xl font-bold text-cyan-400">2-4 wk</div>
                </div>
              </div>
            </ScrollReveal>

            {/* Key Benefits */}
            <ScrollReveal delay={800}>
              <div className="space-y-3 mb-10">
                {[
                  'Modern tech stack (React, Next.js, TypeScript)',
                  'Custom business tools & dashboards',
                  'CRM and software integrations',
                  'Mobile-responsive & SEO-optimized'
                ].map((benefit, i) => (
                  <motion.div
                    key={benefit}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: 0.9 + i * 0.1 }}
                  >
                    <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </ScrollReveal>

            {/* CTAs */}
            <ScrollReveal delay={1200}>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-medium text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
                >
                  Start Your Project <ArrowRight size={20} />
                </Link>
                <Link
                  href="/portfolio"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-medium text-gray-300 hover:text-white transition-colors magnetic"
                >
                  View Our Work <ArrowRight size={16} className="opacity-50" />
                </Link>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Code Editor Mockup */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, rotateY: 15 }}
            animate={isInView ? { opacity: 1, rotateY: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="relative bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-xl shadow-2xl shadow-cyan-400/10 overflow-hidden">
              {/* Editor Header */}
              <div className="bg-slate-800/80 px-4 py-3 flex items-center gap-2 border-b border-slate-700/50">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="flex-1 ml-4 text-xs text-gray-400">
                  your-business.tsx
                </div>
              </div>

              {/* Code Content */}
              <div className="bg-[#1e1e1e] p-6 font-mono text-sm">
                <pre className="text-gray-300">
                  <code>
                    {code.split('\n').map((line, i) => (
                      <div key={i} className="flex">
                        <span className="text-gray-600 mr-4 select-none w-4 text-right">{i + 1}</span>
                        <span className={
                          line.includes('function') ? 'text-blue-400' :
                          line.includes('return') ? 'text-purple-400' :
                          line.includes('Website') || line.includes('Fast') || line.includes('Custom') || line.includes('Modern') ? 'text-cyan-400' :
                          'text-gray-300'
                        }>
                          {line}
                        </span>
                        {i === code.split('\n').length - 1 && code.length < fullCode.length && (
                          <span className="inline-block w-1.5 h-4 bg-cyan-400 animate-pulse ml-0.5" />
                        )}
                      </div>
                    ))}
                  </code>
                </pre>
              </div>
            </div>

            {/* Floating Tech Badges */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              {[
                { name: 'React', color: 'from-blue-400 to-blue-600' },
                { name: 'Next.js', color: 'from-slate-600 to-slate-800' },
                { name: 'TypeScript', color: 'from-blue-500 to-blue-700' },
                { name: 'Tailwind', color: 'from-cyan-400 to-cyan-600' }
              ].map((tech, i) => (
                <motion.div
                  key={tech.name}
                  className={`px-4 py-2 rounded-lg bg-gradient-to-r ${tech.color} text-white text-sm font-medium shadow-lg`}
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={isInView ? { opacity: 1, scale: 1, y: 0 } : {}}
                  transition={{ delay: 1.4 + i * 0.1 }}
                  whileHover={{ scale: 1.05, y: -2 }}
                >
                  {tech.name}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// Process Timeline Section
function ProcessSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const weeks = [
    {
      week: 'Week 1',
      title: 'Discovery & Design',
      description: 'We dive deep into your business needs, map out user flows, and create wireframes. You approve the design direction before we write a single line of code.',
      icon: Users,
      color: 'cyan'
    },
    {
      week: 'Week 2',
      title: 'Development & Integration',
      description: 'Our team builds your website with modern frameworks and integrates it with your CRM, analytics tools, and payment systems. Daily progress updates keep you in the loop.',
      icon: Code2,
      color: 'blue'
    },
    {
      week: 'Week 3',
      title: 'Testing & Refinement',
      description: 'Rigorous testing across devices and browsers. We fix bugs, optimize performance, and ensure everything works perfectly. You get a staging site to review.',
      icon: CheckCircle2,
      color: 'indigo'
    },
    {
      week: 'Week 4',
      title: 'Launch & Training',
      description: 'We deploy to production, set up monitoring, and train your team on managing content. Post-launch support ensures a smooth transition.',
      icon: Rocket,
      color: 'purple'
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Our <span className="gradient-text">4-Week Process</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Transparent, collaborative, and fast. Here's exactly how we'll bring your website to life.
            </p>
          </div>
        </ScrollReveal>

        {/* Timeline */}
        <div className="relative">
          {/* Connecting Line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-400 via-blue-500 to-purple-500" />

          {/* Week Cards */}
          <div className="space-y-16">
            {weeks.map((item, i) => {
              const isEven = i % 2 === 0
              const colorMap = {
                cyan: 'border-cyan-400/30 bg-cyan-400/5',
                blue: 'border-blue-400/30 bg-blue-400/5',
                indigo: 'border-indigo-400/30 bg-indigo-400/5',
                purple: 'border-purple-400/30 bg-purple-400/5'
              }

              return (
                <motion.div
                  key={item.week}
                  className={`flex flex-col md:flex-row items-center gap-8 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.2 }}
                >
                  {/* Content Card */}
                  <div className={`flex-1 ${isEven ? 'md:text-right' : 'md:text-left'}`}>
                    <div className={`inline-block bg-slate-900/60 backdrop-blur-xl border ${colorMap[item.color as keyof typeof colorMap]} rounded-xl p-6 md:p-8`}>
                      <div className={`flex items-center gap-3 mb-4 ${isEven ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                        <div className={`p-3 rounded-lg bg-${item.color}-400/10`}>
                          <item.icon className={`w-6 h-6 text-${item.color}-400`} />
                        </div>
                        <div>
                          <div className="text-sm text-gray-400 uppercase tracking-wider">{item.week}</div>
                          <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-300 leading-relaxed">{item.description}</p>
                    </div>
                  </div>

                  {/* Timeline Node */}
                  <div className="relative flex-shrink-0 hidden md:block">
                    <div className={`w-4 h-4 rounded-full bg-${item.color}-400 border-4 border-black shadow-lg shadow-${item.color}-400/50`} />
                  </div>

                  {/* Spacer */}
                  <div className="flex-1 hidden md:block" />
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Timeline Footer */}
        <ScrollReveal delay={1000}>
          <div className="mt-20 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/60 backdrop-blur-xl border border-cyan-400/20 rounded-full">
              <Clock className="w-5 h-5 text-cyan-400" />
              <span className="text-gray-300">Average Project: 2-4 Weeks from Kickoff to Launch</span>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Technology & Capabilities Section
function TechnologySection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const technologies = [
    {
      name: 'React & Next.js',
      description: 'Lightning-fast, SEO-friendly websites that rank on Google and delight users',
      icon: Code2,
      color: 'cyan'
    },
    {
      name: 'TypeScript',
      description: 'Rock-solid code with fewer bugs and easier maintenance as your business grows',
      icon: Shield,
      color: 'blue'
    },
    {
      name: 'Responsive Design',
      description: 'Perfect experience on every device—mobile, tablet, and desktop',
      icon: Smartphone,
      color: 'indigo'
    },
    {
      name: 'Performance Optimized',
      description: 'Sub-2 second load times. Fast sites convert better and rank higher',
      icon: Zap,
      color: 'purple'
    }
  ]

  const integrations = [
    { name: 'Stripe', description: 'Payment processing', icon: ShoppingCart },
    { name: 'HubSpot', description: 'CRM & marketing', icon: Users },
    { name: 'Google Analytics', description: 'Traffic insights', icon: BarChart3 },
    { name: 'Salesforce', description: 'Sales automation', icon: Database },
    { name: 'Mailchimp', description: 'Email marketing', icon: Mail },
    { name: 'Custom APIs', description: 'Any integration', icon: Layers }
  ]

  const capabilities = [
    {
      title: 'Custom Business Tools',
      description: 'Internal dashboards, calculators, booking systems, and workflow automation tools tailored to your operations',
      icon: Layers
    },
    {
      title: 'Analytics Dashboards',
      description: 'Real-time data visualization for your key metrics. Make informed decisions with custom reporting',
      icon: LineChart
    },
    {
      title: 'E-commerce Solutions',
      description: 'Full-featured online stores with inventory management, payment processing, and order tracking',
      icon: ShoppingCart
    },
    {
      title: 'Secure & Scalable',
      description: 'Enterprise-grade security, SSL certificates, and infrastructure that grows with your business',
      icon: Lock
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-7xl mx-auto">
        {/* Tech Stack */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Built with <span className="gradient-text">Modern Technology</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We use cutting-edge frameworks that deliver speed, security, and scalability
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-32">
          {technologies.map((tech, i) => (
            <motion.div
              key={tech.name}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 hover:border-cyan-400/30 transition-all duration-300 group"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <tech.icon className={`w-10 h-10 text-${tech.color}-400 mb-4 group-hover:scale-110 transition-transform`} />
              <h3 className="text-xl font-bold text-white mb-3">{tech.name}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{tech.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Capabilities */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              What We <span className="gradient-text">Build</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              From simple marketing sites to complex business applications
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8 mb-32">
          {capabilities.map((cap, i) => (
            <motion.div
              key={cap.title}
              className="flex gap-4 bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-8 hover:border-cyan-400/30 transition-all duration-300"
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="flex-shrink-0">
                <div className="p-3 rounded-lg bg-cyan-400/10">
                  <cap.icon className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-3">{cap.title}</h3>
                <p className="text-gray-400 leading-relaxed">{cap.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Integrations */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              <span className="gradient-text">Seamless Integrations</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Connect with the tools you already use. We integrate with virtually any platform
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {integrations.map((integration, i) => (
            <motion.div
              key={integration.name}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 text-center hover:border-cyan-400/30 transition-all duration-300 group"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1 + i * 0.05 }}
              whileHover={{ scale: 1.05 }}
            >
              <integration.icon className="w-8 h-8 text-gray-400 mx-auto mb-3 group-hover:text-cyan-400 transition-colors" />
              <div className="text-sm font-medium text-white mb-1">{integration.name}</div>
              <div className="text-xs text-gray-500">{integration.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ & CTA Section
function FAQSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'How much does a custom website cost?',
      answer: 'Projects typically range from $5,000 to $25,000 depending on complexity. Simple marketing sites start around $5K, while custom business tools with integrations can go higher. We provide a detailed quote after understanding your needs in a free consultation.'
    },
    {
      question: 'What information do you need to get started?',
      answer: 'We\'ll need to understand your business goals, target audience, desired features, and any existing systems we need to integrate with. During our discovery call, we\'ll walk through everything and provide a clear project scope and timeline.'
    },
    {
      question: 'Can you work with our existing brand guidelines?',
      answer: 'Absolutely. We can match your existing brand colors, fonts, and style guide perfectly. If you don\'t have brand guidelines yet, we can help create a cohesive design system for your website.'
    },
    {
      question: 'Do you provide hosting and maintenance?',
      answer: 'Yes. We can handle hosting setup and provide ongoing maintenance packages. Alternatively, we can deploy to your preferred hosting provider. All our sites are built with modern deployment practices for easy updates.'
    },
    {
      question: 'What makes you different from other web development agencies?',
      answer: 'Three things: speed (2-4 weeks vs 3-6 months), modern technology (React/Next.js for better performance and SEO), and transparency (daily updates and clear communication). We\'re developers who actually ship, not project managers who delegate.'
    },
    {
      question: 'Can you help with SEO and digital marketing after launch?',
      answer: 'Yes! We offer SEO services and digital marketing campaign management. Every website we build is SEO-optimized from day one, and we can help you drive traffic and conversions after launch.'
    }
  ]

  return (
    <section ref={ref} className="py-32 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-5xl mx-auto">
        {/* FAQ */}
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Everything you need to know about working with us
            </p>
          </div>
        </ScrollReveal>

        <div className="space-y-4 mb-32">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i

            return (
              <motion.div
                key={i}
                className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-400/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-slate-800/30 transition-colors"
                >
                  <span className="text-lg font-semibold text-white pr-8">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-cyan-400 flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-8 pb-6 text-gray-400 leading-relaxed">
                    {faq.answer}
                  </div>
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Final CTA */}
        <ScrollReveal>
          <div className="text-center bg-gradient-to-r from-blue-600/10 to-cyan-500/10 border border-cyan-400/20 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Launch Your <span className="gradient-text">Custom Website</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Let's discuss your project. Free consultation, transparent pricing, and a clear roadmap to launch.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-lg font-semibold text-white hover:shadow-2xl hover:shadow-cyan-400/20 transition-all duration-500 magnetic"
              >
                Get Your Free Consultation <ArrowRight size={20} />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 border border-cyan-400/30 rounded-full text-lg font-medium text-cyan-400 hover:bg-cyan-400/10 transition-all duration-300 magnetic"
              >
                View Portfolio <Globe size={18} />
              </Link>
            </div>
            <p className="text-sm text-gray-500">
              No commitment required • Response within 24 hours • Projects starting at $5,000
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
