/**
 * Client Welcome Email — Spaces Onboarding
 * Sent when a new client account is created.
 * Subject: Welcome to Spaces | ORCACLUB
 */

export interface ClientWelcomeData {
  name: string
  setupUrl: string
}

const LOGIN_URL = 'https://orcaclub.pro/login'

export function clientWelcomeSubject(): string {
  return 'Welcome to Spaces | ORCACLUB'
}

export function clientWelcomeHTML({ name, setupUrl }: ClientWelcomeData): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Spaces — ORCACLUB</title>
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

          <!-- ── Header: wordmark + label ── -->
          <tr>
            <td style="padding:32px 40px 24px 40px;border-bottom:1px solid #0f0f0f;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td>
                    <span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#333333;">ORCA</span><span style="font-family:'Cinzel Decorative',Georgia,serif;font-size:13px;font-weight:700;color:#67e8f9;">CLUB</span>
                  </td>
                  <td align="right">
                    <span style="font-size:10px;letter-spacing:0.4em;color:#1f1f1f;text-transform:uppercase;font-weight:300;">Spaces</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── SPACES Hero ── -->
          <tr>
            <td style="padding:48px 40px 0 40px;">

              <!-- Eyebrow -->
              <p style="margin:0 0 22px 0;font-size:10px;letter-spacing:0.5em;text-transform:uppercase;color:#2a2a2a;font-weight:400;">Your workspace is ready</p>

              <!-- SPACES — gradient letters: deep cyan → bright cyan -->
              <p style="margin:0;line-height:1;letter-spacing:0.08em;">
                <span style="font-size:52px;font-weight:700;color:#1e9db3;">S</span><span style="font-size:52px;font-weight:700;color:#2aafd0;">P</span><span style="font-size:52px;font-weight:700;color:#38c2e8;">A</span><span style="font-size:52px;font-weight:700;color:#4ad2f2;">C</span><span style="font-size:52px;font-weight:700;color:#5ae0f8;">E</span><span style="font-size:52px;font-weight:700;color:#67e8f9;">S</span>
              </p>

              <!-- Sub-caption -->
              <p style="margin:14px 0 0 0;font-size:13px;color:#3a3a3a;line-height:1.5;font-weight:300;letter-spacing:0.03em;">Club account for managing your projects and payments.</p>

              <!-- Cyan hairline -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-top:32px;">
                <tr>
                  <td style="width:40px;height:1px;line-height:1px;font-size:1px;background-color:#2a6068;">&nbsp;</td>
                  <td style="width:8px;height:1px;line-height:1px;font-size:1px;background-color:#111111;">&nbsp;</td>
                  <td style="width:200px;height:1px;line-height:1px;font-size:1px;background-color:#111111;">&nbsp;</td>
                </tr>
              </table>

              <!-- Greeting -->
              <p style="margin:32px 0 0 0;font-size:13px;color:#555555;line-height:1.7;font-weight:300;">Hello ${name},</p>

              <!-- Body copy -->
              <p style="margin:12px 0 0 0;font-size:13px;color:#555555;line-height:1.9;font-weight:300;">Your ORCACLUB client account is live. Use the button below to set your password and step into your workspace — where your projects, invoices, and activity all live in one place.</p>

            </td>
          </tr>

          <!-- ── What you get: access bullets ── -->
          <tr>
            <td style="padding:28px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"
                     style="background-color:#0d0d0d;border:1px solid #161616;border-left:3px solid #67e8f9;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 14px 0;font-size:10px;font-weight:600;color:#2a2a2a;text-transform:uppercase;letter-spacing:0.5px;">Inside your Spaces</p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding:5px 0;">
                          <span style="font-size:11px;color:#1e9db3;font-weight:600;letter-spacing:0.05em;">&#8212;</span>
                          <span style="font-size:12px;color:#444444;font-weight:300;margin-left:10px;">Live project progress &amp; milestones</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;">
                          <span style="font-size:11px;color:#38c2e8;font-weight:600;letter-spacing:0.05em;">&#8212;</span>
                          <span style="font-size:12px;color:#444444;font-weight:300;margin-left:10px;">Invoices and payment history</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;">
                          <span style="font-size:11px;color:#67e8f9;font-weight:600;letter-spacing:0.05em;">&#8212;</span>
                          <span style="font-size:12px;color:#444444;font-weight:300;margin-left:10px;">Proposals and service packages</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Primary CTA ── -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:#67e8f9;">
                    <a href="${setupUrl}" style="display:inline-block;padding:14px 32px;font-size:11px;font-weight:700;color:#000000;text-decoration:none;letter-spacing:0.15em;text-transform:uppercase;">Set Up Your Account</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Secondary link: log in ── -->
          <tr>
            <td style="padding:16px 40px 0 40px;">
              <p style="margin:0;font-size:11px;color:#2e2e2e;font-weight:300;">
                Already set a password?
                <a href="${LOGIN_URL}" style="color:#3a5a5e;text-decoration:none;font-weight:400;">Log in to Spaces &#8250;</a>
              </p>
            </td>
          </tr>

          <!-- ── Fallback URL ── -->
          <tr>
            <td style="padding:24px 40px 0 40px;">
              <p style="margin:0 0 5px 0;font-size:10px;color:#232323;letter-spacing:0.01em;line-height:1.5;text-transform:uppercase;letter-spacing:0.08em;">Setup link</p>
              <p style="margin:0;font-size:11px;color:#2a4a4e;word-break:break-all;line-height:1.6;"><a href="${setupUrl}" style="color:#2a4a4e;text-decoration:none;">${setupUrl}</a></p>
            </td>
          </tr>

          <!-- ── Footer note ── -->
          <tr>
            <td style="padding:32px 40px 40px 40px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="border-top:1px solid #0f0f0f;padding-top:24px;">
                    <p style="margin:0;font-size:11px;color:#252525;line-height:1.8;font-weight:300;">This setup link expires in <span style="color:#333333;">7 days</span>. If you need a new one, use the forgot password flow on the login page. Questions? Reply to this email or reach us at <a href="mailto:carbon@orcaclub.pro" style="color:#2a6068;text-decoration:none;">carbon@orcaclub.pro</a>.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ── Footer bar ── -->
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
  return `ORCACLUB SPACES
━━━━━━━━━━━━━━━━━━━━

Welcome to Spaces, ${name}.

Your ORCACLUB client account is live. Set your password and step into your workspace — where your projects, invoices, and activity all live in one place.

INSIDE YOUR SPACES
━━━━━━━━━━━━━━━━━━━━
— Live project progress & milestones
— Invoices and payment history
— Proposals and service packages

SET UP YOUR ACCOUNT
${setupUrl}

This setup link is valid for 7 days. If you need a new one, use the forgot password flow at:
${LOGIN_URL}

Already set a password? Log in at:
${LOGIN_URL}

━━━━━━━━━━━━━━━━━━━━
Questions? Reply to this email or contact us at carbon@orcaclub.pro.

ORCACLUB
orcaclub.pro`.trim()
}
