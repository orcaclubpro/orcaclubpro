import * as React from "react"
import Link from "next/link"
import { ShoppingBag, Shirt, Coffee, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MerchandisePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        {/* Hero Section */}
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-[#67e8f9]/10 p-6 ring-1 ring-[#67e8f9]/20">
              <ShoppingBag className="h-12 w-12 text-[#67e8f9]" aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              OrcaClub Merchandise
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Show your pod pride
            </p>
          </div>

          {/* Description */}
          <div className="mt-8 space-y-6">
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Represent the OrcaClub community with our exclusive collection of
              premium merchandise. Each item is designed with the same attention
              to detail we bring to our products.
            </p>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              From minimalist apparel to tech accessories, every piece tells a
              story of innovation, quality, and the spirit of collaboration.
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
            <Link href="/contact">
              <Button
                variant="default"
                className="bg-[#67e8f9] text-black hover:bg-[#67e8f9]/90 font-medium"
              >
                Get Early Access
              </Button>
            </Link>
            <Link href="/about">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5"
              >
                Learn About OrcaClub
              </Button>
            </Link>
          </div>
        </div>

        {/* Product Categories */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {merchandiseCategories.map((category) => (
            <div
              key={category.name}
              className="relative rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-colors duration-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-lg bg-[#67e8f9]/10 p-2 ring-1 ring-[#67e8f9]/20">
                  <category.icon className="h-6 w-6 text-[#67e8f9]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-white">{category.name}</h3>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{category.description}</p>
            </div>
          ))}
        </div>

        {/* Our Commitment */}
        <div className="mt-24 rounded-3xl bg-gradient-to-br from-[#67e8f9]/10 to-[#3b82f6]/10 p-8 ring-1 ring-[#67e8f9]/20">
          <h2 className="text-2xl font-bold text-white mb-6">Our Commitment</h2>
          <ul className="space-y-4">
            {commitments.map((commitment) => (
              <li key={commitment} className="flex items-start gap-3">
                <Heart className="h-5 w-5 text-[#67e8f9] mt-1 flex-shrink-0" aria-hidden="true" />
                <span className="text-white/80">{commitment}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Preview Section */}
        <div className="mt-24">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            What's Coming
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {previewItems.map((item) => (
              <div
                key={item.name}
                className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10"
              >
                <h3 className="text-lg font-semibold text-white mb-2">{item.name}</h3>
                <p className="text-sm text-white/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 text-center">
          <p className="text-white/60 mb-6">
            Join the waitlist to be the first to shop
          </p>
          <Link href="/contact">
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/5"
            >
              Notify Me at Launch
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

const merchandiseCategories = [
  {
    name: "Apparel",
    description: "Premium t-shirts, hoodies, and accessories featuring our iconic designs.",
    icon: Shirt,
  },
  {
    name: "Tech & Desk",
    description: "Stickers, laptop sleeves, and workspace essentials for the modern creator.",
    icon: Coffee,
  },
  {
    name: "Limited Editions",
    description: "Exclusive drops and collaborations with artists and designers.",
    icon: ShoppingBag,
  },
]

const commitments = [
  "Sustainably sourced materials and ethical production",
  "Premium quality that stands the test of time",
  "Thoughtful designs that reflect our brand values",
  "Limited production runs for exclusivity",
  "A portion of proceeds supports open-source initiatives",
]

const previewItems = [
  {
    name: "Classic OrcaClub Tee",
    description: "Soft organic cotton with minimalist logo design. Available in black and white.",
  },
  {
    name: "Developer Hoodie",
    description: "Comfortable zip-up hoodie with subtle tech-inspired details. Perfect for late-night coding.",
  },
  {
    name: "Studio Sticker Pack",
    description: "Collection of die-cut vinyl stickers featuring OrcaClub Studio designs.",
  },
  {
    name: "Sonar Coffee Mug",
    description: "Ceramic mug inspired by our Sonar analytics platform. Keeps your coffee as sharp as your insights.",
  },
]
