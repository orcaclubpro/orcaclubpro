import { Metadata } from 'next'
import IntegrationAutomationContent from './IntegrationAutomationContent'

export const metadata: Metadata = {
  title: 'Integration & Automation Services | Reduce Manual Work by 90% - OrcaClub',
  description: 'Transform your business with intelligent workflow automation. Connect 200+ tools, eliminate manual processes, and scale without hiring more staff. Custom integrations, enterprise security, 2-3 week implementation. ROI in 4 weeks. Free workflow audit.',
  keywords: 'workflow automation services, business process automation, custom integration solutions, API integration services, reduce manual work, connect salesforce stripe, automate business tasks, Zapier alternative, enterprise workflow automation, integration consulting, tool synchronization, data automation',
  openGraph: {
    title: 'Integration & Automation Services | 90% Time Reduction - OrcaClub',
    description: 'Automate repetitive tasks, connect your tools seamlessly, and scale operations effortlessly. Custom workflow automation with enterprise-grade security.',
    type: 'website',
  },
  alternates: {
    canonical: '/services/integration-automation'
  }
}

export default function IntegrationAutomationPage() {
  return <IntegrationAutomationContent />
}
