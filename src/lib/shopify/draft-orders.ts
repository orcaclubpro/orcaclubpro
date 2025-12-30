/**
 * Shopify Draft Orders Utilities
 * Create and manage draft orders via Shopify Admin API
 */

import { shopifyAdminRequest } from './admin-client'

/**
 * GraphQL mutation to create a draft order
 */
const DRAFT_ORDER_CREATE_MUTATION = `
  mutation draftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        name
        status
        invoiceUrl
        totalPrice
        subtotalPrice
        totalTax
        totalShippingPrice
        currencyCode
        email
        phone
        createdAt
        customer {
          id
          email
          firstName
          lastName
        }
        lineItems(first: 50) {
          edges {
            node {
              id
              title
              quantity
              originalUnitPrice
              discountedUnitPrice
              variant {
                id
                title
              }
            }
          }
        }
        appliedDiscount {
          title
          description
          value
          valueType
        }
        shippingLine {
          title
          price
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`

/**
 * GraphQL query to fetch draft orders
 */
const DRAFT_ORDERS_QUERY = `
  query getDraftOrders($first: Int!, $query: String) {
    draftOrders(first: $first, query: $query) {
      edges {
        node {
          id
          name
          status
          invoiceUrl
          totalPrice
          email
          createdAt
          customer {
            id
            email
            firstName
            lastName
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

/**
 * GraphQL mutation to send draft order invoice email
 */
const DRAFT_ORDER_INVOICE_SEND_MUTATION = `
  mutation draftOrderInvoiceSend($id: ID!, $email: EmailInput) {
    draftOrderInvoiceSend(id: $id, email: $email) {
      draftOrder {
        id
        invoiceSentAt
        email
      }
      userErrors {
        field
        message
      }
    }
  }
`

/**
 * Line item for draft order (existing product variant or custom item)
 */
export interface DraftOrderLineItem {
  variantId?: string // For existing products: "gid://shopify/ProductVariant/123"
  title: string // Product/service title
  quantity: number
  originalUnitPrice: number // Price per item
  taxable?: boolean
  requiresShipping?: boolean
}

/**
 * Discount to apply to draft order
 */
export interface DraftOrderDiscount {
  description?: string
  value: number
  valueType: 'PERCENTAGE' | 'FIXED_AMOUNT' // e.g., 10 for 10% or $10 off
}

/**
 * Shipping line for draft order
 */
export interface DraftOrderShippingLine {
  title: string // e.g., "Standard Shipping"
  price: number // Shipping cost
}

/**
 * Input for creating a draft order
 */
export interface CreateDraftOrderInput {
  customerId: string // Shopify customer GID: "gid://shopify/Customer/123"
  email: string // Customer email
  lineItems: DraftOrderLineItem[]
  note?: string // Internal note for merchants
  tags?: string[] // Tags for organization
  shippingLine?: DraftOrderShippingLine
  appliedDiscount?: DraftOrderDiscount
  taxExempt?: boolean // Whether order is tax exempt
  useCustomerDefaultAddress?: boolean // Use customer's default shipping address
}

/**
 * Draft order response
 */
export interface DraftOrder {
  id: string
  name: string
  status: string
  invoiceUrl: string
  totalPrice: string
  subtotalPrice: string
  totalTax: string
  totalShippingPrice: string
  currencyCode: string
  email: string
  phone: string | null
  createdAt: string
  customer: {
    id: string
    email: string
    firstName: string
    lastName: string
  } | null
  lineItems: Array<{
    id: string
    title: string
    quantity: number
    originalUnitPrice: string
    discountedUnitPrice: string
    variant?: {
      id: string
      title: string
    }
  }>
  appliedDiscount?: {
    title: string
    description: string
    value: number
    valueType: string
  }
  shippingLine?: {
    title: string
    price: string
  }
}

/**
 * Result of draft order creation
 */
export interface CreateDraftOrderResult {
  success: boolean
  draftOrder: DraftOrder | null
  error?: string
  userErrors?: Array<{ field: string[]; message: string }>
}

/**
 * Create a draft order in Shopify
 * Draft orders generate an invoice URL that can be sent to customers for payment
 */
export async function createDraftOrder(
  input: CreateDraftOrderInput
): Promise<CreateDraftOrderResult> {
  try {
    console.log('[Shopify Draft Orders] Creating draft order for:', input.email)

    // Build the GraphQL input
    const graphqlInput: any = {
      customerId: input.customerId,
      email: input.email,
      lineItems: input.lineItems.map((item) => {
        const lineItem: any = {
          title: item.title,
          quantity: item.quantity,
          originalUnitPrice: item.originalUnitPrice,
        }

        // Add variant ID if it's an existing product
        if (item.variantId) {
          lineItem.variantId = item.variantId
        }

        // Add optional properties
        if (item.taxable !== undefined) {
          lineItem.taxable = item.taxable
        }
        if (item.requiresShipping !== undefined) {
          lineItem.requiresShipping = item.requiresShipping
        }

        return lineItem
      }),
    }

    // Add optional fields
    if (input.note) {
      graphqlInput.note = input.note
    }

    if (input.tags && input.tags.length > 0) {
      graphqlInput.tags = input.tags
    }

    if (input.shippingLine) {
      graphqlInput.shippingLine = {
        title: input.shippingLine.title,
        price: input.shippingLine.price,
      }
    }

    if (input.appliedDiscount) {
      graphqlInput.appliedDiscount = {
        description: input.appliedDiscount.description || '',
        value: input.appliedDiscount.value,
        valueType: input.appliedDiscount.valueType,
      }
    }

    if (input.taxExempt !== undefined) {
      graphqlInput.taxExempt = input.taxExempt
    }

    if (input.useCustomerDefaultAddress !== undefined) {
      graphqlInput.useCustomerDefaultAddress = input.useCustomerDefaultAddress
    }

    const response = await shopifyAdminRequest(DRAFT_ORDER_CREATE_MUTATION, {
      input: graphqlInput,
    })

    // Check for user errors
    const userErrors = response.data?.draftOrderCreate?.userErrors || []
    if (userErrors.length > 0) {
      console.error('[Shopify Draft Orders] User errors:', userErrors)
      return {
        success: false,
        draftOrder: null,
        error: userErrors[0].message,
        userErrors,
      }
    }

    // Check if draft order was created
    const draftOrder = response.data?.draftOrderCreate?.draftOrder
    if (!draftOrder) {
      console.error('[Shopify Draft Orders] No draft order in response')
      return {
        success: false,
        draftOrder: null,
        error: 'No draft order returned from API',
      }
    }

    console.log('[Shopify Draft Orders] Draft order created successfully:', draftOrder.id)
    console.log('[Shopify Draft Orders] Invoice URL:', draftOrder.invoiceUrl)

    return {
      success: true,
      draftOrder: {
        id: draftOrder.id,
        name: draftOrder.name,
        status: draftOrder.status,
        invoiceUrl: draftOrder.invoiceUrl,
        totalPrice: draftOrder.totalPrice,
        subtotalPrice: draftOrder.subtotalPrice,
        totalTax: draftOrder.totalTax,
        totalShippingPrice: draftOrder.totalShippingPrice,
        currencyCode: draftOrder.currencyCode,
        email: draftOrder.email,
        phone: draftOrder.phone,
        createdAt: draftOrder.createdAt,
        customer: draftOrder.customer,
        lineItems: draftOrder.lineItems.edges.map((edge: any) => ({
          id: edge.node.id,
          title: edge.node.title,
          quantity: edge.node.quantity,
          originalUnitPrice: edge.node.originalUnitPrice,
          discountedUnitPrice: edge.node.discountedUnitPrice,
          variant: edge.node.variant,
        })),
        appliedDiscount: draftOrder.appliedDiscount,
        shippingLine: draftOrder.shippingLine,
      },
    }
  } catch (error) {
    console.error('[Shopify Draft Orders] Creation error:', error)
    return {
      success: false,
      draftOrder: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch draft orders from Shopify
 * @param query Optional search query (e.g., "email:customer@example.com" or "status:OPEN")
 * @param limit Number of draft orders to fetch (default: 50)
 */
export async function fetchDraftOrders(query?: string, limit = 50): Promise<any> {
  try {
    console.log('[Shopify Draft Orders] Fetching draft orders...', { query, limit })

    const response = await shopifyAdminRequest(DRAFT_ORDERS_QUERY, {
      first: Math.min(limit, 250),
      query: query || null,
    })

    if (!response.data?.draftOrders) {
      console.error('[Shopify Draft Orders] No draft orders data in response')
      return {
        draftOrders: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      }
    }

    const edges = response.data.draftOrders.edges || []

    const draftOrders = edges.map((edge: any) => ({
      id: edge.node.id,
      name: edge.node.name,
      status: edge.node.status,
      invoiceUrl: edge.node.invoiceUrl,
      totalPrice: edge.node.totalPrice,
      email: edge.node.email,
      createdAt: edge.node.createdAt,
      customer: edge.node.customer,
    }))

    console.log(`[Shopify Draft Orders] Fetched ${draftOrders.length} draft orders`)

    return {
      draftOrders,
      pageInfo: response.data.draftOrders.pageInfo,
    }
  } catch (error) {
    console.error('[Shopify Draft Orders] Fetch error:', error)
    throw error
  }
}

/**
 * Input for sending draft order invoice email
 */
export interface SendDraftOrderInvoiceInput {
  draftOrderId: string // Shopify draft order GID: "gid://shopify/DraftOrder/123"
  email?: {
    to?: string // Override recipient email (optional, defaults to draft order email)
    from?: string // Custom from email
    subject?: string // Custom email subject
    customMessage?: string // Custom message in email body
    bcc?: string[] // BCC recipients
  }
}

/**
 * Result of sending draft order invoice
 */
export interface SendDraftOrderInvoiceResult {
  success: boolean
  invoiceSentAt?: string
  error?: string
  userErrors?: Array<{ field: string[]; message: string }>
}

/**
 * Send invoice email for a draft order
 * This sends an email to the customer with a secure checkout link
 */
export async function sendDraftOrderInvoice(
  input: SendDraftOrderInvoiceInput
): Promise<SendDraftOrderInvoiceResult> {
  try {
    console.log('[Shopify Draft Orders] Sending invoice for:', input.draftOrderId)

    const variables: any = {
      id: input.draftOrderId,
    }

    // Add email customization if provided
    if (input.email) {
      variables.email = {}
      if (input.email.to) variables.email.to = input.email.to
      if (input.email.from) variables.email.from = input.email.from
      if (input.email.subject) variables.email.subject = input.email.subject
      if (input.email.customMessage) variables.email.customMessage = input.email.customMessage
      if (input.email.bcc) variables.email.bcc = input.email.bcc
    }

    const response = await shopifyAdminRequest(DRAFT_ORDER_INVOICE_SEND_MUTATION, variables)

    // Check for user errors
    const userErrors = response.data?.draftOrderInvoiceSend?.userErrors || []
    if (userErrors.length > 0) {
      console.error('[Shopify Draft Orders] Invoice send errors:', userErrors)
      return {
        success: false,
        error: userErrors[0].message,
        userErrors,
      }
    }

    const draftOrder = response.data?.draftOrderInvoiceSend?.draftOrder
    if (!draftOrder) {
      console.error('[Shopify Draft Orders] No draft order in invoice send response')
      return {
        success: false,
        error: 'Failed to send invoice',
      }
    }

    console.log('[Shopify Draft Orders] Invoice sent successfully at:', draftOrder.invoiceSentAt)

    return {
      success: true,
      invoiceSentAt: draftOrder.invoiceSentAt,
    }
  } catch (error) {
    console.error('[Shopify Draft Orders] Invoice send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

console.log('[Shopify Draft Orders] Draft orders module loaded')
