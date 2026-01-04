/**
 * Email Templates - ORCACLUB
 *
 * Centralized email template management for consistent branding and easy maintenance.
 *
 * Usage:
 * ```ts
 * import { contactConfirmation } from '@/lib/email/templates'
 *
 * const { subject, html, text } = contactConfirmation({
 *   name: 'John Doe',
 *   service: 'web-design',
 *   adminEmail: 'chance@orcaclub.pro'
 * })
 * ```
 */

import {
  contactConfirmationHTML,
  contactConfirmationText,
  contactConfirmationSubject,
  type ContactConfirmationData,
} from './contact-confirmation'

import {
  contactAdminNotificationHTML,
  contactAdminNotificationText,
  contactAdminNotificationSubject,
  type ContactAdminNotificationData,
} from './contact-admin-notification'

import {
  bookingConfirmationHTML,
  bookingConfirmationText,
  bookingConfirmationSubject,
  type BookingConfirmationData,
} from './booking-confirmation'

// Contact Confirmation (sent to customer)
export function contactConfirmation(data: ContactConfirmationData) {
  return {
    subject: contactConfirmationSubject(data.service),
    html: contactConfirmationHTML(data),
    text: contactConfirmationText(data),
  }
}

// Contact Admin Notification (sent to admin)
export function contactAdminNotification(data: ContactAdminNotificationData) {
  return {
    subject: contactAdminNotificationSubject(data.name),
    html: contactAdminNotificationHTML(data),
    text: contactAdminNotificationText(data),
  }
}

// Booking Confirmation (sent to customer)
export function bookingConfirmation(data: BookingConfirmationData) {
  return {
    subject: bookingConfirmationSubject(data.service),
    html: bookingConfirmationHTML(data),
    text: bookingConfirmationText(data),
  }
}

// Export types
export type {
  ContactConfirmationData,
  ContactAdminNotificationData,
  BookingConfirmationData,
}
