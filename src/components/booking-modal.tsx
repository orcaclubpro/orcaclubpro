"use client"

import * as React from "react"
import { Calendar, Mail, Phone, User, Building2, MessageSquare, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface BookingFormData {
  name: string
  email: string
  phone: string
  company: string
  service: string
  message: string
  preferredDate: string
}

export function BookingModal() {
  const [open, setOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [formData, setFormData] = React.useState<BookingFormData>({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    message: "",
    preferredDate: "",
  })

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

      toast.success("Booking request submitted!", {
        description: "We'll get back to you within 24 hours.",
      })

      // Reset form and close modal
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        service: "",
        message: "",
        preferredDate: "",
      })
      setOpen(false)
    } catch (error) {
      toast.error("Something went wrong", {
        description: error instanceof Error ? error.message : "Please try again later.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="default"
          className="bg-[#67e8f9] text-black hover:bg-[#67e8f9]/90 font-semibold transition-all duration-200"
        >
          Book a Call
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto bg-black border-white/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white">
            Book a Consultation
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Fill out the form below and we'll get back to you within 24 hours to schedule your consultation.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Name Field */}
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

          {/* Email Field */}
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
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
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
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
              />
            </div>
          </div>

          {/* Service Selection */}
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

          {/* Preferred Date */}
          <div className="space-y-2">
            <Label htmlFor="preferredDate" className="text-white font-medium">
              Preferred Date
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
              <Input
                id="preferredDate"
                name="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={handleInputChange}
                min={new Date().toISOString().split('T')[0]}
                className="pl-10 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-[#67e8f9] focus:ring-[#67e8f9]"
              />
            </div>
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-white font-medium">
              Project Details <span className="text-red-500">*</span>
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

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#67e8f9] text-black hover:bg-[#67e8f9]/90 font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
