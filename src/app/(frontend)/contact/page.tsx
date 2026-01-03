"use client"

import * as React from "react"
import { useState } from "react"
import { Mail, Phone, MapPin, User, Building2, MessageSquare, Calendar, Loader2 } from "lucide-react"
import { toast } from "sonner"
import AnimatedBackground from "@/components/layout/animated-background"
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export const metadata = {
  title: 'Get Started | ORCACLUB TechOps Studio',
  description: 'Contact ORCACLUB for custom integrations, workflow automation, and full stack development. Schedule a free consultation or send us a message. We respond within 24 hours.',
  keywords: [
    'contact techops studio',
    'development consultation',
    'custom integration quote',
    'workflow automation inquiry',
    'full stack developer contact',
    'software development consultation',
    'get started',
    'free consultation'
  ],
  openGraph: {
    title: 'Get Started | ORCACLUB TechOps Studio',
    description: 'Contact us for custom integrations and workflow automation. Free consultation available.',
    url: 'https://orcaclub.pro/contact',
    siteName: 'ORCACLUB',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Get Started | ORCACLUB TechOps Studio',
    description: 'Schedule a free consultation for custom integrations and automation solutions.',
  },
  alternates: {
    canonical: 'https://orcaclub.pro/contact',
  },
}

interface FormData {
  name: string
  email: string
  phone: string
  company: string
  service: string
  package: string
  message: string
  preferredDate: string
  preferredTime: string
}

interface TimeSlot {
  start: string
  end: string
  label: string
}

export default function ContactPage() {
  const [activeTab, setActiveTab] = useState<'contact' | 'booking'>('contact')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    package: "",
    message: "",
    preferredDate: "",
    preferredTime: "",
  })

  // Pre-populate package from URL parameter
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pkg = params.get('package')
    if (pkg) {
      setFormData(prev => ({ ...prev, package: pkg }))
    }
  }, [])

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))

    // If date changed in booking tab, fetch available time slots
    if (name === "preferredDate" && value && activeTab === "booking") {
      fetchAvailableSlots(value)
    }
  }

  const fetchAvailableSlots = async (date: string) => {
    setIsLoadingSlots(true)
    setAvailableSlots([])
    setFormData((prev) => ({ ...prev, preferredTime: "" }))

    try {
      const response = await fetch(`/api/booking/available-slots?date=${date}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch available slots")
      }

      setAvailableSlots(data.slots || [])

      if (data.slots.length === 0) {
        toast.info("No available slots", {
          description: "This date is fully booked. Please select another date.",
        })
      }
    } catch (error) {
      console.error("Failed to fetch slots:", error)
      toast.error("Unable to load available times", {
        description: "Please try selecting a different date.",
      })
    } finally {
      setIsLoadingSlots(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.company,
          service: formData.service,
          package: formData.package,
          message: formData.message,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit contact form")
      }

      toast.success("Message sent successfully!", {
        description: "We'll get back to you within 24 hours.",
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "",
        package: "",
        message: "",
        preferredDate: "",
        preferredTime: "",
      })
    } catch (error) {
      toast.error("Something went wrong", {
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit booking request")
      }

      toast.success("Consultation booked!", {
        description: "Check your email for confirmation and calendar invite.",
      })

      // Reset form and slots
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "",
        package: "",
        message: "",
        preferredDate: "",
        preferredTime: "",
      })
      setAvailableSlots([])
    } catch (error) {
      toast.error("Something went wrong", {
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <AnimatedBackground />

      {/* Hero Section */}
      <section className="relative z-10 pb-8 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-4 animate-fade-in">
            <Image
              src="/orcaclubpro.png"
              alt="ORCACLUB Pro"
              width={120}
              height={120}
              className="w-20 h-20 md:w-24 md:h-24 object-contain mx-auto"
              priority
            />
          </div>

          <h1 className="text-5xl md:text-6xl font-bold text-cyan-400 mb-2 animate-slide-up">
            CONTACT
          </h1>

          <p className="text-lg md:text-xl text-gray-400 font-light animate-slide-up-delay">
            Let's discuss how we can help you achieve your goals
          </p>
        </div>
      </section>

      {/* Tabs and Forms */}
      <section className="relative z-10 px-6 pb-32">
        <div className="max-w-2xl mx-auto">
          {/* Tab Buttons */}
          <div className="flex gap-4 mb-8 animate-scale-in">
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'contact'
                  ? 'bg-cyan-400 text-black'
                  : 'bg-slate-900/40 text-gray-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Contact Us
            </button>
            <button
              onClick={() => setActiveTab('booking')}
              className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === 'booking'
                  ? 'bg-cyan-400 text-black'
                  : 'bg-slate-900/40 text-gray-400 hover:text-white hover:bg-slate-900/60'
              }`}
            >
              Schedule Consultation
            </button>
          </div>

          {/* Contact Form */}
          {activeTab === 'contact' && (
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-8 animate-fade-in">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-medium">
                    Full Name <span className="text-cyan-400">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white font-medium">
                    Email Address <span className="text-cyan-400">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Company Field */}
                <div className="space-y-2">
                  <Label htmlFor="company" className="text-white font-medium">
                    Company Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="company"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Acme Inc."
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Service Selection */}
                <div className="space-y-2">
                  <Label htmlFor="service" className="text-white font-medium">
                    Service Interested In <span className="text-cyan-400">*</span>
                  </Label>
                  <select
                    id="service"
                    name="service"
                    required
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                  >
                    <option value="" className="bg-black">Select a service...</option>
                    <option value="web-design" className="bg-black">Web Design</option>
                    <option value="ai-automation" className="bg-black">AI & Automation</option>
                    <option value="custom-software" className="bg-black">Custom Software Development</option>
                    <option value="seo-services" className="bg-black">SEO Services</option>
                    <option value="consulting" className="bg-black">Consulting</option>
                    <option value="other" className="bg-black">Other</option>
                  </select>
                </div>

                {/* Package Selection */}
                <div className="space-y-2">
                  <Label htmlFor="package" className="text-white font-medium">
                    Package Interested In <span className="text-cyan-400">*</span>
                  </Label>
                  <select
                    id="package"
                    name="package"
                    required
                    value={formData.package}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                  >
                    <option value="" className="bg-black">Select a package...</option>
                    <option value="launch" className="bg-black">Launch Tier ($1K-3K, 3-5 days)</option>
                    <option value="scale" className="bg-black">Scale Tier ($3K-5K, 7-10 days)</option>
                    <option value="enterprise" className="bg-black">Enterprise Tier ($6K-30K, 14-21 days)</option>
                    <option value="maintenance-essential" className="bg-black">Essential Maintenance ($300/mo)</option>
                    <option value="maintenance-growth" className="bg-black">Growth Maintenance ($600/mo)</option>
                    <option value="maintenance-partner" className="bg-black">Partner Maintenance ($1,200/mo)</option>
                    <option value="hourly" className="bg-black">Custom Hourly Work ($75/hr)</option>
                    <option value="not-sure" className="bg-black">Not Sure - Need Consultation</option>
                  </select>
                </div>

                {/* Message Field */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-white font-medium">
                    Message <span className="text-cyan-400">*</span>
                  </Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your project, goals, and any specific requirements..."
                      rows={5}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400 resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-cyan-400 text-black hover:bg-cyan-500 font-semibold py-6 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Message"
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Booking Form */}
          {activeTab === 'booking' && (
            <div className="bg-slate-900/40 backdrop-blur-sm border border-white/10 rounded-xl p-8 animate-fade-in">
              <form onSubmit={handleBookingSubmit} className="space-y-6">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name-booking" className="text-white font-medium">
                    Full Name <span className="text-cyan-400">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="name-booking"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="John Doe"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email-booking" className="text-white font-medium">
                    Email Address <span className="text-cyan-400">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="email-booking"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phone-booking" className="text-white font-medium">
                    Phone Number
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="phone-booking"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+1 (555) 123-4567"
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Company Field */}
                <div className="space-y-2">
                  <Label htmlFor="company-booking" className="text-white font-medium">
                    Company Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="company-booking"
                      name="company"
                      type="text"
                      value={formData.company}
                      onChange={handleInputChange}
                      placeholder="Acme Inc."
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Service Selection */}
                <div className="space-y-2">
                  <Label htmlFor="service-booking" className="text-white font-medium">
                    Service Interested In <span className="text-cyan-400">*</span>
                  </Label>
                  <select
                    id="service-booking"
                    name="service"
                    required
                    value={formData.service}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                  >
                    <option value="" className="bg-black">Select a service...</option>
                    <option value="web-design" className="bg-black">Web Design</option>
                    <option value="ai-automation" className="bg-black">AI & Automation</option>
                    <option value="custom-software" className="bg-black">Custom Software Development</option>
                    <option value="seo-services" className="bg-black">SEO Services</option>
                    <option value="consulting" className="bg-black">Consulting</option>
                    <option value="other" className="bg-black">Other</option>
                  </select>
                </div>

                {/* Package Selection */}
                <div className="space-y-2">
                  <Label htmlFor="package-booking" className="text-white font-medium">
                    Package Interested In <span className="text-cyan-400">*</span>
                  </Label>
                  <select
                    id="package-booking"
                    name="package"
                    required
                    value={formData.package}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                  >
                    <option value="" className="bg-black">Select a package...</option>
                    <option value="launch" className="bg-black">Launch Tier ($1K-3K, 3-5 days)</option>
                    <option value="scale" className="bg-black">Scale Tier ($3K-5K, 7-10 days)</option>
                    <option value="enterprise" className="bg-black">Enterprise Tier ($6K-30K, 14-21 days)</option>
                    <option value="maintenance-essential" className="bg-black">Essential Maintenance ($300/mo)</option>
                    <option value="maintenance-growth" className="bg-black">Growth Maintenance ($600/mo)</option>
                    <option value="maintenance-partner" className="bg-black">Partner Maintenance ($1,200/mo)</option>
                    <option value="hourly" className="bg-black">Custom Hourly Work ($75/hr)</option>
                    <option value="not-sure" className="bg-black">Not Sure - Need Consultation</option>
                  </select>
                </div>

                {/* Preferred Date */}
                <div className="space-y-2">
                  <Label htmlFor="preferredDate" className="text-white font-medium">
                    Preferred Date <span className="text-cyan-400">*</span>
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      required
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400"
                    />
                  </div>
                </div>

                {/* Preferred Time */}
                {formData.preferredDate && (
                  <div className="space-y-2">
                    <Label htmlFor="preferredTime" className="text-white font-medium">
                      Preferred Time <span className="text-cyan-400">*</span>
                    </Label>
                    {isLoadingSlots ? (
                      <div className="flex items-center justify-center h-12 bg-white/5 border border-white/20 rounded-md">
                        <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                        <span className="ml-2 text-white/70 text-sm">Loading available times...</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <select
                        id="preferredTime"
                        name="preferredTime"
                        required
                        value={formData.preferredTime}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                      >
                        <option value="" className="bg-black">Select a time...</option>
                        {availableSlots.map((slot, index) => (
                          <option key={index} value={slot.start} className="bg-black">
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    ) : formData.preferredDate ? (
                      <div className="flex items-center justify-center h-12 bg-white/5 border border-white/20 rounded-md">
                        <span className="text-white/70 text-sm">No available time slots for this date</span>
                      </div>
                    ) : null}
                  </div>
                )}

                {/* Message Field */}
                <div className="space-y-2">
                  <Label htmlFor="message-booking" className="text-white font-medium">
                    Project Details <span className="text-cyan-400">*</span>
                  </Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                    <Textarea
                      id="message-booking"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us about your project, goals, and any specific requirements..."
                      rows={4}
                      className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-cyan-400 focus:ring-cyan-400 resize-none"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-cyan-400 text-black hover:bg-cyan-500 font-semibold py-6 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Schedule Consultation"
                  )}
                </Button>
              </form>
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-12 grid md:grid-cols-3 gap-6 animate-fade-in-delay">
            <div className="text-center p-6 bg-slate-900/20 backdrop-blur-sm border border-white/5 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-400/10 rounded-lg mb-4">
                <Mail className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Email</h3>
              <p className="text-sm text-gray-400">chance@orcaclub.pro</p>
            </div>

            <div className="text-center p-6 bg-slate-900/20 backdrop-blur-sm border border-white/5 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-400/10 rounded-lg mb-4">
                <Phone className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Phone</h3>
              <p className="text-sm text-gray-400">By appointment</p>
            </div>

            <div className="text-center p-6 bg-slate-900/20 backdrop-blur-sm border border-white/5 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-400/10 rounded-lg mb-4">
                <MapPin className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-white font-medium mb-1">Location</h3>
              <p className="text-sm text-gray-400">Portland, OR</p>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out 0.2s forwards;
          opacity: 0;
        }

        .animate-slide-up-delay {
          animation: slideUp 0.6s ease-out 0.3s forwards;
          opacity: 0;
        }

        .animate-scale-in {
          animation: scaleIn 0.5s ease-out 0.4s forwards;
          opacity: 0;
        }

        .animate-fade-in-delay {
          animation: fadeIn 0.6s ease-out 0.6s forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  )
}
