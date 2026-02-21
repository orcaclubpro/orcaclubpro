"use client"

import * as React from "react"
import { useState } from "react"
import { Mail, Phone, MapPin, User, Building2, MessageSquare, Calendar, Loader2 } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

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
  const [activeTab, setActiveTab] = useState<'contact' | 'booking'>('booking')
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
        headers: { "Content-Type": "application/json" },
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

      setFormData({
        name: "", email: "", phone: "", company: "",
        service: "", package: "", message: "", preferredDate: "", preferredTime: "",
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit booking request")
      }

      toast.success("Consultation booked!", {
        description: "Check your email for confirmation and calendar invite.",
      })

      setFormData({
        name: "", email: "", phone: "", company: "",
        service: "", package: "", message: "", preferredDate: "", preferredTime: "",
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

  const inputClass =
    "w-full pl-11 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-600 transition-all duration-200 outline-none text-sm focus:bg-gray-800 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400"

  const selectClass =
    "w-full px-3 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white transition-all duration-200 outline-none text-sm focus:bg-gray-800 focus:ring-2 focus:ring-cyan-400/30 focus:border-cyan-400 appearance-none"

  const labelClass =
    "block text-[10px] tracking-[0.25em] uppercase font-light text-white/30 mb-2"

  return (
    <div className="flex h-screen overflow-hidden bg-black">

      {/* ── LEFT PANEL ── atmospheric, structural */}
      <div className="relative hidden lg:flex flex-col w-[55%] overflow-hidden bg-black">

        {/* Orbital geometry */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
          <svg
            width="600"
            height="600"
            viewBox="0 0 600 600"
            fill="none"
            aria-hidden="true"
            className="opacity-[0.032]"
          >
            <circle cx="300" cy="300" r="299" stroke="white" strokeWidth="1" />
            <circle cx="300" cy="300" r="226" stroke="white" strokeWidth="0.5" />
            <line x1="300" y1="0" x2="300" y2="600" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="300" x2="600" y2="300" stroke="white" strokeWidth="0.5" />
            <circle cx="300" cy="300" r="3" stroke="white" strokeWidth="0.5" fill="none" />
            <line x1="300" y1="1" x2="300" y2="20" stroke="white" strokeWidth="1" />
            <line x1="300" y1="580" x2="300" y2="599" stroke="white" strokeWidth="1" />
            <line x1="1" y1="300" x2="20" y2="300" stroke="white" strokeWidth="1" />
            <line x1="580" y1="300" x2="599" y2="300" stroke="white" strokeWidth="1" />
          </svg>
        </div>

        {/* Top-left wordmark */}
        <div className="relative z-10 px-12 pt-10">
          <Link href="/">
            <span className="text-[11px] font-light tracking-[0.4em] uppercase text-white/60">
              ORCACLUB
            </span>
          </Link>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex items-center justify-center">
          <div className="text-center px-12">
            <p className="text-[10px] tracking-[0.45em] uppercase text-white/50 font-light mb-6">
              Technical Operations Studio
            </p>
            <h2 className="text-2xl font-extralight text-white tracking-wide mb-8">
              Start a conversation.
            </h2>
            <div className="w-6 h-px bg-cyan-400/40 mx-auto mb-10" />
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                <Mail className="w-3 h-3 text-white/40" />
                <p className="text-[11px] tracking-[0.2em] text-white/60 font-light">
                  chance@orcaclub.pro
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <MapPin className="w-3 h-3 text-white/40" />
                <p className="text-[11px] tracking-[0.2em] text-white/60 font-light">
                  California 714
                </p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Phone className="w-3 h-3 text-white/40" />
                <p className="text-[11px] tracking-[0.2em] text-white/60 font-light">
                  By appointment
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom label */}
        <div className="relative z-10 px-12 pb-10 flex items-center gap-4">
          <div className="h-px w-8 bg-white/20" />
          <span className="text-[10px] tracking-[0.4em] uppercase text-white/40 font-light">
            New Project
          </span>
        </div>
      </div>

      {/* Panel separator */}
      <div className="hidden lg:block w-px bg-white/[0.05] flex-shrink-0" />

      {/* ── RIGHT PANEL ── functional, scrollable */}
      <div className="flex-1 bg-[#080808] flex flex-col overflow-hidden relative">

        {/* Mobile-only logo */}
        <div className="lg:hidden px-10 pt-10 pb-0 text-center flex-shrink-0">
          <h1 className="text-3xl font-bold tracking-tight">
            <span className="text-white">ORCA</span>
            <span className="gradient-text">CLUB</span>
          </h1>
          <p className="text-[11px] text-white/25 tracking-[0.3em] uppercase mt-2 font-light">
            Start a Conversation
          </p>
        </div>

        {/* Scrollable form area */}
        <div className="flex-1 overflow-y-auto flex flex-col items-center px-10 py-12">
          <div className="w-full max-w-[400px]">

            {/* Heading block */}
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.35em] uppercase text-white font-light mb-4">
                Book a 15 Minute Consultation
              </p>
              <h2 className="text-xl font-extralight text-white tracking-wide">
                Tell us what you need.
              </h2>
              <div className="mt-5 w-6 h-px bg-cyan-400/40" />
            </div>

            {/* Hairline tab switcher */}
            <div className="flex gap-8 border-b border-white/[0.06] mb-8">
              <button
                onClick={() => setActiveTab('booking')}
                className="pb-3 relative"
              >
                <span className={`text-[10px] tracking-[0.3em] uppercase font-light transition-colors duration-200 ${
                  activeTab === 'booking' ? 'text-white/80' : 'text-white/25 hover:text-white/40'
                }`}>
                  Schedule
                </span>
                {activeTab === 'booking' && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-cyan-400/50" />
                )}
              </button>
              <button
                onClick={() => setActiveTab('contact')}
                className="pb-3 relative"
              >
                <span className={`text-[10px] tracking-[0.3em] uppercase font-light transition-colors duration-200 ${
                  activeTab === 'contact' ? 'text-white/80' : 'text-white/25 hover:text-white/40'
                }`}>
                  Message
                </span>
                {activeTab === 'contact' && (
                  <span className="absolute bottom-0 left-0 right-0 h-px bg-cyan-400/50" />
                )}
              </button>
            </div>

            {/* ── CONTACT FORM ── */}
            {activeTab === 'contact' && (
              <form onSubmit={handleContactSubmit} className="space-y-5">

                <div>
                  <label htmlFor="name" className={labelClass}>Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input id="name" name="name" type="text" required value={formData.name}
                      onChange={handleInputChange} placeholder="John Doe" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input id="email" name="email" type="email" required value={formData.email}
                      onChange={handleInputChange} placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone" className={labelClass}>Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input id="phone" name="phone" type="tel" value={formData.phone}
                        onChange={handleInputChange} placeholder="+1 (555) 000-0000"
                        className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="company" className={labelClass}>Company</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input id="company" name="company" type="text" value={formData.company}
                        onChange={handleInputChange} placeholder="Acme Inc."
                        className={inputClass} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="service" className={labelClass}>Service *</label>
                    <div className="relative">
                      <select id="service" name="service" required value={formData.service}
                        onChange={handleInputChange} className={selectClass}>
                        <option value="" className="bg-[#111]">Select...</option>
                        <option value="web-design" className="bg-[#111]">Web Design</option>
                        <option value="ai-automation" className="bg-[#111]">AI &amp; Automation</option>
                        <option value="custom-software" className="bg-[#111]">Custom Software</option>
                        <option value="seo-services" className="bg-[#111]">SEO Services</option>
                        <option value="consulting" className="bg-[#111]">Consulting</option>
                        <option value="other" className="bg-[#111]">Other</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="package" className={labelClass}>Package *</label>
                    <div className="relative">
                      <select id="package" name="package" required value={formData.package}
                        onChange={handleInputChange} className={selectClass}>
                        <option value="" className="bg-[#111]">Select...</option>
                        <option value="launch" className="bg-[#111]">Launch ($1K–3K)</option>
                        <option value="scale" className="bg-[#111]">Scale ($3K–5K)</option>
                        <option value="enterprise" className="bg-[#111]">Enterprise ($6K+)</option>
                        <option value="maintenance-essential" className="bg-[#111]">Essential ($300/mo)</option>
                        <option value="maintenance-growth" className="bg-[#111]">Growth ($600/mo)</option>
                        <option value="maintenance-partner" className="bg-[#111]">Partner ($1,200/mo)</option>
                        <option value="hourly" className="bg-[#111]">Hourly ($75/hr)</option>
                        <option value="not-sure" className="bg-[#111]">Not Sure</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className={labelClass}>Message *</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-gray-600" />
                    <textarea id="message" name="message" required value={formData.message}
                      onChange={handleInputChange} rows={4}
                      placeholder="Tell us about your project and goals..."
                      className={`${inputClass} pl-11 resize-none`} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg font-semibold text-sm bg-cyan-400 hover:bg-cyan-400/90 text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : 'Send Message'}
                </button>
              </form>
            )}

            {/* ── BOOKING FORM ── */}
            {activeTab === 'booking' && (
              <form onSubmit={handleBookingSubmit} className="space-y-5">

                <div>
                  <label htmlFor="name-booking" className={labelClass}>Full Name *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input id="name-booking" name="name" type="text" required value={formData.name}
                      onChange={handleInputChange} placeholder="John Doe" className={inputClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor="email-booking" className={labelClass}>Email Address *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input id="email-booking" name="email" type="email" required value={formData.email}
                      onChange={handleInputChange} placeholder="you@example.com" className={inputClass} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="phone-booking" className={labelClass}>Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input id="phone-booking" name="phone" type="tel" value={formData.phone}
                        onChange={handleInputChange} placeholder="+1 (555) 000-0000"
                        className={inputClass} />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="company-booking" className={labelClass}>Company</label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                      <input id="company-booking" name="company" type="text" value={formData.company}
                        onChange={handleInputChange} placeholder="Acme Inc."
                        className={inputClass} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="service-booking" className={labelClass}>Service *</label>
                    <select id="service-booking" name="service" required value={formData.service}
                      onChange={handleInputChange} className={selectClass}>
                      <option value="" className="bg-[#111]">Select...</option>
                      <option value="web-design" className="bg-[#111]">Web Design</option>
                      <option value="ai-automation" className="bg-[#111]">AI &amp; Automation</option>
                      <option value="custom-software" className="bg-[#111]">Custom Software</option>
                      <option value="seo-services" className="bg-[#111]">SEO Services</option>
                      <option value="consulting" className="bg-[#111]">Consulting</option>
                      <option value="other" className="bg-[#111]">Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="package-booking" className={labelClass}>Package *</label>
                    <select id="package-booking" name="package" required value={formData.package}
                      onChange={handleInputChange} className={selectClass}>
                      <option value="" className="bg-[#111]">Select...</option>
                      <option value="launch" className="bg-[#111]">Launch ($1K–3K)</option>
                      <option value="scale" className="bg-[#111]">Scale ($3K–5K)</option>
                      <option value="enterprise" className="bg-[#111]">Enterprise ($6K+)</option>
                      <option value="maintenance-essential" className="bg-[#111]">Essential ($300/mo)</option>
                      <option value="maintenance-growth" className="bg-[#111]">Growth ($600/mo)</option>
                      <option value="maintenance-partner" className="bg-[#111]">Partner ($1,200/mo)</option>
                      <option value="hourly" className="bg-[#111]">Hourly ($75/hr)</option>
                      <option value="not-sure" className="bg-[#111]">Not Sure</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="preferredDate" className={labelClass}>Preferred Date *</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                    <input id="preferredDate" name="preferredDate" type="date" required
                      value={formData.preferredDate} onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                      className={inputClass} />
                  </div>
                </div>

                {formData.preferredDate && (
                  <div>
                    <label htmlFor="preferredTime" className={labelClass}>Preferred Time *</label>
                    {isLoadingSlots ? (
                      <div className="flex items-center gap-2 h-12 px-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-cyan-400/60" />
                        <span className="text-[11px] text-white/30 font-light tracking-wide">Loading available times...</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <select id="preferredTime" name="preferredTime" required
                        value={formData.preferredTime} onChange={handleInputChange}
                        className={selectClass}>
                        <option value="" className="bg-[#111]">Select a time...</option>
                        {availableSlots.map((slot, index) => (
                          <option key={index} value={slot.start} className="bg-[#111]">
                            {slot.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex items-center h-12 px-4 bg-gray-800/50 border border-gray-700 rounded-lg">
                        <span className="text-[11px] text-white/30 font-light tracking-wide">No available slots for this date</span>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label htmlFor="message-booking" className={labelClass}>Project Details *</label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-3.5 w-4 h-4 text-gray-600" />
                    <textarea id="message-booking" name="message" required value={formData.message}
                      onChange={handleInputChange} rows={4}
                      placeholder="Tell us about your project and goals..."
                      className={`${inputClass} pl-11 resize-none`} />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-lg font-semibold text-sm bg-cyan-400 hover:bg-cyan-400/90 text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Booking...</>
                  ) : 'Schedule Consultation'}
                </button>
              </form>
            )}

            {/* Footer */}
            <div className="mt-10 pt-6 border-t border-white/[0.06]">
              <p className="text-[11px] text-white/20 font-light">
                Already a client?{' '}
                <Link
                  href="/login"
                  className="text-cyan-400/50 hover:text-cyan-400/80 transition-colors duration-300 hover:underline underline-offset-2"
                >
                  Sign in
                </Link>
              </p>
            </div>

          </div>
        </div>

        {/* Corner geometry — bottom-right structural accent */}
        <div className="absolute bottom-0 right-0 pointer-events-none select-none" aria-hidden="true">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className="opacity-[0.05]">
            <path d="M96 0 L96 96 L0 96" stroke="white" strokeWidth="1" />
            <path d="M96 28 L96 96 L28 96" stroke="white" strokeWidth="0.5" />
          </svg>
        </div>

      </div>
    </div>
  )
}
