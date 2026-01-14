'use client'

import { motion, useInView } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Target,
  TrendingUp,
  BarChart3,
  Zap,
  CheckCircle2,
  ArrowRight,
  Users,
  LineChart,
  ShoppingCart,
  Clock,
  Shield,
  ChevronRight,
  Link2,
  AlertTriangle,
  DollarSign,
  Eye,
  Settings,
  RefreshCw,
  Database,
  Share2,
  Layers,
  ChevronDown,
  Search,
  Briefcase,
  Music,
  Camera,
  MessageCircle
} from 'lucide-react'
import AnimatedBackground from '@/components/layout/animated-background'
import ScrollReveal from '@/components/layout/scroll-reveal'

export default function MarketingIntegrationContent() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section */}
      <ProblemSection />

      {/* Google Ads Integration */}
      <GoogleAdsSection />

      {/* Meta Integration */}
      <MetaSection />

      {/* LinkedIn Integration */}
      <LinkedInSection />

      {/* TikTok Integration */}
      <TikTokSection />

      {/* Other Platforms */}
      <OtherPlatformsSection />

      {/* Conversion Tracking Section */}
      <ConversionTrackingSection />

      {/* Attribution & Reporting */}
      <AttributionSection />

      {/* Process Section */}
      <ProcessSection />

      {/* Remarketing Section */}
      <RemarketingSection />

      {/* FAQ Section */}
      <FAQSection />

      {/* Related Services */}
      <RelatedServicesSection />

      {/* Final CTA */}
      <FinalCTASection />
    </div>
  )
}

// Hero Section
function HeroSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })
  const [platforms, setPlatforms] = useState(0)
  const [accuracy, setAccuracy] = useState(0)
  const [adSpend, setAdSpend] = useState(0)

  useEffect(() => {
    if (isInView) {
      const platformsInterval = setInterval(() => {
        setPlatforms(prev => {
          if (prev >= 12) {
            clearInterval(platformsInterval)
            return 12
          }
          return prev + 1
        })
      }, 80)

      const accuracyInterval = setInterval(() => {
        setAccuracy(prev => {
          if (prev >= 95) {
            clearInterval(accuracyInterval)
            return 95
          }
          return Math.min(prev + 3, 95)
        })
      }, 40)

      const adSpendInterval = setInterval(() => {
        setAdSpend(prev => {
          if (prev >= 40) {
            clearInterval(adSpendInterval)
            return 40
          }
          return Math.min(prev + 1, 40)
        })
      }, 50)

      return () => {
        clearInterval(platformsInterval)
        clearInterval(accuracyInterval)
        clearInterval(adSpendInterval)
      }
    }
  }, [isInView])

  return (
    <section ref={ref} className="pt-32 pb-20 px-8 relative z-10">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1.5 bg-cyan-400/10 border border-cyan-400/20 rounded-full text-xs font-medium text-cyan-400 uppercase tracking-wider mb-6">
              Marketing Integration Services
            </span>

            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
              Connect Your <span className="gradient-text font-light">Marketing Stack</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-12">
              Unified marketing data for better decisions. <strong className="text-white font-normal">Google Ads</strong>,{' '}
              <strong className="text-white font-normal">Meta Pixel</strong>, <strong className="text-white font-normal">LinkedIn</strong>,{' '}
              <strong className="text-white font-normal">TikTok</strong>, and more - properly integrated for accurate{' '}
              <strong className="text-white font-normal">conversion tracking</strong> and optimization.
            </p>
          </div>
        </ScrollReveal>

        {/* Metrics Dashboard */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="bg-black/40 backdrop-blur-xl border border-cyan-400/20 rounded-xl p-8 hover:border-cyan-400/40 transition-colors"
            whileHover={{ y: -4 }}
          >
            <Link2 className="w-10 h-10 text-cyan-400 mb-4" />
            <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Platforms Integrated</div>
            <div className="text-5xl font-bold text-white mb-2">
              {platforms}<span className="text-3xl text-cyan-400">+</span>
            </div>
            <div className="text-sm text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Major ad networks
            </div>
          </motion.div>

          <motion.div
            className="bg-black/40 backdrop-blur-xl border border-blue-400/20 rounded-xl p-8 hover:border-blue-400/40 transition-colors"
            whileHover={{ y: -4 }}
            transition={{ delay: 0.1 }}
          >
            <Target className="w-10 h-10 text-blue-400 mb-4" />
            <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Tracking Accuracy</div>
            <div className="text-5xl font-bold text-white mb-2">
              {accuracy}<span className="text-3xl text-blue-400">%</span>
            </div>
            <div className="text-sm text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              With server-side tracking
            </div>
          </motion.div>

          <motion.div
            className="bg-black/40 backdrop-blur-xl border border-emerald-400/20 rounded-xl p-8 hover:border-emerald-400/40 transition-colors"
            whileHover={{ y: -4 }}
            transition={{ delay: 0.2 }}
          >
            <DollarSign className="w-10 h-10 text-emerald-400 mb-4" />
            <div className="text-sm text-gray-400 uppercase tracking-wide mb-2">Avg. Ad Spend Saved</div>
            <div className="text-5xl font-bold text-white mb-2">
              {adSpend}<span className="text-3xl text-emerald-400">%</span>
            </div>
            <div className="text-sm text-emerald-400 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" />
              Through optimization
            </div>
          </motion.div>
        </motion.div>

        {/* CTA */}
        <ScrollReveal delay={600}>
          <div className="text-center">
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 px-10 py-5 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/40 rounded-full text-lg font-medium text-cyan-400 hover:from-cyan-400/30 hover:to-blue-500/30 transition-all duration-300 group"
            >
              Get Your Integration Audit
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="text-xs text-gray-500 mt-4">Free audit | No commitment | Actionable insights</p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Problem Section
function ProblemSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const problems = [
    {
      icon: AlertTriangle,
      title: 'Disconnected Marketing Tools',
      description: 'Your CRM, ad platforms, and analytics don\'t talk to each other. Data silos prevent you from seeing the full customer journey.',
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      borderColor: 'border-red-400/30'
    },
    {
      icon: Eye,
      title: 'Can\'t Track Ad Performance',
      description: 'iOS 14+ privacy changes and ad blockers have broken your tracking. You\'re making decisions on incomplete data.',
      color: 'text-orange-400',
      bgColor: 'bg-orange-400/10',
      borderColor: 'border-orange-400/30'
    },
    {
      icon: DollarSign,
      title: 'Wasted Ad Spend',
      description: 'Without proper conversion tracking, you can\'t optimize campaigns. Money goes to underperforming ads while winners are underfunded.',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/30'
    },
    {
      icon: BarChart3,
      title: 'No Attribution Clarity',
      description: 'Which channel drove that sale? Multi-touch attribution is impossible when your platforms aren\'t connected.',
      color: 'text-purple-400',
      bgColor: 'bg-purple-400/10',
      borderColor: 'border-purple-400/30'
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Is Your <span className="gradient-text font-light">Marketing Data</span> Working Against You?
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Most businesses lose money because their marketing platforms are not properly connected.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {problems.map((problem, i) => (
            <motion.div
              key={problem.title}
              className={`p-8 rounded-2xl bg-black/40 border ${problem.borderColor} backdrop-blur-xl hover:bg-black/60 transition-all duration-300`}
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 * i }}
            >
              <div className={`w-12 h-12 rounded-xl ${problem.bgColor} flex items-center justify-center mb-4`}>
                <problem.icon className={`w-6 h-6 ${problem.color}`} />
              </div>
              <h3 className="text-xl font-medium text-white mb-3">{problem.title}</h3>
              <p className="text-gray-400 font-light leading-relaxed">{problem.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Google Ads Section
function GoogleAdsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const features = [
    {
      title: 'Google Ads Conversion Tracking',
      description: 'Set up precise conversion tracking that captures form submissions, phone calls, purchases, and custom events specific to your business goals.'
    },
    {
      title: 'Enhanced Conversions',
      description: 'Implement Google\'s Enhanced Conversions to recover conversions lost to cookie restrictions by securely hashing and sending first-party customer data.'
    },
    {
      title: 'Remarketing Tags',
      description: 'Build powerful remarketing audiences based on website behavior, cart abandonment, content viewed, and custom segments for targeted campaigns.'
    },
    {
      title: 'Offline Conversion Imports',
      description: 'Connect your CRM to import offline conversions (phone sales, in-store visits) back to Google Ads for complete ROI measurement.'
    },
    {
      title: 'Google Ads & GA4 Linking',
      description: 'Seamless integration between Google Ads and Google Analytics 4 for unified reporting, audience sharing, and cross-platform attribution.'
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Search className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extralight tracking-tight">
                <span className="gradient-text font-light">Google Ads</span> Integration
              </h2>
              <p className="text-gray-400 font-light">Complete Google Ads management and tracking setup</p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 100}>
              <div className="p-6 rounded-xl bg-black/40 border border-blue-400/20 backdrop-blur-xl hover:border-blue-400/40 transition-all duration-300 h-full">
                <CheckCircle2 className="w-6 h-6 text-blue-400 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={600}>
          <div className="mt-8 p-6 rounded-xl bg-blue-400/5 border border-blue-400/20">
            <div className="flex items-start gap-4">
              <TrendingUp className="w-6 h-6 text-blue-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-medium text-white mb-2">Why Google Ads Integration Matters</h4>
                <p className="text-gray-400 font-light leading-relaxed">
                  Proper Google Ads integration typically improves ROAS by 30-50% through better bid optimization,
                  accurate conversion attribution, and the ability to target high-value audiences. Without it,
                  you are essentially flying blind.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Meta Section
function MetaSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const features = [
    {
      title: 'Meta Pixel Installation',
      description: 'Proper base pixel setup with standard events for page views, content views, add to cart, initiate checkout, and purchases.'
    },
    {
      title: 'Conversions API (CAPI)',
      description: 'Server-side tracking that bypasses iOS 14+ restrictions and ad blockers. Essential for accurate attribution in the privacy-first era.'
    },
    {
      title: 'Custom Event Tracking',
      description: 'Track business-specific events like lead form submissions, video completions, scroll depth, and engagement metrics unique to your funnel.'
    },
    {
      title: 'Dynamic Product Ads Feed',
      description: 'Set up product catalogs for dynamic retargeting. Show users the exact products they viewed with personalized ads.'
    },
    {
      title: 'Meta & Shopify Integration',
      description: 'Native Shopify integration for automatic product sync, order tracking, and catalog management across Facebook and Instagram shops.'
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extralight tracking-tight">
                <span className="gradient-text font-light">Meta</span> (Facebook/Instagram) Integration
              </h2>
              <p className="text-gray-400 font-light">Facebook Pixel integration with iOS 14+ compliance</p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 100}>
              <div className="p-6 rounded-xl bg-black/40 border border-purple-400/20 backdrop-blur-xl hover:border-purple-400/40 transition-all duration-300 h-full">
                <CheckCircle2 className="w-6 h-6 text-purple-400 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={600}>
          <div className="mt-8 p-6 rounded-xl bg-purple-400/5 border border-purple-400/20">
            <div className="flex items-start gap-4">
              <Shield className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-medium text-white mb-2">iOS 14+ & Privacy Changes</h4>
                <p className="text-gray-400 font-light leading-relaxed">
                  Apple\'s App Tracking Transparency reduced Meta Pixel accuracy by up to 70% for some advertisers.
                  Our Conversions API (CAPI) implementation recovers this lost data by sending conversions
                  server-side, ensuring your campaigns optimize on complete data.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// LinkedIn Section
function LinkedInSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const features = [
    {
      title: 'LinkedIn Insight Tag',
      description: 'Install LinkedIn\'s base tracking tag to capture website visitors and enable audience building for B2B targeting.'
    },
    {
      title: 'Conversion Tracking',
      description: 'Track high-value B2B conversions like demo requests, content downloads, contact form submissions, and qualified lead generation.'
    },
    {
      title: 'Matched Audiences Setup',
      description: 'Create retargeting audiences, upload customer lists for account-based marketing, and build lookalike audiences from your best customers.'
    },
    {
      title: 'B2B Lead Tracking',
      description: 'Connect lead data to your CRM for complete visibility into which campaigns drive qualified opportunities and closed revenue.'
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-700 to-blue-800 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extralight tracking-tight">
                <span className="gradient-text font-light">LinkedIn</span> Marketing Integration
              </h2>
              <p className="text-gray-400 font-light">B2B lead tracking and account-based marketing</p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 100}>
              <div className="p-6 rounded-xl bg-black/40 border border-blue-500/20 backdrop-blur-xl hover:border-blue-500/40 transition-all duration-300">
                <CheckCircle2 className="w-6 h-6 text-blue-500 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div className="mt-8 p-6 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <div className="flex items-start gap-4">
              <Target className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-medium text-white mb-2">B2B Marketing Excellence</h4>
                <p className="text-gray-400 font-light leading-relaxed">
                  LinkedIn offers unmatched B2B targeting capabilities - job title, company size, industry, seniority.
                  Proper integration ensures you can build audiences from website visitors and track the long
                  B2B sales cycle from first touch to closed deal.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// TikTok Section
function TikTokSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const features = [
    {
      title: 'TikTok Pixel Installation',
      description: 'Set up TikTok\'s tracking pixel with proper event mapping for page views, content views, add to cart, and purchases.'
    },
    {
      title: 'Event Tracking',
      description: 'Configure standard and custom events to track user behavior and optimize campaigns for your specific conversion goals.'
    },
    {
      title: 'TikTok Shop Integration',
      description: 'Connect your product catalog for TikTok Shopping, enabling in-app purchases and shoppable video content.'
    },
    {
      title: 'Events API Setup',
      description: 'Server-side tracking for improved data accuracy, similar to Meta\'s CAPI, for better attribution and optimization.'
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
              <Music className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-extralight tracking-tight">
                <span className="gradient-text font-light">TikTok</span> Pixel Setup
              </h2>
              <p className="text-gray-400 font-light">Reach Gen Z and millennial audiences</p>
            </div>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 100}>
              <div className="p-6 rounded-xl bg-black/40 border border-pink-400/20 backdrop-blur-xl hover:border-pink-400/40 transition-all duration-300">
                <CheckCircle2 className="w-6 h-6 text-pink-400 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{feature.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div className="mt-8 p-6 rounded-xl bg-pink-400/5 border border-pink-400/20">
            <div className="flex items-start gap-4">
              <Zap className="w-6 h-6 text-pink-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-lg font-medium text-white mb-2">The TikTok Opportunity</h4>
                <p className="text-gray-400 font-light leading-relaxed">
                  TikTok\'s algorithm delivers exceptional organic reach and paid CPMs remain lower than Meta.
                  Proper pixel integration ensures your campaigns optimize effectively and you can build
                  retargeting audiences from engaged viewers.
                </p>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Other Platforms Section
function OtherPlatformsSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const platforms = [
    {
      name: 'Pinterest Tag',
      description: 'Visual discovery platform ideal for home, fashion, food, and lifestyle brands',
      icon: Camera,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10'
    },
    {
      name: 'Twitter/X Pixel',
      description: 'Real-time engagement tracking for news, tech, and B2B audiences',
      icon: MessageCircle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-400/10'
    },
    {
      name: 'Microsoft Ads UET Tag',
      description: 'Bing and Microsoft network tracking for desktop and enterprise audiences',
      icon: Search,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10'
    },
    {
      name: 'Snapchat Pixel',
      description: 'Mobile-first tracking for reaching younger demographics',
      icon: Camera,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10'
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              <span className="gradient-text font-light">Additional</span> Platform Integrations
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              We integrate with every major advertising platform to ensure complete coverage.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {platforms.map((platform, i) => (
            <ScrollReveal key={platform.name} delay={i * 100}>
              <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 text-center h-full">
                <div className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center mx-auto mb-4`}>
                  <platform.icon className={`w-6 h-6 ${platform.color}`} />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">{platform.name}</h3>
                <p className="text-sm text-gray-400 font-light">{platform.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal delay={500}>
          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm mb-4">Also supporting:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {['Reddit Ads', 'Quora Pixel', 'Amazon Attribution', 'Taboola', 'Outbrain', 'Criteo'].map(platform => (
                <span
                  key={platform}
                  className="px-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-gray-300"
                >
                  {platform}
                </span>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}

// Conversion Tracking Section
function ConversionTrackingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const trackingTypes = [
    {
      title: 'Purchase/Transaction Tracking',
      description: 'Track completed purchases with revenue values, order IDs, and product data for accurate ROAS calculation.',
      icon: ShoppingCart
    },
    {
      title: 'Lead Form Submissions',
      description: 'Capture lead generation events from contact forms, quote requests, and gated content downloads.',
      icon: Users
    },
    {
      title: 'Phone Call Tracking',
      description: 'Dynamic number insertion and call tracking to attribute phone conversions back to campaigns.',
      icon: MessageCircle
    },
    {
      title: 'Custom Event Tracking',
      description: 'Track any user action - video views, scroll depth, button clicks, file downloads, and more.',
      icon: Settings
    },
    {
      title: 'Cross-Domain Tracking',
      description: 'Maintain user sessions across multiple domains for accurate attribution in complex funnels.',
      icon: Link2
    },
    {
      title: 'Server-Side Tracking',
      description: 'Bypass ad blockers and browser restrictions with server-side event collection.',
      icon: Database
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Complete <span className="gradient-text font-light">Conversion Tracking</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Every touchpoint measured. Every conversion attributed. Complete visibility into your marketing ROI.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trackingTypes.map((type, i) => (
            <ScrollReveal key={type.title} delay={i * 100}>
              <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 h-full">
                <type.icon className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">{type.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{type.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Attribution Section
function AttributionSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Attribution & <span className="gradient-text font-light">Reporting</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Understand which channels drive results with multi-touch attribution and unified reporting.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 gap-8">
          <ScrollReveal delay={100}>
            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
              <BarChart3 className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-medium text-white mb-4">Multi-Touch Attribution</h3>
              <ul className="space-y-3 text-gray-400 font-light">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>First-touch, last-touch, and linear attribution models</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Data-driven attribution for complex funnels</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Cross-channel journey mapping</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Assisted conversion analysis</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={200}>
            <div className="p-8 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-xl">
              <LineChart className="w-10 h-10 text-cyan-400 mb-4" />
              <h3 className="text-xl font-medium text-white mb-4">Unified Reporting</h3>
              <ul className="space-y-3 text-gray-400 font-light">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Consolidate data from all platforms in one dashboard</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Real-time performance monitoring</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Custom KPI tracking and alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span>Automated weekly/monthly reports</span>
                </li>
              </ul>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}

// Process Section
function ProcessSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const steps = [
    {
      step: '01',
      title: 'Audit',
      desc: 'Analyze current tracking setup and identify gaps',
      icon: Search,
      tasks: ['Review existing pixels', 'Check data accuracy', 'Identify tracking gaps', 'Privacy compliance audit']
    },
    {
      step: '02',
      title: 'Plan',
      desc: 'Design integration architecture and event schema',
      icon: Settings,
      tasks: ['Define conversion events', 'Map customer journey', 'Select tracking methods', 'Create implementation plan']
    },
    {
      step: '03',
      title: 'Implement',
      desc: 'Deploy tracking across all platforms',
      icon: Zap,
      tasks: ['Install pixels/tags', 'Configure events', 'Set up server-side', 'Connect platforms']
    },
    {
      step: '04',
      title: 'Test',
      desc: 'Verify accuracy across all touchpoints',
      icon: CheckCircle2,
      tasks: ['End-to-end testing', 'Verify conversions', 'Check data flow', 'Validate attribution']
    },
    {
      step: '05',
      title: 'Monitor',
      desc: 'Ongoing optimization and maintenance',
      icon: Eye,
      tasks: ['Performance monitoring', 'Data quality checks', 'Platform updates', 'Continuous improvement']
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Our Integration <span className="gradient-text font-light">Process</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              A systematic approach to ensure accurate, compliant, and maintainable marketing integration.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-5 gap-4">
          {steps.map((step, i) => (
            <ScrollReveal key={step.step} delay={i * 100}>
              <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 h-full">
                <div className="text-cyan-400 text-sm font-mono mb-3">{step.step}</div>
                <step.icon className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="text-lg font-medium text-white mb-2">{step.title}</h3>
                <p className="text-xs text-gray-400 font-light mb-4">{step.desc}</p>
                <ul className="space-y-1">
                  {step.tasks.map((task, idx) => (
                    <li key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Remarketing Section
function RemarketingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: "-100px" })

  const audiences = [
    {
      title: 'Website Visitors',
      description: 'Re-engage users who visited specific pages, spent time on site, or showed purchase intent.',
      icon: Users
    },
    {
      title: 'Cart Abandoners',
      description: 'Recover lost sales by targeting users who added items to cart but didn\'t complete checkout.',
      icon: ShoppingCart
    },
    {
      title: 'Past Customers',
      description: 'Upsell, cross-sell, and drive repeat purchases from your existing customer base.',
      icon: RefreshCw
    },
    {
      title: 'Lookalike Audiences',
      description: 'Find new customers who share characteristics with your best existing customers.',
      icon: Share2
    },
    {
      title: 'Engagement Audiences',
      description: 'Target users who engaged with your content - video viewers, social followers, email openers.',
      icon: Eye
    },
    {
      title: 'Sequential Retargeting',
      description: 'Build multi-step ad sequences that guide prospects through your funnel.',
      icon: Layers
    }
  ]

  return (
    <section ref={ref} className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Remarketing & <span className="gradient-text font-light">Retargeting</span> Setup
            </h2>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
              Build powerful audiences to re-engage visitors and drive conversions at every stage of the funnel.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {audiences.map((audience, i) => (
            <ScrollReveal key={audience.title} delay={i * 100}>
              <div className="p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 h-full">
                <audience.icon className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">{audience.title}</h3>
                <p className="text-sm text-gray-400 font-light leading-relaxed">{audience.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ Section
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: 'Which marketing platforms do you integrate?',
      answer: 'We integrate all major advertising platforms including Google Ads, Meta (Facebook/Instagram), LinkedIn, TikTok, Pinterest, Twitter/X, Microsoft Ads, and Snapchat. We also set up Google Analytics 4, Google Tag Manager, and connect your CRM systems like HubSpot, Salesforce, and others.'
    },
    {
      question: 'How does marketing integration help my business?',
      answer: 'Proper marketing integration ensures accurate conversion tracking, enables retargeting/remarketing campaigns, provides clear attribution data, and allows you to optimize ad spend based on real performance data rather than guesswork. Most businesses see 30-50% improvement in ROAS after proper integration.'
    },
    {
      question: 'Is your integration GDPR and CCPA compliant?',
      answer: 'Yes, we implement all integrations with privacy compliance in mind. This includes consent management platforms, cookie consent banners, server-side tracking options, and proper data handling procedures that comply with GDPR, CCPA, and other privacy regulations.'
    },
    {
      question: 'What is the Meta Conversions API (CAPI)?',
      answer: 'The Meta Conversions API is a server-side tracking solution that sends conversion data directly from your server to Meta, bypassing browser limitations like iOS 14+ restrictions and ad blockers. This significantly improves tracking accuracy and campaign performance - we\'ve seen accuracy improvements of 40-70% with CAPI implementation.'
    },
    {
      question: 'How long does marketing integration take?',
      answer: 'Basic integration setups (single platform, standard events) take 1-2 weeks. More complex implementations with multiple platforms, server-side tracking, and custom event configurations typically take 2-4 weeks. We provide ongoing monitoring and maintenance as part of our Scale and Enterprise packages.'
    },
    {
      question: 'Do you provide ongoing maintenance?',
      answer: 'Yes, marketing platforms frequently update their tracking requirements. Our Scale and Enterprise packages include ongoing monitoring, updates when platforms change their APIs, and regular audits to ensure your tracking remains accurate.'
    }
  ]

  return (
    <section className="py-20 px-8 relative z-10 border-t border-slate-800/50">
      <div className="max-w-4xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
              Frequently Asked <span className="gradient-text font-light">Questions</span>
            </h2>
          </div>
        </ScrollReveal>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <ScrollReveal key={i} delay={i * 100}>
              <div
                className="rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl overflow-hidden hover:border-cyan-400/20 transition-colors"
              >
                <button
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                  onClick={() => setOpenIndex(openIndex === i ? null : i)}
                >
                  <span className="text-lg font-medium text-white">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-cyan-400 transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {openIndex === i && (
                  <div className="px-6 pb-6">
                    <p className="text-gray-400 font-light leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Related Services Section
function RelatedServicesSection() {
  const services = [
    {
      title: 'Analytics & Tracking',
      description: 'Google Analytics 4, custom dashboards, and data visualization',
      href: '/services/analytics-tracking',
      icon: BarChart3
    },
    {
      title: 'Automation Workflows',
      description: 'Connect your marketing stack with automated workflows',
      href: '/services/automation-workflows',
      icon: Zap
    },
    {
      title: 'Ecommerce Development',
      description: 'Shopify, custom stores with built-in tracking',
      href: '/services/ecommerce',
      icon: ShoppingCart
    }
  ]

  return (
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
          {services.map((service, i) => (
            <ScrollReveal key={service.title} delay={i * 100}>
              <Link
                href={service.href}
                className="block p-6 rounded-xl bg-black/40 border border-white/10 backdrop-blur-xl hover:border-cyan-400/30 transition-all duration-300 group"
              >
                <service.icon className="w-8 h-8 text-cyan-400 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-lg font-medium text-white mb-2 group-hover:text-cyan-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-sm text-gray-400 font-light">{service.description}</p>
                <div className="mt-4 flex items-center gap-2 text-cyan-400 text-sm">
                  Learn more <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  )
}

// Final CTA Section
function FinalCTASection() {
  return (
    <section className="py-32 px-8 border-t border-slate-800/50 relative z-10">
      <div className="max-w-4xl mx-auto text-center">
        <ScrollReveal>
          <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
            Ready to Connect Your <span className="gradient-text font-light">Marketing Stack</span>?
          </h2>
          <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
            Stop making decisions on incomplete data. Get accurate tracking,
            clear attribution, and the insights you need to optimize your marketing spend.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
            <Link
              href="/packages/scale"
              className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:from-cyan-400/30 hover:to-blue-500/30 transition-all duration-500 group"
            >
              View Scale Package <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors"
            >
              Get Integration Audit <ArrowRight size={16} className="opacity-50" />
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Free audit</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Privacy compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Ongoing support</span>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-8 font-light">
            Free consultation | 1-4 week implementation | Ongoing monitoring available
          </p>
        </ScrollReveal>
      </div>
    </section>
  )
}
