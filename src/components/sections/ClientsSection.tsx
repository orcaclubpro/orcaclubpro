"use client"

import Image from "next/image"

interface ClientsSectionProps {
  clients: any[]
}

export default function ClientsSection({ clients }: ClientsSectionProps) {
  if (clients.length === 0) return null

  // Duplicate enough times to ensure the track is always wider than the viewport
  const repeated = [...clients, ...clients, ...clients, ...clients]

  return (
    <section
      id="our-work"
      data-section="clients"
      className="py-20 border-t border-white/[0.04] relative z-10 overflow-hidden"
    >
      {/* Section label */}
      <div className="text-center mb-12 px-6">
        <p className="text-[10px] tracking-[0.4em] uppercase text-white/15 font-light">
          Trusted By
        </p>
      </div>

      {/* Carousel track — edge fades via mask */}
      <div
        className="relative"
        style={{
          maskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)",
        }}
      >
        <div
          className="flex gap-24 items-center carousel-track"
          style={{ width: "max-content" }}
        >
          {repeated.map((client, index) => {
            const logo = client.logo
            const logoUrl =
              typeof logo === "object" && logo?.url ? logo.url : null
            const hasWebsite = client.website && client.website.trim() !== ""

            const inner = (
              <div className="carousel-logo flex items-center justify-center w-48 h-24 flex-shrink-0">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={logo.alt || client.name}
                    width={192}
                    height={96}
                    className="object-contain w-full h-full"
                    priority={index < clients.length}
                  />
                ) : (
                  <span className="text-white/30 text-xs font-light tracking-widest uppercase">
                    {client.name}
                  </span>
                )}
              </div>
            )

            return (
              <div key={`${client.id ?? index}-${index}`} className="flex-shrink-0">
                {hasWebsite ? (
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Visit ${client.name}`}
                    className="block"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </div>
            )
          })}
        </div>
      </div>

      <style jsx>{`
        .carousel-track {
          animation: marquee 40s linear infinite;
        }

        /* Pause on hover of the whole section */
        section:hover .carousel-track {
          animation-play-state: paused;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            /* Move by 25% — one full original set (4 copies = 25% each) */
            transform: translateX(-25%);
          }
        }

        .carousel-logo {
          filter: grayscale(1) brightness(0.5);
          transition: filter 0.4s ease, transform 0.3s ease;
        }

        .carousel-logo:hover {
          filter: grayscale(0) brightness(1);
          transform: scale(1.08);
        }
      `}</style>
    </section>
  )
}
