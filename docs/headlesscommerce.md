# Shopify Headless Commerce Integration

## Overview

ORCACLUB uses Shopify's Storefront API to create a headless commerce experience. This integration automatically creates Shopify customer accounts whenever someone submits the contact or booking form, enabling seamless marketing campaigns and future e-commerce functionality.

## Architecture

### Technology Stack
- **Shopify Storefront API** - GraphQL-based customer management
- **@shopify/storefront-api-client** (v1.0.9) - Official Shopify client library
- **Next.js API Routes** - Server-side integration layer
- **PayloadCMS** - Lead management and CRM
- **MongoDB** - Lead data persistence

### Integration Points

```
User Form Submission
        ↓
  PayloadCMS (Lead Created)
        ↓
  Shopify Customer Creation
        ↓
  Email Confirmation
        ↓
  (Optional) Google Calendar Event
```

## Configuration

### Environment Variables

Located in `.env.local`:

```bash
# Shopify Configuration
SHOPIFY_STORE_DOMAIN=orcaclub.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=shpat_your_private_access_token_here
SHOPIFY_STOREFRONT_PUBLIC_TOKEN=your_public_access_token_here
SHOPIFY_API_VERSION=2024-10
```

**Security Notes:**
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (private) - Used for server-side customer creation
- `SHOPIFY_STOREFRONT_PUBLIC_TOKEN` (public) - Reserved for future client-side features
- Never expose private tokens to the client-side code
- Store domain format: `{shop-name}.myshopify.com`

### Obtaining Shopify Credentials

1. **Log into Shopify Admin**
   - Navigate to `https://orcaclub.myshopify.com/admin`

2. **Create a Custom App**
   - Go to **Settings** → **Apps and sales channels** → **Develop apps**
   - Click **"Create an app"** or **"Allow custom app development"**
   - Name: "ORCACLUB Customer Integration"

3. **Configure Storefront API Access**
   - Navigate to **Configuration** tab
   - Under **Storefront API integration**, enable:
     - `unauthenticated_write_customers`
     - `unauthenticated_read_customers`

4. **Install & Retrieve Token**
   - Click **Install app**
   - Go to **API credentials** tab
   - Copy the **Storefront API access token** (starts with `shpat_`)
   - **CRITICAL**: Save immediately - token is shown only once

## Implementation Details

### File Structure

```
src/
├── lib/
│   └── shopify/
│       ├── client.ts          # Shopify API client initialization
│       └── customers.ts       # Customer creation utilities
└── app/
    └── api/
        ├── contact/
        │   └── route.ts       # Contact form with Shopify integration
        └── booking/
            └── route.ts       # Booking form with Shopify integration
```

### Core Components

#### 1. Shopify Client (`src/lib/shopify/client.ts`)

Initializes the Shopify Storefront API client with environment configuration.

```typescript
import { createStorefrontApiClient } from '@shopify/storefront-api-client'

export const shopifyClient = createStorefrontApiClient({
  storeDomain: process.env.SHOPIFY_STORE_DOMAIN,
  apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
  privateAccessToken: process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN,
})
```

**Features:**
- Validates required environment variables on initialization
- Uses private access token for secure server-side operations
- Configured for latest stable API version

#### 2. Customer Utilities (`src/lib/shopify/customers.ts`)

Provides customer creation functionality with error handling.

**Key Functions:**

##### `createShopifyCustomer()`
Creates a Shopify customer account via GraphQL mutation.

**Input:**
```typescript
interface CreateCustomerInput {
  name: string           // Full name (auto-split into first/last)
  email: string         // Email address (unique)
  phone?: string        // Optional phone number
  acceptsMarketing?: boolean  // Marketing consent (default: true)
}
```

**Output:**
```typescript
interface CreateCustomerResult {
  success: boolean
  customerId: string | null
  generatedPassword: string | null  // Secure random password
  error?: string
  isDuplicate?: boolean  // True if customer already exists
}
```

##### `createCustomerSafely()`
Non-blocking wrapper that catches all errors and logs them without throwing.

**GraphQL Mutation:**
```graphql
mutation createCustomerAccount($input: CustomerCreateInput!) {
  customerCreate(input: $input) {
    customer {
      id
      email
      firstName
      lastName
      phone
    }
    customerUserErrors {
      code
      field
      message
    }
  }
}
```

### Integration Flow

#### Contact Form (`/api/contact`)

1. **Validate Form Data**
   - Required: name, email, service, message
   - Optional: phone, company

2. **Save to PayloadCMS** (Critical)
   - Creates Lead record
   - Status: "new"
   - Stores all form data

3. **Create Shopify Customer** (Non-blocking)
   - Parses name into firstName/lastName
   - Generates secure password (16-byte hex)
   - Executes GraphQL mutation
   - Handles duplicate customer errors gracefully

4. **Update PayloadCMS Lead**
   - Success: Store `shopifyCustomerId` and `shopifyPasswordGenerated: true`
   - Duplicate: Log in `notes` field
   - Failure: Log error in `notes` field

5. **Send Emails**
   - Customer confirmation email (via Resend)
   - Admin notification email

#### Booking Form (`/api/booking`)

Same flow as contact form, with additional steps:

6. **Create Google Calendar Event**
   - Scheduled consultation time
   - Includes Google Meet link
   - Attendee: customer email

7. **Update Lead Status**
   - Status changes to "scheduled"
   - Calendar event link stored

### Data Mapping

| Form Field | PayloadCMS Lead | Shopify Customer |
|-----------|----------------|------------------|
| name | name | firstName + lastName |
| email | email | email |
| phone | phone | phone |
| company | company | *(not stored)* |
| service | service | *(not stored)* |
| message | message | *(not stored)* |
| - | - | password (generated) |
| - | - | acceptsMarketing (true) |

### Password Generation

**Algorithm:**
```typescript
crypto.randomBytes(16).toString('hex')
```

**Characteristics:**
- 32 characters (128-bit entropy)
- Cryptographically secure
- Hex-encoded lowercase
- Example: `a7f3e9b2c4d1f8a6e5b3c9d2f1a8e6b4`

**Security:**
- Passwords stored ONLY in Shopify (not in PayloadCMS)
- Users receive activation email from Shopify to set their own password
- Generated password is fallback for Shopify admin recovery

## Error Handling

### Non-Blocking Architecture

Shopify customer creation failures **never** prevent form submission success.

**Error Scenarios:**

| Error Type | Behavior | PayloadCMS Note |
|-----------|----------|----------------|
| Customer already exists | Log warning, continue | "Shopify: Customer already exists (email)" |
| Invalid credentials | Log error, continue | "Shopify: Failed to create customer - {error}" |
| Network timeout | Log error, continue | "Shopify: Failed to create customer - timeout" |
| API rate limit | Log error, continue | "Shopify: Failed to create customer - rate limit" |

**Rationale:**
- Lead capture is more critical than Shopify sync
- Manual admin intervention available via PayloadCMS
- Shopify customer can be created manually later

### Duplicate Customer Handling

When a customer already exists:
- GraphQL returns `CUSTOMER_ALREADY_EXISTS` error
- System logs but does not fail
- Existing customer ID not retrieved (API limitation)
- Lead still saved in PayloadCMS with note

## PayloadCMS Schema

### Leads Collection Fields

Added Shopify integration fields:

```typescript
{
  name: 'shopifyCustomerId',
  type: 'text',
  admin: {
    description: 'Shopify customer ID (auto-populated)',
    position: 'sidebar',
    readOnly: true,
  }
},
{
  name: 'shopifyPasswordGenerated',
  type: 'checkbox',
  defaultValue: false,
  admin: {
    description: 'Whether a Shopify password was generated',
    position: 'sidebar',
    readOnly: true,
  }
}
```

**Access:**
- Admin panel: `http://localhost:3000/admin/collections/leads`
- Fields appear in sidebar (read-only)
- Automatically populated by API

## Testing

### Local Testing

1. **Start Development Server**
   ```bash
   bun run bun:dev
   ```

2. **Submit Contact Form**
   - Navigate to `http://localhost:3000/contact`
   - Fill out form with test data
   - Submit

3. **Verify Integration**
   - Check console logs for `[Shopify]` messages
   - Verify PayloadCMS lead created: `/admin/collections/leads`
   - Verify Shopify customer: `https://orcaclub.myshopify.com/admin/customers`
   - Check `shopifyCustomerId` field in lead

### Console Logs

Successful flow:
```
[Contact] Lead created in PayloadCMS: {leadId}
[Shopify] Creating customer: test@example.com
[Shopify] Customer created successfully: gid://shopify/Customer/123456789
[Contact] Shopify customer created: gid://shopify/Customer/123456789
[Contact] Email sent successfully: {emailId}
```

Duplicate customer:
```
[Shopify] Customer already exists: test@example.com
[Contact] Shopify customer already exists for test@example.com
```

Error scenario:
```
[Shopify] Customer creation error: Invalid credentials
[Contact] Shopify customer creation failed: Invalid credentials
```

## Troubleshooting

### Common Issues

#### 1. Environment Variables Not Loaded

**Symptom:** Error: `SHOPIFY_STORE_DOMAIN is not defined`

**Solution:**
- Verify `.env.local` exists in project root
- Restart development server (Bun doesn't hot-reload env vars)
- Check for typos in variable names

#### 2. Invalid Access Token

**Symptom:** `401 Unauthorized` or `Invalid access token`

**Solution:**
- Verify token starts with `shpat_`
- Regenerate token in Shopify admin if needed
- Ensure Storefront API scopes are enabled

#### 3. Customer Creation Fails Silently

**Symptom:** Lead created but no Shopify customer

**Solution:**
- Check console logs for `[Shopify]` errors
- Verify Shopify admin credentials
- Check API rate limits (100 requests/second)

#### 4. GraphQL Errors

**Symptom:** `customerUserErrors` returned

**Solution:**
- Check email format (must be valid)
- Verify phone format (E.164 recommended)
- Review error messages in console

## Future Enhancements

### Planned Features

1. **Customer Metafields**
   - Store service interest as metafield
   - Track lead source (contact vs booking)
   - Add company name to customer notes

2. **Customer Tags**
   - Auto-tag by service type: "web-design", "ai-automation"
   - Lead status tags: "new-lead", "consultation-booked"
   - Marketing segmentation

3. **Shopify Flows Integration**
   - Trigger welcome email sequence
   - Send service-specific content
   - Automated follow-ups

4. **Product Upsells**
   - Link services to Shopify products
   - Enable direct purchases
   - Track conversion from lead to customer

5. **Customer Sync**
   - Bi-directional sync with PayloadCMS
   - Update existing customers
   - Merge duplicate records

## Security Best Practices

### Access Control

- **Private Token**: Server-side only, never in client code
- **Public Token**: Can be used client-side (limited permissions)
- **Scopes**: Minimum required - `unauthenticated_write_customers`

### Data Protection

- **Passwords**: Generated server-side, stored only in Shopify
- **PII**: Email/phone encrypted in transit (HTTPS)
- **Logs**: Sensitive data redacted from production logs

### Compliance

- **GDPR**: Customer consent via `acceptsMarketing` flag
- **Email Opt-in**: Default true for leads, can be updated
- **Right to Deletion**: Customers can be deleted via Shopify admin

## Monitoring & Analytics

### Key Metrics

Track in Shopify Analytics:
- **Customer Creation Rate**: % of leads converted to Shopify customers
- **Duplicate Rate**: Returning leads
- **Error Rate**: Failed customer creations
- **Marketing Acceptance**: Opt-in percentage

### Logging

All operations logged with prefixes:
- `[Shopify]` - Shopify API operations
- `[Contact]` - Contact form processing
- `[Booking]` - Booking form processing

Example:
```
[Shopify] Customer created successfully: gid://shopify/Customer/123456789
```

## Support & Resources

### Documentation
- [Shopify Storefront API Docs](https://shopify.dev/docs/api/storefront)
- [Customer Create Mutation](https://shopify.dev/docs/api/storefront/latest/mutations/customerCreate)
- [Shopify API Client](https://github.com/shopify/shopify-api-js)

### ORCACLUB Internal
- **PayloadCMS Admin**: `http://localhost:3000/admin`
- **Shopify Admin**: `https://orcaclub.myshopify.com/admin`
- **Lead Collection**: `/admin/collections/leads`
- **Customer List**: `/admin/customers` (Shopify)

### Contact
- **Developer**: Implemented December 2024
- **Maintenance**: ORCACLUB Tech Team
- **Questions**: chance@orcaclub.pro

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Production Ready
