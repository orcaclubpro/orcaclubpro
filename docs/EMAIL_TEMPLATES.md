# ORCACLUB Email Template System

Reference guide for creating and implementing new email templates. All emails share a single dark design language — this doc is the source of truth.

---

## Architecture

Two types of templates exist:

| Type | When to use | Example files |
|------|-------------|---------------|
| **Base-injected** | Simple transactional emails (confirmation, notification) | `contact-confirmation.ts`, `booking-confirmation.ts` |
| **Standalone** | Complex emails with custom layout (code display, line items, multi-section) | `passwordReset.ts`, `twoFactor.ts`, `stripePaymentEmailTemplate.ts` |

### Base-injected pattern

`baseEmailTemplate({ content })` in `src/lib/email/templates/base.ts` handles the full outer shell — `<html>`, `<head>`, Google Fonts, outer wrapper, card, header wordmark, and footer bar. You only write the `<tr>` body rows.

```ts
import { baseEmailTemplate, baseTextTemplate } from './base'

export function myEmailHTML(data: MyData): string {
  const content = `
    <tr>
      <td style="padding: 0 0 20px 0;">
        <!-- your rows here -->
      </td>
    </tr>
  `
  return baseEmailTemplate({ content })
}
```

### Standalone pattern

Used when you need a custom right-side header label, a verification code display, or a line items table. Copy the full shell from `passwordReset.ts` as your starting point.

---

## Design Tokens

```
Background (outer):   #000000
Card background:      #080808
Card border:          #111111
Header border:        #0f0f0f
Footer bar bg:        #050505
Footer bar border:    #0a0a0a

Cyan accent:          #67e8f9   — CTA buttons, CLUB wordmark, detail box borders
Cyan hairline:        #2a6068   — accent divider under headings
Cyan muted:           #3a5a5e   — fallback URL links
Cyan dark:            #1a3a3e   — footer CLUB wordmark

Text — heading:       #ffffff
Text — body:          #555555
Text — muted:         #2e2e2e
Text — label:         #3a3a3a   — eyebrow / section labels
Text — subtle:        #1f1f1f   — footer wordmark, ghost text
Text — emphasis:      #888888   — inline emphasis (e.g. "1 hour")

Detail box bg:        #111111
Detail box border:    #1a1a1a
Detail box border-l:  #67e8f9   — left accent on key detail boxes

Warning box bg:       #1a0a0a
Warning box border:   #3a1515
Warning text:         #7a3a3a
```

---

## Typography

**ORCACLUB wordmark** — always Cinzel Decorative, always split:
```html
<span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
```

**Footer wordmark** — same font, very dark:
```html
<span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1f1f1f;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1a3a3e;">CLUB</span>
```

**Body font stack** (inline on `<body>`):
```
-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif
```

**Critical rule**: Never use a `<style>` block or CSS classes. Gmail strips `<style>` entirely. Every style must be inline.

---

## Full Shell (Standalone Template)

Use this as the base when writing a standalone template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><!-- Email title --> — ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"
               style="max-width:520px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- HEADER -->
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <!-- Optional right label: "Client Portal", "Invoice", "Secure Login", etc. -->
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;"><!-- Label --></span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="padding:40px 40px 0 40px;">

              <!-- Eyebrow label -->
              <p style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;"><!-- Section label --></p>

              <!-- Heading -->
              <p style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;"><!-- Heading text.</p>

              <!-- Cyan accent hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>

              <!-- Body content goes here -->

            </td>
          </tr>

          <!-- FOOTER NOTE (optional — use before footer bar) -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;"><!-- Footer note text --></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER BAR -->
          <tr>
            <td style="padding:18px 40px;border-top:1px solid #0a0a0a;background-color:#050505;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1f1f1f;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1a3a3e;">CLUB</span>
                  </td>
                  <td align="right">
                    <a href="https://orcaclub.pro" style="font-size:10px;color:#1f1f1f;text-decoration:none;font-weight:300;letter-spacing:0.02em;">orcaclub.pro</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
```

---

## Reusable Component Snippets

### Body text

```html
<!-- Greeting -->
<p style="margin:32px 0 0 0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">Hello ${name},</p>

<!-- Body paragraph -->
<p style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">Your message here.</p>

<!-- Inline emphasis (e.g. time limit) -->
<span style="color:#888888;">1 hour</span>
```

### CTA Button

```html
<tr>
  <td style="padding:32px 40px 0 40px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
      <tr>
        <td style="background-color:#67e8f9;">
          <a href="${url}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">Button Label</a>
        </td>
      </tr>
    </table>
  </td>
</tr>
```

### Fallback URL (for CTA emails)

```html
<tr>
  <td style="padding:24px 40px 0 40px;">
    <p style="margin:0 0 6px 0;font-size:11px;color:#2e2e2e;letter-spacing:0.01em;line-height:1.5;">If the button doesn't work, paste this into your browser:</p>
    <p style="margin:0;font-size:11px;color:#3a5a5e;word-break:break-all;line-height:1.6;"><a href="${url}" style="color:#3a5a5e;text-decoration:none;">${url}</a></p>
  </td>
</tr>
```

### Detail / data box

```html
<tr>
  <td style="padding:20px 0 0 0;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
           style="background-color:#111111;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;">
      <tr>
        <td style="padding:16px 20px;">
          <!-- Section label -->
          <p style="margin:0 0 12px 0;font-size:10px;font-weight:600;color:#3a3a3a;text-transform:uppercase;letter-spacing:0.5px;">Your Details</p>
          <!-- Rows -->
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td style="padding:5px 0;font-size:13px;color:#3a3a3a;">Label</td>
              <td style="padding:5px 0;font-size:13px;color:#555555;text-align:right;">Value</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td>
</tr>
```

### Verification code display (2FA / login codes)

```html
<tr>
  <td style="padding:24px 40px 0 40px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
           style="background-color:#111111;border:1px solid #67e8f9;">
      <tr>
        <td style="padding:24px;text-align:center;">
          <p style="margin:0;font-size:36px;font-weight:700;letter-spacing:8px;color:#67e8f9;font-family:'Courier New',monospace;">${code}</p>
          <p style="margin:8px 0 0 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;">Verification Code</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
```

### Security / warning notice

```html
<tr>
  <td style="padding:20px 40px 0 40px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
           style="background-color:#1a0a0a;border:1px solid #3a1515;">
      <tr>
        <td style="padding:14px 18px;">
          <p style="margin:0;font-size:11px;color:#7a3a3a;line-height:1.7;font-weight:300;">If you didn't request this, you can safely ignore it.</p>
        </td>
      </tr>
    </table>
  </td>
</tr>
```

### "New Lead" / alert badge

```html
<div style="display:inline-block;background-color:#67e8f9;color:#000000;padding:6px 14px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;">New Lead</div>
```

---

## Plain Text Version

Every template must have a plain text counterpart. Use `baseTextTemplate({ content })` for simple templates:

```ts
export function myEmailText(data: MyData): string {
  const content = `Hi ${data.name},

Your message here.

DETAILS
━━━━━━━━━━━━━━━━━━━━
Label: Value

Questions? Reply to this email.`

  return baseTextTemplate({ content })
}
```

For standalone templates, write the plain text manually — wrap with:

```
ORCACLUB

${content}

---
ORCACLUB
orcaclub.pro
```

Rules:
- Use `━━━━━━━━━━` dividers between sections
- No HTML, no markdown, no emoji in the main body
- Mirror all content from the HTML version — don't truncate

---

## Creating a New Template

### Option A — Base-injected (simple)

1. Create `src/lib/email/templates/my-template.ts`
2. Import base:
   ```ts
   import { baseEmailTemplate, baseTextTemplate } from './base'
   ```
3. Define your data interface and export three functions:
   - `myTemplateSubject(data): string`
   - `myTemplateHTML(data): string` — calls `baseEmailTemplate({ content })`
   - `myTemplateText(data): string` — calls `baseTextTemplate({ content })`
4. Register in `src/lib/email/templates/index.ts`:
   ```ts
   import { myTemplateHTML, myTemplateText, myTemplateSubject } from './my-template'

   export function myTemplate(data: MyTemplateData) {
     return {
       subject: myTemplateSubject(data),
       html: myTemplateHTML(data),
       text: myTemplateText(data),
     }
   }
   ```

### Option B — Standalone (complex layout)

1. Copy `src/lib/payload/utils/passwordReset.ts` as your starting point
2. Update the `<title>`, right header label, eyebrow, heading, and body content
3. Export a `generate[Name]HTML(data)` function and a `generate[Name]Text(data)` function
4. Export a `send[Name]Email(payload, ...)` function that calls `payload.sendEmail()`:
   ```ts
   await payload.sendEmail({
     to: email,
     from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
     subject: 'Your subject — ORCACLUB',
     html: generateMyEmailHTML(data),
     text: generateMyEmailText(data),
   })
   ```

---

## Sending Pattern

All emails send via `payload.sendEmail()`. Never use nodemailer directly.

```ts
import type { Payload } from 'payload'

export async function sendMyEmail(
  payload: Payload,
  email: string,
  data: MyData
): Promise<void> {
  try {
    await payload.sendEmail({
      to: email,
      from: process.env.EMAIL_FROM || 'carbon@orcaclub.pro',
      subject: 'Subject — ORCACLUB',
      html: generateMyEmailHTML(data),
      text: generateMyEmailText(data),
    })
    payload.logger.info(`[MyEmail] Sent to ${email}`)
  } catch (error) {
    payload.logger.error(`[MyEmail] Failed to send to ${email}:`, error)
    throw error
  }
}
```

**From address note**: `process.env.EMAIL_FROM` is set to `carbon@orcaclub.pro` in `.env.local`. However, Gmail SMTP overrides the From address with the authenticated user (`SMTP_USER=chance@orcaclub.pro`). To fix this permanently, either: (1) add `carbon@orcaclub.pro` as a verified "Send mail as" alias in Gmail settings for `chance@`, (2) update `SMTP_USER` to `carbon@`, or (3) switch to a transactional provider like Resend via `@payloadcms/email-resend`.

---

## File Locations

```
src/
├── lib/
│   ├── email/
│   │   └── templates/
│   │       ├── base.ts                        ← shared shell (base-injected templates)
│   │       ├── index.ts                       ← public API — import from here
│   │       ├── contact-confirmation.ts
│   │       ├── contact-admin-notification.ts
│   │       ├── booking-confirmation.ts
│   │       └── client-welcome.ts
│   └── payload/
│       └── utils/
│           ├── passwordReset.ts               ← standalone (reference implementation)
│           ├── twoFactor.ts                   ← standalone (code display pattern)
│           ├── loginTwoFactor.ts              ← standalone (minimal login code)
│           ├── genericInvoiceEmailTemplate.ts ← standalone (line items pattern)
│           └── stripePaymentEmailTemplate.ts  ← standalone (payment link pattern)
```

---

## Email Client Compatibility Notes

| Client | `<style>` blocks | Web fonts | Notes |
|--------|-----------------|-----------|-------|
| Gmail (web) | ❌ Stripped | ❌ Ignored | Inline styles only; Cinzel Decorative falls back to Georgia |
| Gmail (iOS/Android) | ❌ Stripped | ❌ Ignored | Same as web |
| Apple Mail | ✅ Supported | ✅ Supported | Cinzel Decorative renders |
| Outlook (desktop) | ⚠️ Partial | ❌ Ignored | Uses Word rendering engine; test table layouts |
| Outlook.com | ✅ Supported | ✅ Supported | Web fonts render |
| Yahoo Mail | ✅ Supported | ✅ Supported | Web fonts render |

**Key rule**: Always inline styles. Never rely on `<style>` or class names. The `<link>` to Google Fonts in `<head>` is safe — clients that don't support it gracefully fall back to `Georgia, serif` for the ORCACLUB wordmark.
