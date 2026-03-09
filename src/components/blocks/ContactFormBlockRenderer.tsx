import AnimatedBackground from "@/components/layout/animated-background"
import ContactFormSection from "@/components/sections/ContactFormSection"
import type { ContactFormBlock } from "@/types/payload-types"

interface Props {
  block: ContactFormBlock
}

export default function ContactFormBlockRenderer({ block }: Props) {
  // Map the Payload array field (which includes an `id` on each row) to the ServiceOption shape
  const services = block.services?.map((s) => ({
    label: s.label,
    value: s.value,
  })) ?? []

  return (
    <div className="relative min-h-screen overflow-hidden">
      <AnimatedBackground />
      <ContactFormSection
        heading={block.heading ?? undefined}
        tagline={block.tagline ?? undefined}
        contactEmail={block.contactEmail ?? undefined}
        contactLocation={block.contactLocation ?? undefined}
        contactPhone={block.contactPhone ?? undefined}
        step1Title={block.step1Title ?? undefined}
        step1Sub={block.step1Sub ?? undefined}
        step2Title={block.step2Title ?? undefined}
        step2Sub={block.step2Sub ?? undefined}
        step3Title={block.step3Title ?? undefined}
        step3Sub={block.step3Sub ?? undefined}
        services={services.length > 0 ? services : undefined}
        showBookingOption={block.showBookingOption ?? true}
        footerLinkLabel={block.footerLinkLabel ?? undefined}
        footerLinkHref={block.footerLinkHref ?? undefined}
      />
    </div>
  )
}
