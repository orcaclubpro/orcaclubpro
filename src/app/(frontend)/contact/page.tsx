"use client"

import * as React from "react"
import { useState } from "react"
import { Mail, Phone, MapPin, User, Building2, MessageSquare, Calendar, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface FormData {
  name: string
  email: string
  phone: string
  company: string
  service: string
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
  const [activeTab, setActiveTab] = useState("contact")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingSlots, setIsLoadingSlots] = useState(false)
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([])
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
    preferredDate: "",
    preferredTime: "",
  })

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
    <div className="min-h-screen bg-black text-white py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
            Let's build something{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-medium">
              extraordinary
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Ready to transform your digital presence? Choose how you'd like to connect with us.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Form Section with Tabs */}
          <div>
            <Tabs defaultValue="contact" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="contact">Contact Us</TabsTrigger>
                <TabsTrigger value="booking">Schedule Consultation</TabsTrigger>
              </TabsList>

              {/* Contact Form Tab */}
              <TabsContent value="contact">
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white font-medium">
                      Full Name <span className="text-red-500">*</span>
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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white font-medium">
                      Email Address <span className="text-red-500">*</span>
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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
                      />
                    </div>
                  </div>

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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
                      />
                    </div>
                  </div>

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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-white font-medium">
                      Service Interested In <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="service"
                      name="service"
                      required
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md focus:border-[#67e8f9] focus:ring-1 focus:ring-[#67e8f9] focus:outline-none"
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

                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white font-medium">
                      Message <span className="text-red-500">*</span>
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
                        rows={4}
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9] resize-none"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#67e8f9] text-black hover:bg-[#67e8f9]/90 font-semibold"
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
              </TabsContent>

              {/* Booking Form Tab */}
              <TabsContent value="booking">
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {/* Same fields as contact */}
                  <div className="space-y-2">
                    <Label htmlFor="name-booking" className="text-white font-medium">
                      Full Name <span className="text-red-500">*</span>
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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email-booking" className="text-white font-medium">
                      Email Address <span className="text-red-500">*</span>
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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
                      />
                    </div>
                  </div>

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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
                      />
                    </div>
                  </div>

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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-booking" className="text-white font-medium">
                      Service Interested In <span className="text-red-500">*</span>
                    </Label>
                    <select
                      id="service-booking"
                      name="service"
                      required
                      value={formData.service}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md focus:border-[#67e8f9] focus:ring-1 focus:ring-[#67e8f9] focus:outline-none"
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

                  {/* Booking-specific fields */}
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate" className="text-white font-medium">
                      Preferred Date <span className="text-red-500">*</span>
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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
                      />
                    </div>
                  </div>

                  {formData.preferredDate && (
                    <div className="space-y-2">
                      <Label htmlFor="preferredTime" className="text-white font-medium">
                        Preferred Time <span className="text-red-500">*</span>
                      </Label>
                      {isLoadingSlots ? (
                        <div className="flex items-center justify-center h-12 bg-white/5 border border-white/20 rounded-md">
                          <Loader2 className="h-5 w-5 animate-spin text-[#67e8f9]" />
                          <span className="ml-2 text-white/70 text-sm">Loading available times...</span>
                        </div>
                      ) : availableSlots.length > 0 ? (
                        <select
                          id="preferredTime"
                          name="preferredTime"
                          required
                          value={formData.preferredTime}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 bg-white/5 border border-white/20 text-white rounded-md focus:border-[#67e8f9] focus:ring-1 focus:ring-[#67e8f9] focus:outline-none"
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

                  <div className="space-y-2">
                    <Label htmlFor="message-booking" className="text-white font-medium">
                      Project Details <span className="text-red-500">*</span>
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
                        className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9] resize-none"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#67e8f9] text-black hover:bg-[#67e8f9]/90 font-semibold"
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
              </TabsContent>
            </Tabs>
          </div>

          {/* Contact Information Sidebar */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-light mb-6">Get in Touch</h2>
              <p className="text-gray-400 leading-relaxed mb-8">
                We believe in building lasting partnerships with our clients. Every project begins with understanding
                your unique challenges and goals.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-lg">
                  <Mail className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Email</h3>
                  <p className="text-gray-400">chance@orcaclub.pro</p>
                  <p className="text-sm text-gray-500">We respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-lg">
                  <Phone className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Phone</h3>
                  <p className="text-gray-400">Available by appointment</p>
                  <p className="text-sm text-gray-500">Mon-Fri, 9AM-5PM PST</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-600/20 to-cyan-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Location</h3>
                  <p className="text-gray-400">Portland, OR</p>
                  <p className="text-sm text-gray-500">Remote-first team</p>
                </div>
              </div>
            </div>

            {/* Process Overview */}
            <div className="mt-12 p-6 border border-slate-800 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Our Process</h3>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Discovery Call", desc: "Understanding your needs and goals" },
                  { step: "2", title: "Proposal", desc: "Detailed project scope and timeline" },
                  { step: "3", title: "Development", desc: "Iterative build with regular updates" },
                  { step: "4", title: "Launch", desc: "Deployment and ongoing support" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-sm font-medium">
                      {item.step}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-gray-400 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
