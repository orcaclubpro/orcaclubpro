import type { Metadata } from "next"
import { LegalPage, LegalSection } from "@/components/layout/legal-page"

export const metadata: Metadata = {
  title: "Accessibility | ORCACLUB",
  description: "ORCACLUB's commitment to an accessible website.",
  alternates: { canonical: "https://orcaclub.pro/accessibility" },
}

export default function AccessibilityStatementPage() {
  return (
    <LegalPage title="Accessibility Statement" updated="August 13, 2026">
      <LegalSection heading="Our commitment">
        <p>
          ORCACLUB is committed to making orcaclub.pro accessible to everyone,
          including people who use assistive technologies. We aim to conform
          to the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA and
          treat accessibility as an ongoing part of how we build and maintain
          the site.
        </p>
      </LegalSection>

      <LegalSection heading="What we do">
        <ul className="list-disc pl-6 space-y-2">
          <li>Use semantic HTML and accessible component patterns</li>
          <li>Support keyboard navigation, including a skip-to-content link</li>
          <li>Respect reduced-motion preferences in animations</li>
          <li>Provide text alternatives for meaningful images</li>
          <li>Review new pages and features against WCAG 2.1 AA as we ship them</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Known limitations">
        <p>
          Some parts of the site — particularly older pages and third-party
          embedded content — may not yet fully meet the standard. We&rsquo;re
          working through these as part of ongoing development.
        </p>
      </LegalSection>

      <LegalSection heading="Feedback">
        <p>
          If you encounter anything on this site that is difficult to use with
          assistive technology, we want to know. Email{" "}
          <a
            href="mailto:Chance@orcaclub.pro"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Chance@orcaclub.pro
          </a>{" "}
          with a description of the issue and the page it&rsquo;s on, and
          we&rsquo;ll make a genuine effort to fix it promptly or provide the
          information you need another way.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
