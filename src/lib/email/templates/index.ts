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

import {
  clientWelcomeHTML,
  clientWelcomeText,
  clientWelcomeSubject,
  type ClientWelcomeData,
} from './client-welcome'

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

// Client Welcome (sent to new client when their account is created)
export function clientWelcome(data: ClientWelcomeData) {
  return {
    subject: clientWelcomeSubject(),
    html: clientWelcomeHTML(data),
    text: clientWelcomeText(data),
  }
}

// Export types
export type {
  ContactConfirmationData,
  ContactAdminNotificationData,
  BookingConfirmationData,
  ClientWelcomeData,
}
