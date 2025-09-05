"use client"

import type React from "react"

import { useState } from "react"
import Navigation from "@/components/layout/navigation"
import { Send, CheckCircle, Mail, Phone, MapPin } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    project: "",
    budget: "",
    message: "",
  })
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would send data to your backend
    setIsSubmitted(true)
    setTimeout(() => setIsSubmitted(false), 3000)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="min-h-screen bg-black">
      <Navigation />

      <div className="pt-32 pb-20 px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-light tracking-tight mb-6">
              Let&apos;s build something{" "}
              <span className="bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent font-medium">
                extraordinary
              </span>
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Ready to transform your digital presence? We work with a select number of clients to ensure exceptional
              quality and personalized attention.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Form */}
            <div>
              <h2 className="text-2xl font-light mb-8">Start Your Project</h2>

              {isSubmitted ? (
                <div className="p-8 border border-green-400/50 bg-green-400/10 rounded-lg text-center">
                  <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-green-400 mb-2">Message Sent!</h3>
                  <p className="text-gray-400">We&apos;ll get back to you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                        Name *
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors"
                        placeholder="Your full name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      id="company"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors"
                      placeholder="Your company name"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="project" className="block text-sm font-medium text-gray-300 mb-2">
                        Project Type *
                      </label>
                      <select
                        id="project"
                        name="project"
                        required
                        value={formData.project}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none transition-colors"
                      >
                        <option value="">Select a service</option>
                        <option value="web-design">Web Design</option>
                        <option value="automation">Automation</option>
                        <option value="seo">SEO</option>
                        <option value="ai-workflows">AI Workflows</option>
                        <option value="brand-design">Brand Design</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="budget" className="block text-sm font-medium text-gray-300 mb-2">
                        Budget Range
                      </label>
                      <select
                        id="budget"
                        name="budget"
                        value={formData.budget}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:border-cyan-400 focus:outline-none transition-colors"
                      >
                        <option value="">Select budget range</option>
                        <option value="5k-10k">$5,000 - $10,000</option>
                        <option value="10k-25k">$10,000 - $25,000</option>
                        <option value="25k-50k">$25,000 - $50,000</option>
                        <option value="50k+">$50,000+</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                      Project Details *
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:border-cyan-400 focus:outline-none transition-colors resize-none"
                      placeholder="Tell us about your project goals, timeline, and any specific requirements..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-linear-to-r from-blue-600 to-cyan-500 text-white px-8 py-4 rounded-lg font-medium hover:scale-[1.02] transition-transform inline-flex items-center justify-center gap-2"
                  >
                    Send Message <Send size={20} />
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    By submitting this form, you agree to our privacy policy and terms of service.
                  </p>
                </form>
              )}
            </div>

            {/* Contact Information */}
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
                  <div className="p-3 bg-linear-to-r from-blue-600/20 to-cyan-500/20 rounded-lg">
                    <Mail className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Email</h3>
                    <p className="text-gray-400">hello@orcaclub.com</p>
                    <p className="text-sm text-gray-500">We respond within 24 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-linear-to-r from-blue-600/20 to-cyan-500/20 rounded-lg">
                    <Phone className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Phone</h3>
                    <p className="text-gray-400">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-500">Mon-Fri, 9AM-6PM EST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-linear-to-r from-blue-600/20 to-cyan-500/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-medium mb-1">Location</h3>
                    <p className="text-gray-400">San Francisco, CA</p>
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
                      <div className="w-8 h-8 bg-linear-to-r from-blue-600 to-cyan-500 rounded-full flex items-center justify-center text-sm font-medium">
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

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-xl tracking-tight mb-4">
            <span className="font-light">ORCA</span>
            <span className="font-medium bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              CLUB
            </span>
          </div>
          <p className="text-gray-400 text-sm">Premium software agency & digital innovation</p>
        </div>
      </footer>
    </div>
  )
}
