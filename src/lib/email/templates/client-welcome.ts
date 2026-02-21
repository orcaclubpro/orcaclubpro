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
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to ORCACLUB</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #000000;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            border-radius: 12px;
            border: 1px solid #67e8f9;
            overflow: hidden;
          }
          .header {
            background: linear-gradient(45deg, #67e8f9, #3b82f6, #1e40af, #67e8f9);
            background-size: 300% 300%;
            padding: 40px 20px;
            text-align: center;
            color: white;
          }
          .brand {
            font-size: 32px;
            font-weight: bold;
            margin: 0;
          }
          .brand-club {
            background: linear-gradient(45deg, #67e8f9, #3b82f6);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          .tagline {
            font-size: 12px;
            color: #a5f3fc;
            margin: 5px 0 0 0;
          }
          .content {
            padding: 40px 30px;
            color: #e5e5e5;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
            color: #ffffff;
          }
          .message {
            font-size: 16px;
            line-height: 1.8;
            margin: 20px 0;
            color: #d1d5db;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .setup-button {
            display: inline-block;
            padding: 16px 40px;
            background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%);
            border: 2px solid #67e8f9;
            border-radius: 8px;
            color: #ffffff;
            text-decoration: none;
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
            box-shadow: 0 0 20px rgba(103, 232, 249, 0.3);
          }
          .info {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #93c5fd;
          }
          .alternative-link {
            background: rgba(59, 130, 246, 0.1);
            border: 1px solid #3b82f6;
            border-radius: 6px;
            padding: 15px;
            margin: 25px 0;
            word-break: break-all;
          }
          .alternative-link p {
            margin: 5px 0;
            font-size: 14px;
            color: #9ca3af;
          }
          .alternative-link a {
            color: #67e8f9;
            text-decoration: none;
            font-size: 13px;
          }
          .footer {
            background: #0a0a0a;
            padding: 30px;
            text-align: center;
            color: #9ca3af;
            font-size: 14px;
            border-top: 1px solid #374151;
          }
          .footer-link {
            color: #67e8f9;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="brand">
              ORCA<span class="brand-club">CLUB</span>
            </h1>
            <p class="tagline">est 2025</p>
          </div>

          <div class="content">
            <p class="greeting">Welcome, ${name}.</p>

            <p class="message">
              You've been set up as a client on <strong>ORCACLUB</strong>. Click the button below to choose your password and access your client portal.
            </p>

            <div class="button-container">
              <a href="${setupUrl}" class="setup-button">Set Up Your Account</a>
            </div>

            <div class="info">
              ⏰ <strong>Link expiry:</strong> This setup link is valid for <strong>7 days</strong>. After that, contact us to request a new one.
            </div>

            <div class="alternative-link">
              <p><strong>Button not working?</strong> Copy and paste this link into your browser:</p>
              <a href="${setupUrl}">${setupUrl}</a>
            </div>

            <p class="message">
              Once you've set your password, you'll be able to view your projects, orders, and more in the portal. If you have any questions, reach us at <a href="mailto:chance@orcaclub.pro" class="footer-link">chance@orcaclub.pro</a>.
            </p>
          </div>

          <div class="footer">
            <p style="margin: 0 0 10px 0;">
              <strong style="color: #ffffff;">ORCA<span style="color: #67e8f9;">CLUB</span></strong> - Technical Operations Development Studio
            </p>
            <p style="margin: 5px 0;">
              <a href="https://orcaclub.pro" class="footer-link">orcaclub.pro</a>
            </p>
            <p style="margin: 15px 0 5px 0; font-size: 12px;">
              © 2025 ORCACLUB. All rights reserved.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
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
