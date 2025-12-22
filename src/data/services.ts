/**
 * OrcaClub Services Data
 * Hardcoded service offerings optimized for SEO and conversions
 */

export interface Service {
  id: string
  title: string
  shortTitle: string
  headline: string
  description: string
  features: string[]
  icon: string
  category: 'development' | 'marketing' | 'seo' | 'automation'
  color: {
    primary: string
    secondary: string
    gradient: string
    glow: string
  }
  keywords: string
  order: number
}

export const services: Service[] = [
  {
    id: 'web-development',
    title: 'Custom Website Development',
    shortTitle: 'Web Development',
    headline: 'Websites Built in Weeks, Not Months',
    description: 'Launch-ready websites in 2-4 weeks. Custom business tools, analytics dashboards, and seamless CRM integrations. Fast turnaround without sacrificing quality.',
    features: [
      '2 week - 1 month development time',
      'Custom business operation tools',
      'Analytics & dashboard implementations',
      'CRM and software integrations',
      'Mobile-responsive, SEO-optimized',
      'Modern tech stack (React, Next.js)'
    ],
    icon: 'Code2',
    category: 'development',
    color: {
      primary: '#00FFFF', // Electric Cyan
      secondary: '#4169E1', // Royal Blue
      gradient: 'from-cyan-400 via-blue-500 to-blue-600',
      glow: 'shadow-cyan-400/50'
    },
    keywords: 'custom web development, fast website development, React development, Next.js websites, business tools, custom dashboards, CRM integration',
    order: 1
  },
  {
    id: 'digital-marketing',
    title: 'Digital Marketing Services',
    shortTitle: 'Digital Marketing',
    headline: 'ROI-Driven Campaign Management',
    description: 'End-to-end campaign management from strategy to execution. Create high-converting funnels, manage ad campaigns, and track every metric that matters.',
    features: [
      'Campaign funnel creation & optimization',
      'Ad campaign management (Google, Meta, LinkedIn)',
      'Brand strategy & management',
      'Comprehensive metric tracking',
      'Campaign documentation & reporting',
      'A/B testing & conversion optimization'
    ],
    icon: 'Target',
    category: 'marketing',
    color: {
      primary: '#6495ED', // Cornflower Blue
      secondary: '#00C896', // Mint Green
      gradient: 'from-blue-500 via-indigo-500 to-emerald-400',
      glow: 'shadow-blue-500/50'
    },
    keywords: 'digital marketing services, campaign management, ad management, brand strategy, marketing ROI, PPC management, social media marketing',
    order: 2
  },
  {
    id: 'seo-services',
    title: 'SEO & Content Optimization',
    shortTitle: 'SEO Services',
    headline: 'Double Your Search Traffic',
    description: 'Visibility engineering that compounds over time. Strategic content management, technical website optimization, and search strategies that deliver lasting results.',
    features: [
      'Strategic content management',
      'Technical website optimization',
      'Visibility engineering & strategy',
      'Keyword research & implementation',
      'Measurable traffic growth',
      'Local & national SEO'
    ],
    icon: 'Search',
    category: 'seo',
    color: {
      primary: '#1e3a8a', // Navy
      secondary: '#14b8a6', // Teal
      gradient: 'from-slate-700 via-blue-800 to-cyan-500',
      glow: 'shadow-teal-400/50'
    },
    keywords: 'SEO services, search engine optimization, increase organic traffic, content optimization, visibility engineering, technical SEO, local SEO',
    order: 3
  },
  {
    id: 'integration-automation',
    title: 'Seamless Integration & Automation',
    shortTitle: 'Integration & Automation',
    headline: '100x Your Operations',
    description: 'Transform manual processes into smart workflows. Connect your tools, automate repetitive tasks, and build custom systems that scale securely. Reduce manpower, eliminate errors, and operate at enterprise efficiency.',
    features: [
      'Reduce manpower by 90%',
      'Intelligent workflow automation',
      'Custom tool integrations',
      'Enterprise-grade security',
      'Real-time data synchronization',
      'Scalable system architecture'
    ],
    icon: 'Zap',
    category: 'automation',
    color: {
      primary: '#8b5cf6', // Violet
      secondary: '#d946ef', // Fuchsia
      gradient: 'from-violet-500 via-purple-600 to-fuchsia-600',
      glow: 'shadow-purple-500/50'
    },
    keywords: 'workflow automation, tool integration, process automation, business automation, system integration, API integration, workflow orchestration, custom automation',
    order: 4
  }
]

// Helper function to get service by ID
export function getServiceById(id: string): Service | undefined {
  return services.find(service => service.id === id)
}

// Helper function to get services sorted by order
export function getSortedServices(): Service[] {
  return [...services].sort((a, b) => a.order - b.order)
}
