import { Metadata } from 'next'
import DigitalMarketingContent from './DigitalMarketingContent'

export const metadata: Metadata = {
  title: 'Digital Marketing Services | ROI-Driven Campaign Management - OrcaClub',
  description: 'Get measurable results from your marketing spend. Expert campaign management across Google Ads, Meta, LinkedIn, and more. Transparent reporting, A/B testing, and proven ROI. Free consultation.',
  keywords: 'digital marketing services, ROI-driven marketing, campaign management, ad management, PPC services, social media advertising, marketing analytics, conversion optimization, performance marketing',
  openGraph: {
    title: 'Digital Marketing Services | ROI-Driven Campaign Management - OrcaClub',
    description: 'Get measurable results from your marketing spend. Expert campaign management with transparent reporting and proven ROI.',
    type: 'website',
  }
}

export default function DigitalMarketingPage() {
  return <DigitalMarketingContent />
}
