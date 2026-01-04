/**
 * Base email template wrapper
 * Provides consistent ORCACLUB branding and structure
 */

interface BaseTemplateProps {
  content: string
}

export function baseEmailTemplate({ content }: BaseTemplateProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; background-color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" style="max-width: 560px;" cellspacing="0" cellpadding="0" border="0">

          <!-- Header -->
          <tr>
            <td style="padding: 0 0 32px 0;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 700; color: #000000; letter-spacing: 0.5px;">ORCACLUB</h1>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #737373; letter-spacing: 0.5px;">EST 2025</p>
            </td>
          </tr>

          ${content}

          <!-- Signature -->
          <tr>
            <td style="padding: 32px 0 0 0; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: #000000;">ORCACLUB</p>
              <p style="margin: 0; font-size: 13px; color: #737373;">orcaclub.pro</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Base text email template
 */
interface BaseTextTemplateProps {
  content: string
}

export function baseTextTemplate({ content }: BaseTextTemplateProps): string {
  return `ORCACLUB
EST 2025

${content}

---
ORCACLUB
orcaclub.pro
  `.trim()
}
