import AnimatedBackground from "@/components/layout/animated-background"
import ContactFormSection from "@/components/sections/ContactFormSection"
import { NoBodyScroll } from "@/components/layout/no-body-scroll"

export default function ContactPage() {
  return (
    <div className="relative h-screen overflow-hidden">
      <NoBodyScroll />
      <AnimatedBackground />
      <ContactFormSection />
    </div>
  )
}
