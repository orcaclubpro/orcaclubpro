import type { Metadata } from "next"
import Link from "next/link"
import { LegalPage, LegalSection } from "@/components/layout/legal-page"

export const metadata: Metadata = {
  title: "Privacy Policy | ORCACLUB",
  description:
    "How ORCACLUB collects, uses, and protects your information.",
  alternates: { canonical: "https://orcaclub.pro/privacy" },
}

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 13, 2026">
      <LegalSection heading="Overview">
        <p>
          ORCACLUB (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is
          a software studio based in Orange, California. This policy describes
          what information we collect through orcaclub.pro and our client
          portal, how we use it, and the choices you have. We keep it simple:
          we collect what we need to respond to you and deliver our services,
          and we don&rsquo;t sell your personal information.
        </p>
      </LegalSection>

      <LegalSection heading="Information we collect">
        <p>
          <strong className="text-white">Information you provide.</strong> When
          you contact us, book a consultation, or become a client, we collect
          the details you submit — typically your name, email address, phone
          number, company name, and information about your project. Clients
          with portal accounts also have login credentials and account
          information associated with their work.
        </p>
        <p>
          <strong className="text-white">Payment information.</strong> Payments
          are processed by Stripe. We never see or store your full card
          number; we keep records of invoices and payment status.
        </p>
        <p>
          <strong className="text-white">Automatically collected
          information.</strong> Like most websites, we use cookies and similar
          technologies (including Google Tag Manager and analytics tools) to
          understand how visitors use the site — things like pages visited,
          device type, and general location. Our client portal also uses
          cookies that are required for login sessions to work.
        </p>
      </LegalSection>

      <LegalSection heading="How we use information">
        <p>We use the information we collect to:</p>
        <ul className="list-disc pl-6 space-y-2">
          <li>Respond to inquiries and schedule consultations</li>
          <li>Provide, invoice, and support our services</li>
          <li>Operate and secure the client portal</li>
          <li>Understand and improve how the website performs</li>
          <li>
            Send occasional updates about our work — only if you&rsquo;ve asked
            us to, and you can opt out at any time
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How we share information">
        <p>
          We don&rsquo;t sell your personal information. We share it only with
          the service providers that help us run the business — such as Stripe
          (payments), Shopify (customer records), Google (analytics, calendar
          scheduling, and email), and our hosting providers — and only as
          needed for those services. We may also disclose information if the
          law requires it.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies and analytics">
        <p>
          You can control or delete cookies through your browser settings, and
          most browsers offer settings or extensions to limit analytics
          tracking. Blocking cookies may affect features that depend on them,
          such as staying logged in to the client portal.
        </p>
      </LegalSection>

      <LegalSection heading="Data retention and security">
        <p>
          We keep personal information for as long as we need it to serve you
          and meet our legal and accounting obligations, then delete it. We
          use reasonable technical and organizational safeguards to protect
          the information we hold, though no method of transmission or storage
          is completely secure.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You can ask us to access, correct, or delete the personal
          information we hold about you, or to stop sending you marketing
          messages, by emailing{" "}
          <a
            href="mailto:Chance@orcaclub.pro"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Chance@orcaclub.pro
          </a>
          . We&rsquo;ll respond to reasonable requests within a reasonable
          time.
        </p>
      </LegalSection>

      <LegalSection heading="Children">
        <p>
          Our website and services are intended for businesses and are not
          directed to children under 13. We don&rsquo;t knowingly collect
          personal information from children.
        </p>
      </LegalSection>

      <LegalSection heading="Changes to this policy">
        <p>
          If we make material changes to this policy, we&rsquo;ll update this
          page and revise the date at the top.
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about this policy or your information? Email{" "}
          <a
            href="mailto:Chance@orcaclub.pro"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Chance@orcaclub.pro
          </a>{" "}
          or reach us through the{" "}
          <Link
            href="/contact"
            className="text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            contact page
          </Link>
          . ORCACLUB, Orange, CA.
        </p>
      </LegalSection>
    </LegalPage>
  )
}
