import * as React from "react"
import Link from "next/link"
import { Package, Layers, Shield, Rocket } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-[#3b82f6]/10 p-6 ring-1 ring-[#3b82f6]/20">
              <Package className="h-12 w-12 text-[#3b82f6]" aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              OrcaClub Products
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Premium solutions for modern teams
            </p>
          </div>

          {/* Description */}
          <div className="mt-8 space-y-6">
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Our product suite is designed to empower teams of all sizes to build,
              scale, and succeed in the digital landscape.
            </p>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              From cutting-edge development tools to enterprise-grade platforms,
              we deliver solutions that drive real business outcomes.
            </p>
          </div>

          {/* Coming Soon Badge */}
          <div className="pt-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/5 px-6 py-3 text-sm font-medium text-white/90 ring-1 ring-white/10">
              <div className="h-2 w-2 rounded-full bg-[#3b82f6] animate-pulse" />
              Coming Soon
            </div>
          </div>

          {/* CTA Section */}
          <div className="pt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/contact">
              <Button
                variant="default"
                className="bg-[#3b82f6] text-white hover:bg-[#3b82f6]/90 font-medium"
              >
                Join the Waitlist
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5"
              >
                Explore Our Services
              </Button>
            </Link>
          </div>
        </div>

        {/* Product Categories */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {productCategories.map((category) => (
            <div
              key={category.name}
              className="relative rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-colors duration-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-lg bg-[#3b82f6]/10 p-2 ring-1 ring-[#3b82f6]/20">
                  <category.icon className="h-6 w-6 text-[#3b82f6]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-white">{category.name}</h3>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{category.description}</p>
            </div>
          ))}
        </div>

        {/* What to Expect */}
        <div className="mt-24 rounded-3xl bg-gradient-to-br from-[#3b82f6]/10 to-[#1e40af]/10 p-8 ring-1 ring-[#3b82f6]/20">
          <h2 className="text-2xl font-bold text-white mb-6">What to Expect</h2>
          <ul className="space-y-4">
            {expectations.map((expectation) => (
              <li key={expectation} className="flex items-start gap-3">
                <Rocket className="h-5 w-5 text-[#3b82f6] mt-1 flex-shrink-0" aria-hidden="true" />
                <span className="text-white/80">{expectation}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 text-center">
          <p className="text-white/60 mb-6">
            Be the first to know when we launch
          </p>
          <Link href="/contact">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
            >
              Get Notified
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

const productCategories = [
  {
    name: "Developer Tools",
    description: "Powerful SDKs, APIs, and frameworks that accelerate your development workflow.",
    icon: Layers,
  },
  {
    name: "Enterprise Solutions",
    description: "Scalable platforms built for mission-critical applications and large organizations.",
    icon: Shield,
  },
  {
    name: "SaaS Products",
    description: "Cloud-based software that delivers instant value without infrastructure overhead.",
    icon: Rocket,
  },
  {
    name: "Integration Hub",
    description: "Connect your favorite tools and services with our comprehensive integration library.",
    icon: Package,
  },
]

const expectations = [
  "Thoughtfully designed products that solve real problems",
  "Enterprise-grade security and reliability",
  "Comprehensive documentation and world-class support",
  "Transparent pricing with no hidden fees",
  "Regular updates and continuous improvement",
  "A community of innovators and early adopters",
]
