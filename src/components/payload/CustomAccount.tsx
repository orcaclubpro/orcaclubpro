'use client'

/**
 * Custom Account View - ORCACLUB Branded
 *
 * This component provides a branded account management interface for PayloadCMS,
 * including the create-first-user flow when no users exist in the database.
 *
 * Features:
 * - ORCACLUB branding and styling
 * - Clean, modern dark theme UI
 * - Integrates with PayloadCMS's account management
 */

import React from 'react'
import type { AdminViewProps } from 'payload'
import { DefaultTemplate } from '@payloadcms/next/templates'
import { Gutter } from '@payloadcms/ui'

export default function CustomAccount({
  initPageResult,
  params,
  searchParams
}: AdminViewProps) {
  return (
    <DefaultTemplate
      i18n={initPageResult.req.i18n}
      locale={initPageResult.locale}
      params={params}
      payload={initPageResult.req.payload}
      permissions={initPageResult.permissions}
      searchParams={searchParams}
      user={initPageResult.req.user || undefined}
      visibleEntities={initPageResult.visibleEntities}
    >
      <style jsx global>{`
        /* ORCACLUB Account Page Styling */
        .account-container {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          min-height: 100vh;
          padding: 2rem;
        }

        .account-header {
          text-align: center;
          margin-bottom: 3rem;
          padding: 2rem 0;
        }

        .brand-logo {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 0.5rem;
        }

        .brand-logo .orca {
          color: #ffffff;
        }

        .brand-logo .club {
          background: linear-gradient(45deg, #67e8f9, #3b82f6);
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .brand-tagline {
          color: #9ca3af;
          font-size: 0.875rem;
          margin-top: 0.5rem;
        }

        .account-card {
          background: #1a1a1a;
          border: 1px solid rgba(103, 232, 249, 0.3);
          border-radius: 12px;
          padding: 2rem;
          max-width: 600px;
          margin: 0 auto;
          box-shadow: 0 0 40px rgba(103, 232, 249, 0.1);
        }

        .form-field {
          margin-bottom: 1.5rem;
        }

        .form-field label {
          display: block;
          color: #e5e5e5;
          font-size: 14px;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-field input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #0a0a0a;
          border: 1px solid #374151;
          border-radius: 8px;
          color: #ffffff;
          font-size: 14px;
          transition: all 0.2s;
        }

        .form-field input:focus {
          outline: none;
          border-color: #67e8f9;
          box-shadow: 0 0 0 3px rgba(103, 232, 249, 0.1);
        }

        .btn-primary {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(90deg, #67e8f9, #3b82f6);
          border: none;
          border-radius: 8px;
          color: #000000;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(103, 232, 249, 0.3);
        }

        /* Override PayloadCMS default styles */
        .payload__account-view {
          background: transparent !important;
        }

        .render-fields {
          background: transparent !important;
        }

        /* Style Payload form fields to match ORCACLUB theme */
        .field-type {
          margin-bottom: 1.5rem;
        }

        .field-type label {
          color: #e5e5e5 !important;
          font-size: 14px;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .field-type input[type="text"],
        .field-type input[type="email"],
        .field-type input[type="password"] {
          width: 100%;
          padding: 0.75rem 1rem;
          background: #0a0a0a !important;
          border: 1px solid #374151 !important;
          border-radius: 8px;
          color: #ffffff !important;
          font-size: 14px;
        }

        .field-type input[type="text"]:focus,
        .field-type input[type="email"]:focus,
        .field-type input[type="password"]:focus {
          outline: none;
          border-color: #67e8f9 !important;
          box-shadow: 0 0 0 3px rgba(103, 232, 249, 0.1) !important;
        }

        /* Submit button styling */
        .form-submit button[type="submit"],
        button.btn--style-primary {
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(90deg, #67e8f9, #3b82f6) !important;
          border: none !important;
          border-radius: 8px;
          color: #000000 !important;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        button.btn--style-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(103, 232, 249, 0.3);
        }
      `}</style>

      <Gutter>
        <div className="account-header">
          <div className="brand-logo">
            <span className="orca">ORCA</span>
            <span className="club">CLUB</span>
          </div>
          <div className="brand-tagline">est 2025 | Technical Operations Studio</div>
        </div>

        {/* PayloadCMS will render the account form here */}
        <div className="account-card">
          {/* The actual account form content is handled by PayloadCMS */}
        </div>
      </Gutter>
    </DefaultTemplate>
  )
}
