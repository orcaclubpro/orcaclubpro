/**
 * Base email template wrapper
 * Provides consistent ORCACLUB dark branding and structure.
 *
 * Inline styles are the primary design (Gmail-compatible dark theme).
 * The EMAIL_LIGHT_MODE_STYLES <style> block adds @media (prefers-color-scheme: light)
 * overrides for Apple Mail, Outlook.com, Yahoo Mail, etc. Gmail strips <style>
 * blocks entirely, so inline dark styles remain as the Gmail fallback.
 *
 * The `content` parameter must contain <tr> elements; they are injected
 * directly into the inner <tbody> of the card body table.
 */

interface BaseTemplateProps {
  content: string
}

export const EMAIL_LIGHT_MODE_STYLES = `
  <style>
    @media (prefers-color-scheme: light) {
      body { background-color: #f0f0f0 !important; }
      .oc-outer-td { background-color: #f0f0f0 !important; }
      .oc-card { background-color: #ffffff !important; border-color: #e0e0e0 !important; }
      .oc-header-td { border-bottom-color: #e8e8e8 !important; }
      .oc-header-label { color: #aaaaaa !important; }
      .oc-heading { color: #111111 !important; }
      .oc-eyebrow { color: #888888 !important; }
      .oc-detail-box { background-color: #f5f5f5 !important; border-color: #e8e8e8 !important; }
      .oc-detail-box-lborder { background-color: #f5f5f5 !important; border-color: #e8e8e8 !important; border-left-color: #67e8f9 !important; }
      .oc-detail-label { color: #888888 !important; }
      .oc-detail-key { color: #777777 !important; }
      .oc-detail-val { color: #333333 !important; }
      .oc-body-text { color: #333333 !important; }
      .oc-footer-note-td { border-top-color: #e8e8e8 !important; }
      .oc-muted { color: #555555 !important; }
      .oc-footer-bar { background-color: #eeeeee !important; border-top-color: #e0e0e0 !important; }
      .oc-footer-orca { color: #555555 !important; }
      .oc-footer-club { color: #0d8fa3 !important; }
      .oc-footer-link { color: #888888 !important; }
      .oc-url-text { color: #0d8fa3 !important; }
      .oc-url-text a { color: #0d8fa3 !important; }
      .oc-warn-box { background-color: #fff5f5 !important; border-color: #ffcccc !important; border-left-color: #ff8888 !important; }
      .oc-warn-text { color: #cc2222 !important; }
      .oc-warn-text a { color: #cc2222 !important; }
      .oc-code-box { background-color: #f0fbff !important; }
      .oc-code { color: #0e7490 !important; }
      .oc-code-label { color: #888888 !important; }
      .oc-hairline { background-color: #e0e0e0 !important; }
      .oc-item-divider { border-bottom-color: #e8e8e8 !important; }
      .oc-total-label { color: #888888 !important; }
      .oc-bill-name { color: #222222 !important; }
      .oc-item-name { color: #222222 !important; }
      .oc-item-total { color: #222222 !important; }
    }
  </style>`

export function baseEmailTemplate({ content }: BaseTemplateProps): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
  ${EMAIL_LIGHT_MODE_STYLES}
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" class="oc-card" style="max-width:520px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- Header: wordmark -->
          <tr>
            <td class="oc-header-td" style="padding:32px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body: injected content rows -->
          <tr>
            <td style="padding:40px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tbody>
                  ${content}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Footer bar -->
          <tr>
            <td class="oc-footer-bar" style="padding:18px 40px;border-top:1px solid #0a0a0a;background-color:#050505;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span class="oc-footer-orca" style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1f1f1f;">ORCA</span><span class="oc-footer-club" style="font-family:'Cinzel Decorative',Georgia,serif;font-size:10px;font-weight:700;color:#1a3a3e;">CLUB</span>
                  </td>
                  <td align="right">
                    <a href="https://orcaclub.pro" class="oc-footer-link" style="font-size:10px;color:#1f1f1f;text-decoration:none;font-weight:300;letter-spacing:0.02em;">orcaclub.pro</a>
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
</html>`.trim()
}

/**
 * Base text email template
 */
interface BaseTextTemplateProps {
  content: string
}

export function baseTextTemplate({ content }: BaseTextTemplateProps): string {
  return `ORCACLUB

${content}

---
ORCACLUB
orcaclub.pro
  `.trim()
}
