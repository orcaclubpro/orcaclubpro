/**
 * Client Welcome Email Template
 * Sent when a new client account is created — prompts the client to set up their password.
 */

export interface ClientWelcomeData {
  name: string
  setupUrl: string
}

export function clientWelcomeSubject(): string {
  return 'Welcome to ORCACLUB — Set up your account'
}

export function clientWelcomeHTML({ name, setupUrl }: ClientWelcomeData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ORCACLUB</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background-color:#000000;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">

  <!-- Outer wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td style="padding:48px 20px;">

        <!-- Card -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="max-width:520px;width:100%;background-color:#080808;border:1px solid #111111;">

          <!-- ── Header: wordmark ── -->
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Client Portal</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Body ── -->
          <tr>
            <td style="padding:40px 40px 0 40px;">

              <!-- Label -->
              <p style="margin:0 0 14px 0;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;color:#3a3a3a;font-weight:400;">Account Setup</p>

              <!-- Heading -->
              <p style="margin:0;font-size:22px;font-weight:200;color:#ffffff;letter-spacing:0.01em;line-height:1.3;">Welcome to ORCACLUB.</p>

              <!-- Cyan accent hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:18px;">
                <tr>
                  <td style="width:24px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                </tr>
              </table>

              <!-- Greeting -->
              <p style="margin:32px 0 0 0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">Hello ${name},</p>

              <!-- Body copy -->
              <p style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.8;font-weight:300;">You've been set up as a client on ORCACLUB. Click the button below to choose your password and access your client portal. This link expires in <span style="color:#888888;">7 days</span>.</p>

            </td>
          </tr>

          <!-- ── CTA Button ── -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${setupUrl}" style="display:inline-block;padding:13px 28px;font-size:11px;font-weight:600;color:#000000;text-decoration:none;letter-spacing:0.12em;text-transform:uppercase;">Set Up Your Account</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Fallback URL ── -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <p style="margin:0 0 6px 0;font-size:11px;color:#2e2e2e;letter-spacing:0.01em;line-height:1.5;">If the button doesn't work, paste this into your browser:</p>
              <p style="margin:0;font-size:11px;color:#3a5a5e;word-break:break-all;line-height:1.6;"><a href="${setupUrl}" style="color:#3a5a5e;text-decoration:none;">${setupUrl}</a></p>
            </td>
          </tr>

          <!-- ── Footer note ── -->
          <tr>
            <td style="padding:28px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p style="margin:0;font-size:11px;color:#2e2e2e;line-height:1.7;font-weight:300;">Once you've set your password, you'll be able to view your projects, orders, and more in the portal. Questions? Reach us at <a href="mailto:chance@orcaclub.pro" style="color:#2a6068;text-decoration:none;">chance@orcaclub.pro</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer ── -->
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
</html>`
}

export function clientWelcomeText({ name, setupUrl }: ClientWelcomeData): string {
  return `Welcome to ORCACLUB, ${name}.

You've been set up as a client on ORCACLUB. Visit the link below to choose your password and access your client portal:

${setupUrl}

This setup link is valid for 7 days.

Once you've set your password, you'll be able to view your projects, orders, and more in the portal. If you have any questions, reach us at chance@orcaclub.pro.

---
ORCACLUB - Technical Operations Development Studio
https://orcaclub.pro
© 2025 ORCACLUB. All rights reserved.`.trim()
}
