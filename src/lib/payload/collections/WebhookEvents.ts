/**
 * WebhookEvents Collection
 * Tracks processed Stripe webhook events for idempotency
 * Prevents duplicate processing of the same event
 */

import type { CollectionConfig } from 'payload'

export const WebhookEvents: CollectionConfig = {
  slug: 'webhook-events',
  admin: {
    useAsTitle: 'eventId',
    defaultColumns: ['eventId', 'eventType', 'status', 'createdAt'],
    group: 'System',
    description: 'Tracks processed Stripe webhook events',
  },
  access: {
    read: () => true,
    create: () => true,
    update: () => true,
    delete: ({ req }) => req.user?.role === 'admin',
  },
  fields: [
    {
      name: 'eventId',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Stripe event ID (e.g., evt_xxx)',
      },
    },
    {
      name: 'eventType',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Type of Stripe event (e.g., invoice.paid)',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Processing', value: 'processing' },
        { label: 'Processed', value: 'processed' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'processing',
      index: true,
    },
    {
      name: 'orderId',
      type: 'text',
      index: true,
      admin: {
        description: 'PayloadCMS Order ID if applicable',
      },
    },
    {
      name: 'stripeInvoiceId',
      type: 'text',
      admin: {
        description: 'Stripe Invoice ID',
      },
    },
    {
      name: 'payload',
      type: 'json',
      admin: {
        readOnly: true,
        description: 'Full event payload from Stripe',
      },
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      admin: {
        description: 'Error message if processing failed',
        condition: (data) => data.status === 'failed',
      },
    },
    {
      name: 'processingStartedAt',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'MMM dd, yyyy h:mm a',
        },
      },
    },
    {
      name: 'processingCompletedAt',
      type: 'date',
      admin: {
        date: {
          displayFormat: 'MMM dd, yyyy h:mm a',
        },
        condition: (data) => data.status === 'processed' || data.status === 'failed',
      },
    },
  ],
  timestamps: true,
}
