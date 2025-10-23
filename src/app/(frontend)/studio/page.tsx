import * as React from "react"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-[#67e8f9]/10 p-6 ring-1 ring-[#67e8f9]/20">
              <Sparkles className="h-12 w-12 text-[#67e8f9]" aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              OrcaClub Studio
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Where innovation meets execution
            </p>
          </div>

          {/* Description */}
          <div className="mt-8 space-y-6">
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              OrcaClub Studio is our creative powerhouse, where cutting-edge technology
              and design thinking converge to build exceptional digital experiences.
            </p>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              From concept to launch, we craft solutions that push boundaries and
              deliver measurable results for our clients.
            </p>
          </div>

          {/* Coming Soon Badge */}
          <div className="pt-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-6 py-3 text-sm font-medium text-white/90 ring-1 ring-white/10">
              <div className="h-2 w-2 rounded-full bg-[#67e8f9] animate-pulse" />
              Coming Soon
            </div>
          </div>

          {/* CTA Section */}
          <div className="pt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/studio/sonar">
              <Button
                variant="default"
                className="bg-[#67e8f9] text-black hover:bg-[#67e8f9]/90 font-medium group"
              >
                Explore Sonar
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5"
              >
                Get in Touch
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-colors duration-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-lg bg-[#67e8f9]/10 p-2 ring-1 ring-[#67e8f9]/20">
                  <feature.icon className="h-6 w-6 text-[#67e8f9]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.name}</h3>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    name: "Innovation Lab",
    description: "Experimenting with emerging technologies to create tomorrow's solutions today.",
    icon: Sparkles,
  },
  {
    name: "Design Excellence",
    description: "Crafting beautiful, intuitive interfaces that users love to interact with.",
    icon: Sparkles,
  },
  {
    name: "Rapid Prototyping",
    description: "Quickly validating ideas and iterating to achieve the perfect product-market fit.",
    icon: Sparkles,
  },
]
