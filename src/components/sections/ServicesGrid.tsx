"use client"

import ScrollReveal from "@/components/layout/scroll-reveal"
import {
  Code2,
  Zap,
  Target,
  Brain,
  Sparkles,
  Rocket,
  Search,
} from "lucide-react"

const iconMap: { [key: string]: any } = {
  Code2,
  Zap,
  Target,
  Brain,
  Sparkles,
  Rocket,
  Search,
}

interface ServicesGridProps {
  services: any[]
}

export default function ServicesGrid({ services }: ServicesGridProps) {
  if (services.length === 0) return null

  return (
    <div className="flex justify-center">
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl">
        {services.map((service, index) => {
          const IconComponent = iconMap[service.icon] || Code2

          return (
            <ScrollReveal key={service.id || index} delay={index * 200}>
              <div className="group workspace-card rounded-2xl p-8 morph text-center h-full flex flex-col">
                {/* Icon without background overlay */}
                <div className="mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <IconComponent className="w-16 h-16 text-cyan-400" />
                </div>
                <h3 className="text-xl font-light mb-4 text-white group-hover:text-cyan-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-400 leading-relaxed mb-6 font-light text-sm flex-grow">
                  {service.description}
                </p>
              </div>
            </ScrollReveal>
          )
        })}
      </div>
    </div>
  )
}
