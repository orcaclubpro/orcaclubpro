import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LegalSection } from "@/components/layout/legal-page"

export const metadata: Metadata = {
  title: "Terms of Service | ORCACLUB",
  description: "The terms that govern use of orcaclub.pro and our services.",
  alternates: { canonical: "https://orcaclub.pro/terms" },
}

export default function TermsOfServicePage() {
  return (
    <LegalPage title="Terms of Service" updated="August 13, 2026">
      <LegalSection heading="Agreement">
        <p>
          These terms govern your use of orcaclub.pro, our client portal, and
          the services provided by ORCACLUB (&ldquo;we,&rdquo; &ldquo;us,&rdquo;
          or &ldquo;our&rdquo;), a software studio based in Orange, California.
          By using the website or engaging our services, you agree to these
          terms. Individual client projects are typically also governed by a
          proposal or agreement specific to that engagement; if the two
          conflict, the project agreement controls.
        </p>
      </LegalSection>

      <LegalSection heading="Our services">
        <p>
          We design, build, and maintain software — websites, integrations,
          automations, and related work. Project scope, deliverables, pricing,
          and timelines are defined in the proposal or agreement for each
          engagement.
        </p>
      </LegalSection>

      <LegalSection heading="Payment and invoicing">
        <p>
          We invoice through Stripe. Invoices are due as stated on the invoice
          or in your project agreement. We may pause work on accounts with
          overdue balances after reasonable notice.
        </p>
      </LegalSection>

      <LegalSection heading="Maintenance plans and renewals">
        <p>
          Ongoing maintenance plans bill on a recurring monthly basis at the
          rate agreed when you sign up, and continue until cancelled. You can
          cancel at any time by emailing{" "}
          <a
            href="mailto:Chance@orcaclub.pro"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Chance@orcaclub.pro
          </a>
          ; cancellation takes effect at the end of the current billing
          period, and we don&rsquo;t charge cancellation fees. If plan pricing
          changes, we&rsquo;ll notify you before the new rate takes effect.
        </p>
      </LegalSection>

      <LegalSection heading="Refunds">
        <p>
          Because our work is custom services, payments for completed work are
          generally non-refundable. If something isn&rsquo;t right, tell us —
          we&rsquo;d rather fix it than argue about it, and any refund for
          incomplete work will be handled reasonably based on work performed
          to date.
        </p>
      </LegalSection>

      <LegalSection heading="Intellectual property">
        <p>
          When a project is paid in full, you own the deliverables we created
          for you. We retain ownership of our pre-existing tools, libraries,
          and general know-how, and grant you a license to use them as part of
          your deliverables. Content on orcaclub.pro — including the ORCACLUB
          name and branding — belongs to us and may not be reused without
          permission.
        </p>
      </LegalSection>

      <LegalSection heading="Client portal accounts">
        <p>
          Portal accounts are for our clients and team. You&rsquo;re
          responsible for keeping your login credentials secure and for
          activity under your account. Don&rsquo;t attempt to access data that
          isn&rsquo;t yours, interfere with the service, or use the portal for
          anything unlawful. We may suspend accounts that violate these terms.
        </p>
      </LegalSection>

      <LegalSection heading="Disclaimers">
        <p>
          The website and its content are provided &ldquo;as is.&rdquo; While
          we work hard to keep information accurate and services available, we
          don&rsquo;t guarantee the site will be uninterrupted or error-free.
          Warranties for project work, if any, are set out in the applicable
          project agreement.
        </p>
      </LegalSection>

      <LegalSection heading="Limitation of liability">
        <p>
          To the fullest extent permitted by law, ORCACLUB is not liable for
          indirect, incidental, or consequential damages arising from your use
          of the website or services, and our total liability for any claim is
          limited to the amount you paid us for the service giving rise to the
          claim in the twelve months before it arose.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          These terms are governed by the laws of the State of California.
          Any disputes will be resolved in the state or federal courts located
          in Orange County, California.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to these terms">
        <p>
          We may update these terms from time to time. Material changes will
          be reflected on this page with an updated date. Continued use of the
          website or services after a change means you accept the updated
          terms.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms? Email{" "}
          <a
            href="mailto:Chance@orcaclub.pro"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Chance@orcaclub.pro
          </a>{" "}
          or use the{" "}
          <Link
            href="/contact"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            contact page
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  )
}
