import FloatingNavigation from "../components/floating-navigation"
import ScrollReveal from "../components/scroll-reveal"
import Link from "next/link"
import {
  Code,
  Zap,
  Target,
  Brain,
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react"

const services = [
  {
    icon: Code,
    title: "Interface Architecture",
    subtitle: "Cognitive load reduction through mathematical design",
    description:
      "We engineer interfaces that think. Every pixel calculated for maximum psychological impact, every interaction designed to reduce cognitive friction and amplify user intelligence.",
    features: [
      "Mathematical Design Principles",
      "Cognitive Load Optimization",
      "Accessibility Excellence",
      "Performance Engineering",
    ],
    psychology: "Authority through technical precision",
    metrics: { primary: "300%", secondary: "conversion increase", tertiary: "avg. client result" },
    caseStudy:
      "Luxury e-commerce platform redesign resulted in 300% conversion increase through strategic cognitive load reduction.",
  },
  {
    icon: Zap,
    title: "Workflow Intelligence",
    subtitle: "AI-powered automation that learns and evolves",
    description:
      "Transform repetitive processes into seamless operations. Our intelligent automation doesn't just follow rules—it learns patterns, adapts to changes, and evolves with your business.",
    features: [
      "Intelligent Process Analysis",
      "Custom AI Integration",
      "Adaptive Automation",
      "Predictive Optimization",
    ],
    psychology: "Cognitive load reduction",
    metrics: { primary: "80%", secondary: "efficiency gain", tertiary: "typical improvement" },
    caseStudy: "Manufacturing workflow automation reduced manual tasks by 80% while improving accuracy to 99.7%.",
  },
  {
    icon: Target,
    title: "Visibility Engineering",
    subtitle: "Strategic positioning through technical mastery",
    description:
      "Beyond keywords and backlinks. We engineer visibility through technical excellence, strategic content architecture, and mathematical precision in search optimization.",
    features: ["Technical SEO Mastery", "Content Strategy", "Performance Optimization", "Competitive Intelligence"],
    psychology: "Premium positioning tactics",
    metrics: { primary: "1000%", secondary: "organic growth", tertiary: "average increase" },
    caseStudy:
      "B2B SaaS platform achieved 1000% organic traffic growth through strategic technical SEO implementation.",
  },
  {
    icon: Brain,
    title: "Neural Workflows",
    subtitle: "Custom AI models that amplify human intelligence",
    description:
      "Harness artificial intelligence to amplify human capability. We build custom AI models that understand your specific domain, learn from your data, and provide actionable insights.",
    features: [
      "Custom AI Model Development",
      "Predictive Analytics",
      "Natural Language Processing",
      "Computer Vision Solutions",
    ],
    psychology: "Future-forward innovation",
    metrics: { primary: "90%", secondary: "accuracy rate", tertiary: "model performance" },
    caseStudy:
      "Healthcare AI system achieved 90% diagnostic accuracy while reducing analysis time from hours to minutes.",
  },
]

const testimonials = [
  {
    quote:
      'ORCACLUB transformed our entire digital infrastructure. The precision and mathematical approach to design is unmatched in the industry.',
    author: "Sarah Chen",
    role: "CTO, TechCorp Industries",
    metric: "300% efficiency increase",
    project: "Neural Commerce Platform",
  },
  {
    quote:
      'Their minimalist approach delivered maximum impact. Every solution was purposeful, powerful, and perfectly executed.',
    author: "Marcus Rodriguez",
    role: "CEO, StartupX",
    metric: "150% conversion improvement",
    project: "Intelligent Workflow Engine",
  },
  {
    quote:
      'The AI workflows they built have revolutionized how we operate. It\'s like having a digital brain that never sleeps.',
    author: "Elena Volkov",
    role: "Operations Director, Global Dynamics",
    metric: "80% time savings",
    project: "Brand Intelligence System",
  },
]

const processSteps = [
  {
    number: "01",
    title: "Intelligence Gathering",
    description: "Deep analysis of your digital ecosystem, competitive landscape, and growth opportunities.",
    duration: "1-2 weeks",
  },
  {
    number: "02",
    title: "Strategic Architecture",
    description: "Mathematical design of solutions with psychological precision and technical excellence.",
    duration: "2-3 weeks",
  },
  {
    number: "03",
    title: "Precision Engineering",
    description: "Iterative development with continuous optimization and performance monitoring.",
    duration: "4-8 weeks",
  },
  {
    number: "04",
    title: "Evolution & Optimization",
    description: "Ongoing refinement, scaling, and adaptation to ensure sustained competitive advantage.",
    duration: "Ongoing",
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-black relative">
      <FloatingNavigation />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative overflow-hidden">
        <div className="grid-pattern absolute inset-0 opacity-20" />

        {/* Floating elements */}
        <div
          className="absolute top-1/4 left-1/6 w-24 h-24 border border-cyan-400/10 rounded-full float"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute bottom-1/4 right-1/6 w-32 h-32 border border-blue-500/10 rotate-45 float"
          style={{ animationDelay: "3s" }}
        />

        <div className="max-w-6xl mx-auto relative z-10">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
                Premium solutions, <span className="gradient-text font-light">intelligent results</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light">
                We don&apos;t just build software—we engineer competitive advantages. Every solution crafted with
                mathematical precision and psychological intelligence.
              </p>
            </div>
          </ScrollReveal>

          {/* Trust Indicators */}
          <ScrollReveal delay={400}>
            <div className="grid md:grid-cols-4 gap-8 mb-20">
              {[
                { icon: Users, metric: "50+", label: "Selected Clients", sublabel: "By invitation only" },
                { icon: TrendingUp, metric: "250%", label: "Average ROI", sublabel: "Measured results" },
                { icon: Shield, metric: "99.97%", label: "System Reliability", sublabel: "Uptime guarantee" },
                { icon: Clock, metric: "<850ms", label: "Response Time", sublabel: "Global average" },
              ].map((stat, index) => (
                <div key={index} className="text-center workspace-card rounded-2xl p-6 group">
                  <stat.icon className="w-8 h-8 text-cyan-400 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300" />
                  <div className="text-2xl font-light text-white mb-2 font-mono">{stat.metric}</div>
                  <div className="text-sm text-gray-300 font-light mb-1">{stat.label}</div>
                  <div className="text-xs text-gray-500 font-light">{stat.sublabel}</div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Precision-engineered <span className="gradient-text font-light">capabilities</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                Each service architected with mathematical precision, designed for maximum cognitive impact and
                measurable results.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-12">
            {services.map((service, index) => (
              <ScrollReveal key={index} delay={index * 200}>
                <div className="workspace-card rounded-3xl p-8 group morph">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="p-4 bg-linear-to-r from-blue-600/20 to-cyan-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                      <service.icon className="w-8 h-8 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-2xl font-light mb-2 text-white group-hover:text-cyan-400 transition-colors">
                        {service.title}
                      </h3>
                      <p className="text-cyan-400/80 text-sm font-light">{service.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-gray-400 leading-relaxed mb-8 font-light text-lg">{service.description}</p>

                  {/* Features */}
                  <div className="grid md:grid-cols-2 gap-3 mb-8">
                    {service.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-sm text-gray-300 font-light">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center justify-between p-6 bg-slate-900/30 rounded-2xl mb-6">
                    <div>
                      <div className="text-3xl font-light text-cyan-400 font-mono">{service.metrics.primary}</div>
                      <div className="text-sm text-gray-400 font-light">{service.metrics.secondary}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 font-light">{service.metrics.tertiary}</div>
                      <Sparkles className="w-4 h-4 text-cyan-400/50 ml-auto mt-1" />
                    </div>
                  </div>

                  {/* Case Study */}
                  <div className="p-4 border border-slate-700/50 rounded-xl mb-6">
                    <p className="text-sm text-gray-400 italic font-light leading-relaxed">&quot;{service.caseStudy}&quot;</p>
                  </div>

                  {/* Psychology Note */}
                  <div className="text-xs text-cyan-400/70 italic font-light mb-6">
                    Psychology: {service.psychology}
                  </div>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-light group-hover:translate-x-1 transform duration-300"
                  >
                    Explore Capability <ArrowRight size={16} />
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-8 border-t border-slate-800/50">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Intelligence <span className="gradient-text font-light">methodology</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                Our systematic approach to digital evolution, refined through mathematical precision and psychological
                insight.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processSteps.map((step, index) => (
              <ScrollReveal key={index} delay={index * 150}>
                <div className="workspace-card rounded-2xl p-6 text-center group">
                  <div className="text-4xl font-light text-cyan-400 mb-4 font-mono group-hover:scale-110 transition-transform duration-300">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-light text-white mb-3">{step.title}</h3>
                  <p className="text-gray-400 text-sm font-light leading-relaxed mb-4">{step.description}</p>
                  <div className="text-xs text-cyan-400/70 font-mono">{step.duration}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Trusted by <span className="gradient-text font-light">intelligent organizations</span>
              </h2>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 200}>
                <div className="workspace-card rounded-2xl p-8 group">
                  <blockquote className="text-gray-300 mb-6 italic font-light leading-relaxed text-lg">
                    &quot;{testimonial.quote}&quot;
                  </blockquote>

                  <div className="flex justify-between items-end">
                    <div>
                      <cite className="text-white font-light not-italic">{testimonial.author}</cite>
                      <div className="text-sm text-gray-400 font-light">{testimonial.role}</div>
                      <div className="text-xs text-gray-500 font-light mt-1">{testimonial.project}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg text-cyan-400 font-mono">{testimonial.metric}</div>
                      <div className="text-xs text-gray-500 font-light">measured result</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Scarcity-Based CTA */}
      <section className="py-20 px-8 border-t border-slate-800/50">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
              Ready to engineer your <span className="gradient-text font-light">competitive advantage</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
              We work with a carefully selected pod of clients to ensure exceptional quality and personalized attention.
              Limited availability ensures maximum focus on your digital evolution.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-4 px-12 py-6 bg-linear-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-linear-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Initiate Project <ArrowRight size={20} />
              </Link>
              <Link
                href="/work"
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors magnetic"
              >
                View Intelligence <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
            <p className="text-xs text-gray-600 mt-8 font-light">
              Limited availability • By invitation only • Premium positioning
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl tracking-tight mb-4">
            <span className="font-extralight">ORCA</span>
            <span className="font-light gradient-text">CLUB</span>
          </div>
          <p className="text-gray-500 text-sm font-light">Intelligent digital predator • Mathematical precision</p>
        </div>
      </footer>
    </div>
  )
}
