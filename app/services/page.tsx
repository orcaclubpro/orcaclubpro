import { Metadata } from "next"
import FloatingNavigation from "../components/floating-navigation"
import AnimatedBackground from "../components/animated-background"
import ScrollReveal from "../components/scroll-reveal"
import Link from "next/link"
import {
  Code2,
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
  Star,
  ChevronDown,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Professional Web Design & Automation Services | Orcaclub",
  description: "Expert web design, workflow automation, SEO visibility engineering, and AI solutions. Transform your business with tailored digital solutions that increase efficiency and drive growth.",
  keywords: "web design services, workflow automation, SEO services, AI solutions, digital transformation, business automation, custom web development, search engine optimization, AI workflow automation, visibility engineering",
  openGraph: {
    title: "Professional Web Design & Automation Services | Orcaclub",
    description: "Expert web design, workflow automation, SEO visibility engineering, and AI solutions. Transform your business with tailored digital solutions.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Professional Web Design & Automation Services | Orcaclub",
    description: "Expert web design, workflow automation, SEO visibility engineering, and AI solutions. Transform your business with tailored digital solutions.",
  },
  alternates: {
    canonical: "/services",
  },
}

const services = [
  {
    icon: Code2,
    title: "Elegant Web Design",
    subtitle: "Beautiful, high-converting websites that elevate your brand",
    description: "Beautiful, responsive websites that convert visitors into customers. We focus on user experience, performance, and modern design principles that make your brand stand out in today's competitive digital landscape.",
    features: [
      "Responsive Mobile-First Design",
      "Conversion Rate Optimization", 
      "Performance & Speed Optimization",
      "Modern UI/UX Design Principles",
    ],
    benefits: "Creates memorable first impressions and drives customer action",
    metrics: { primary: "95%", secondary: "client satisfaction", tertiary: "average rating" },
    caseStudy: "E-commerce client saw 300% increase in conversions through strategic UX redesign and optimized checkout flow.",
  },
  {
    icon: Zap,
    title: "Workflow Automation",
    subtitle: "Streamline operations and eliminate repetitive tasks",
    description: "Automate repetitive processes and streamline operations with custom solutions. From data processing to customer communications, we help you work smarter, not harder, freeing up time for strategic growth.",
    features: [
      "Custom Process Automation",
      "Data Integration & Processing",
      "Communication Automation",
      "Performance Analytics & Reporting",
    ],
    benefits: "Reduces manual work and increases operational efficiency",
    metrics: { primary: "60%", secondary: "time savings", tertiary: "average improvement" },
    caseStudy: "Manufacturing client reduced manual tasks by 80% while improving accuracy to 99.7% through intelligent workflow automation.",
  },
  {
    icon: Target,
    title: "Visibility Engineering",
    subtitle: "Strategic SEO and digital marketing for online growth",
    description: "Get found by the right customers with strategic SEO and digital marketing solutions. We help businesses increase their online presence and drive organic growth through proven optimization techniques.",
    features: [
      "Search Engine Optimization (SEO)",
      "Content Strategy & Marketing",
      "Local SEO & Google My Business",
      "Technical SEO & Site Optimization",
    ],
    benefits: "Increases organic traffic and online visibility",
    metrics: { primary: "300%", secondary: "search visibility boost", tertiary: "average increase" },
    caseStudy: "B2B service company achieved 300% organic traffic growth through strategic SEO implementation and content optimization.",
  },
  {
    icon: Brain,
    title: "AI Workflows",
    subtitle: "Intelligent automation that learns and adapts",
    description: "Deploy intelligent AI agents that handle customer service, content creation, and data analysis. Custom AI solutions that integrate seamlessly with your existing systems and scale with your business.",
    features: [
      "AI-Powered Customer Service",
      "Intelligent Content Creation",
      "Predictive Data Analysis",
      "Custom AI Model Development",
    ],
    benefits: "Provides 24/7 intelligent assistance and insights",
    metrics: { primary: "24/7", secondary: "intelligent assistance", tertiary: "always available" },
    caseStudy: "Healthcare client implemented AI chatbot reducing support tickets by 70% while improving customer satisfaction scores.",
  },
]

const testimonials = [
  {
    quote: "Orcaclub transformed our digital presence completely. Their elegant web design increased our conversions by 300% within the first quarter.",
    author: "Sarah Chen",
    role: "CEO, TechStart Innovations",
    metric: "300% conversion increase",
    service: "Elegant Web Design",
  },
  {
    quote: "The workflow automation they built saved us 15 hours per week. Now we can focus on growing our business instead of repetitive tasks.",
    author: "Marcus Rodriguez", 
    role: "Operations Manager, GrowthCorp",
    metric: "15 hours saved weekly",
    service: "Workflow Automation",
  },
  {
    quote: "Our website traffic tripled after their SEO optimization. We're now ranking #1 for our most important keywords.",
    author: "Elena Volkov",
    role: "Marketing Director, LocalBusiness Pro",
    metric: "300% traffic increase",
    service: "Visibility Engineering",
  },
  {
    quote: "The AI solution handles 80% of our customer inquiries automatically. Our team can now focus on complex issues that truly need human attention.",
    author: "David Park",
    role: "Customer Success Lead, ServiceFirst",
    metric: "80% automation rate",
    service: "AI Workflows",
  },
]

const processSteps = [
  {
    number: "01",
    title: "Discovery & Strategy",
    description: "Deep analysis of your business needs, target audience, and competitive landscape to create a tailored digital strategy.",
    duration: "1-2 weeks",
  },
  {
    number: "02",
    title: "Design & Development", 
    description: "Custom solution creation with iterative feedback, ensuring every detail aligns with your vision and business goals.",
    duration: "2-6 weeks",
  },
  {
    number: "03",
    title: "Implementation & Testing",
    description: "Thorough testing and quality assurance before launch, with comprehensive training for your team.",
    duration: "1-2 weeks",
  },
  {
    number: "04",
    title: "Launch & Optimization",
    description: "Strategic launch with ongoing monitoring, optimization, and support to ensure sustained success.",
    duration: "Ongoing",
  },
]

const faqs = [
  {
    question: "How long does a typical web design project take?",
    answer: "Most web design projects take 4-8 weeks from start to finish, depending on complexity and scope. We provide detailed timelines during our initial consultation."
  },
  {
    question: "What's included in your workflow automation services?",
    answer: "Our workflow automation includes process analysis, custom automation development, system integration, training, and ongoing support to ensure smooth operations."
  },
  {
    question: "How do you measure SEO success?", 
    answer: "We track organic traffic growth, keyword rankings, conversion rates, and ROI. You'll receive monthly reports showing progress toward your specific goals."
  },
  {
    question: "Can AI workflows integrate with our existing systems?",
    answer: "Yes, we specialize in creating AI solutions that seamlessly integrate with your current tools and systems, ensuring minimal disruption to your operations."
  },
  {
    question: "Do you provide ongoing support after project completion?",
    answer: "Absolutely. We offer comprehensive support packages including maintenance, updates, performance monitoring, and strategic optimization."
  },
  {
    question: "What makes Orcaclub different from other digital agencies?",
    answer: "We focus on tailored solutions that deliver measurable results. Our combination of elegant design, smart automation, and strategic optimization sets us apart."
  }
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <FloatingNavigation />
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <ScrollReveal>
            <h1 className="text-5xl md:text-7xl font-extralight tracking-tight mb-8">
              Tailored <span className="gradient-text font-light">solutions</span> for modern business
            </h1>
            <p className="text-xl md:text-2xl text-gray-400 max-w-4xl mx-auto leading-relaxed font-light mb-12">
              We believe every business deserves software that works perfectly for their unique needs. 
              From elegant web design to AI-powered automation, we transform how businesses operate in the digital age.
            </p>
          </ScrollReveal>

          {/* Trust Indicators */}
          <ScrollReveal delay={400}>
            <div className="grid md:grid-cols-4 gap-8 mb-16">
              {[
                { icon: Users, metric: "150+", label: "Projects Delivered", sublabel: "Across all industries" },
                { icon: TrendingUp, metric: "300%", label: "Average Growth", sublabel: "Client results" },
                { icon: Shield, metric: "99.9%", label: "Uptime Guarantee", sublabel: "Reliable performance" },
                { icon: Clock, metric: "24/7", label: "Support Available", sublabel: "Always here to help" },
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
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-7xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Our <span className="gradient-text font-light">core services</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                Each service is crafted with precision to address your specific business challenges and drive measurable results.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid lg:grid-cols-2 gap-12">
            {services.map((service, index) => (
              <ScrollReveal key={index} delay={index * 200}>
                <div className="workspace-card rounded-3xl p-8 group morph h-full">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-2xl group-hover:scale-110 transition-transform duration-300">
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

                  {/* Benefits */}
                  <div className="text-xs text-cyan-400/70 italic font-light mb-6">
                    Key Benefit: {service.benefits}
                  </div>

                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors font-light group-hover:translate-x-1 transform duration-300"
                  >
                    Learn More <ArrowRight size={16} />
                  </Link>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-8 border-t border-slate-800/50 relative z-10">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Our proven <span className="gradient-text font-light">process</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                A systematic approach to digital transformation, refined through years of successful projects across diverse industries.
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
      <section className="py-20 px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Trusted by <span className="gradient-text font-light">forward-thinking businesses</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto font-light">
                See how our tailored solutions have transformed businesses across industries.
              </p>
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <ScrollReveal key={index} delay={index * 200}>
                <div className="workspace-card rounded-2xl p-8 group">
                  <div className="flex items-center gap-2 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                    ))}
                    <span className="text-xs text-gray-500 ml-2">{testimonial.service}</span>
                  </div>
                  
                  <blockquote className="text-gray-300 mb-6 italic font-light leading-relaxed text-lg">
                    &quot;{testimonial.quote}&quot;
                  </blockquote>

                  <div className="flex justify-between items-end">
                    <div>
                      <cite className="text-white font-light not-italic">{testimonial.author}</cite>
                      <div className="text-sm text-gray-400 font-light">{testimonial.role}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg text-cyan-400 font-mono">{testimonial.metric}</div>
                      <div className="text-xs text-gray-500 font-light">result achieved</div>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-8 border-t border-slate-800/50 relative z-10">
        <div className="max-w-4xl mx-auto">
          <ScrollReveal>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-extralight mb-6 tracking-tight">
                Frequently asked <span className="gradient-text font-light">questions</span>
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto font-light">
                Everything you need to know about our services and process.
              </p>
            </div>
          </ScrollReveal>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <ScrollReveal key={index} delay={index * 100}>
                <details className="workspace-card rounded-2xl p-6 group">
                  <summary className="flex items-center justify-between cursor-pointer text-white font-light text-lg mb-0">
                    {faq.question}
                    <ChevronDown className="w-5 h-5 text-cyan-400 transition-transform group-open:rotate-180" />
                  </summary>
                  <div className="mt-4 text-gray-400 font-light leading-relaxed">
                    {faq.answer}
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 px-8 border-t border-slate-800/50 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <ScrollReveal>
            <h2 className="text-4xl md:text-5xl font-extralight mb-8 tracking-tight">
              Ready to transform your <span className="gradient-text font-light">business workflows</span>?
            </h2>
            <p className="text-xl text-gray-400 mb-12 font-light leading-relaxed max-w-3xl mx-auto">
              Let&apos;s discuss how we can create tailored solutions that make your business more efficient, 
              more profitable, and more competitive in today&apos;s digital landscape.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-4 px-12 py-6 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-cyan-400/30 rounded-full text-lg font-light text-cyan-400 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-cyan-500/30 transition-all duration-500 magnetic interactive"
              >
                Start Your Project <ArrowRight size={20} />
              </Link>
              <Link
                href="/portfolio"
                className="inline-flex items-center gap-2 text-lg font-light text-gray-300 hover:text-white transition-colors magnetic"
              >
                View Our Work <ArrowRight size={16} className="opacity-50" />
              </Link>
            </div>
            <p className="text-xs text-gray-600 mt-8 font-light">
              Free consultation • Custom solutions • Transparent pricing
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-16 px-8 relative z-10">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-2xl tracking-tight mb-4">
            <span className="font-extralight">ORCA</span>
            <span className="font-light gradient-text">CLUB</span>
          </div>
          <p className="text-gray-500 text-sm font-light">Software Agency • Tailored Solutions • Smarter Workflows</p>
        </div>
      </footer>
    </div>
  )
}
