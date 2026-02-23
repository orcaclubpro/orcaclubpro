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

import {
  accountSetupNotificationHTML,
  accountSetupNotificationText,
  accountSetupNotificationSubject,
  type AccountSetupNotificationData,
} from './account-setup-notification'

import {
  accountSetupConfirmationHTML,
  accountSetupConfirmationText,
  accountSetupConfirmationSubject,
  type AccountSetupConfirmationData,
} from './account-setup-confirmation'

import {
  passwordResetAdminNotificationHTML,
  passwordResetAdminNotificationText,
  passwordResetAdminNotificationSubject,
  type PasswordResetAdminNotificationData,
} from './password-reset-admin-notification'

import {
  passwordResetConfirmationHTML,
  passwordResetConfirmationText,
  passwordResetConfirmationSubject,
  type PasswordResetConfirmationData,
} from './password-reset-confirmation'

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

// Account Setup Notification (sent to admin when client completes first-time setup)
export function accountSetupNotification(data: AccountSetupNotificationData) {
  return {
    subject: accountSetupNotificationSubject(data.clientName),
    html: accountSetupNotificationHTML(data),
    text: accountSetupNotificationText(data),
  }
}

// Account Setup Confirmation (sent to client after they complete first-time setup)
export function accountSetupConfirmation(data: AccountSetupConfirmationData) {
  return {
    subject: accountSetupConfirmationSubject(),
    html: accountSetupConfirmationHTML(data),
    text: accountSetupConfirmationText(data),
  }
}

// Password Reset Admin Notification (sent to admin when a client resets their password)
export function passwordResetAdminNotification(data: PasswordResetAdminNotificationData) {
  return {
    subject: passwordResetAdminNotificationSubject(data.clientName),
    html: passwordResetAdminNotificationHTML(data),
    text: passwordResetAdminNotificationText(data),
  }
}

// Password Reset Confirmation (sent to client after they reset their password)
export function passwordResetConfirmation(data: PasswordResetConfirmationData) {
  return {
    subject: passwordResetConfirmationSubject(),
    html: passwordResetConfirmationHTML(data),
    text: passwordResetConfirmationText(data),
  }
}

// Export types
export type {
  ContactConfirmationData,
  ContactAdminNotificationData,
  BookingConfirmationData,
  ClientWelcomeData,
  AccountSetupNotificationData,
  AccountSetupConfirmationData,
  PasswordResetAdminNotificationData,
  PasswordResetConfirmationData,
}
