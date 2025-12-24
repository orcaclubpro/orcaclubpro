"use client"

import Image from "next/image"
import ScrollReveal from "@/components/layout/scroll-reveal"

interface ClientsSectionProps {
  clients: any[]
}

export default function ClientsSection({ clients }: ClientsSectionProps) {
  if (clients.length === 0) return null

  return (
    <section id="our-work" data-section="clients" className="py-20 px-8 border-t border-slate-800/50 relative z-10">
      <div className="max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extralight mb-4 tracking-tight">
              Our <span className="gradient-text font-light">Work</span>
            </h2>
            <p className="text-lg text-gray-400 max-w-3xl mx-auto font-light">
              Check out the brands that ORCACLUB has helped create solutions for.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 md:gap-16 justify-items-center">
          {clients.map((client, index) => {
            const logo = client.logo
            const logoUrl = typeof logo === 'object' && logo?.url ? logo.url : null
            const hasWebsite = client.website && client.website.trim() !== ''

            const logoContent = logoUrl ? (
              <div className="relative w-full h-32 md:h-48 hover:scale-110 transition-all duration-500">
                <Image
                  src={logoUrl}
                  alt={logo.alt || client.name}
                  fill
                  className="object-contain"
                  priority={index < 4}
                />
              </div>
            ) : (
              <div className="text-gray-400 text-sm font-light">{client.name}</div>
            )

            return (
              <div
                key={client.id || index}
                className="flex items-center justify-center group w-full client-logo-animate"
                style={{
                  animationDelay: `${index * 150}ms`,
                }}
              >
                {hasWebsite ? (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full cursor-pointer"
                    aria-label={`Visit ${client.name} website`}
                  >
                    {logoContent}
                  </a>
                ) : (
                  logoContent
                )}
              </div>
            )
          })}
        </div>
        <style jsx>{`
          .client-logo-animate {
            opacity: 0;
            animation: float-in 1s cubic-bezier(0.16, 1, 0.3, 1) forwards,
                       float 6s ease-in-out infinite 1s;
            will-change: transform;
          }
          @keyframes float-in {
            0% {
              opacity: 0;
              transform: translateY(-30px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            25% {
              transform: translateY(-8px) rotate(1deg);
            }
            50% {
              transform: translateY(-12px) rotate(0deg);
            }
            75% {
              transform: translateY(-6px) rotate(-1deg);
            }
          }
        `}</style>
      </div>
    </section>
  )
}
