import * as React from "react"
import Link from "next/link"
import { ArrowLeft, Radio, BarChart3, TrendingUp, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function SonarPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black">
      <div className="mx-auto max-w-4xl px-6 py-24 sm:py-32 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/studio">
            <Button
              variant="ghost"
              className="text-white/80 hover:text-white hover:bg-white/5 group"
            >
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Studio
            </Button>
          </Link>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-[#3b82f6]/10 p-6 ring-1 ring-[#3b82f6]/20">
              <Radio className="h-12 w-12 text-[#3b82f6]" aria-hidden="true" />
            </div>
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Sonar
            </h1>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Advanced analytics and insights
            </p>
          </div>

          {/* Description */}
          <div className="mt-8 space-y-6">
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Sonar is our next-generation analytics platform that helps you navigate
              the depths of your data with precision and clarity.
            </p>
            <p className="text-lg text-white/60 max-w-2xl mx-auto leading-relaxed">
              Powered by advanced algorithms and real-time processing, Sonar delivers
              actionable insights that drive smarter business decisions.
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
                Request Early Access
              </Button>
            </Link>
            <Link href="/services">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/5"
              >
                View Our Services
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 gap-8 sm:grid-cols-2">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative rounded-2xl bg-white/5 p-8 ring-1 ring-white/10 hover:bg-white/10 transition-colors duration-200"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-lg bg-[#3b82f6]/10 p-2 ring-1 ring-[#3b82f6]/20">
                  <feature.icon className="h-6 w-6 text-[#3b82f6]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold text-white">{feature.name}</h3>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Key Benefits */}
        <div className="mt-24 rounded-3xl bg-gradient-to-br from-[#3b82f6]/10 to-[#1e40af]/10 p-8 ring-1 ring-[#3b82f6]/20">
          <h2 className="text-2xl font-bold text-white mb-6">Why Sonar?</h2>
          <ul className="space-y-4">
            {benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-[#3b82f6] mt-1 flex-shrink-0" aria-hidden="true" />
                <span className="text-white/80">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

const features = [
  {
    name: "Real-Time Analytics",
    description: "Monitor your metrics as they happen with our lightning-fast data processing engine.",
    icon: BarChart3,
  },
  {
    name: "Predictive Insights",
    description: "Leverage machine learning to forecast trends and stay ahead of the competition.",
    icon: TrendingUp,
  },
  {
    name: "Custom Dashboards",
    description: "Build tailored visualizations that surface the metrics that matter most to you.",
    icon: Radio,
  },
  {
    name: "Smart Alerts",
    description: "Get notified about important changes and anomalies before they become problems.",
    icon: Zap,
  },
]

const benefits = [
  "Deep dive into your data with multi-dimensional analysis",
  "Uncover hidden patterns and correlations across your entire dataset",
  "Make data-driven decisions with confidence using AI-powered recommendations",
  "Integrate seamlessly with your existing tools and workflows",
  "Scale effortlessly as your data grows",
]
