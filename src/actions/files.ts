'use server'

import { getCurrentUser } from '@/actions/auth'
import { getPayload } from 'payload'
import config from '@payload-config'
import { baseEmailTemplate } from '@/lib/email/templates/base'
import {
  buildPersonalNdaPdf,
  buildOrcaclubNdaPdf,
  buildPersonalSowPdf,
  buildOrcaclubSowPdf,
} from '@/lib/pdf-generators'

export async function createDocument({
  name,
  description,
  documentTemplate,
  documentBrand,
  documentData,
  projectId,
  sprintId,
}: {
  name: string
  description?: string
  documentTemplate: 'nda' | 'sow'
  documentBrand: 'personal' | 'orcaclub'
  documentData: object
  projectId?: string
  sprintId?: string
}): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'user')) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })

    const doc = await payload.create({
      collection: 'files',
      data: {
        name,
        description,
        fileType: 'document',
        documentTemplate,
        documentBrand,
        documentData,
        ...(projectId ? { project: projectId } : {}),
        ...(sprintId ? { sprint: sprintId } : {}),
      } as any,
    })

    return { success: true, id: doc.id }
  } catch (error) {
    console.error('[createDocument]', error)
    return { success: false, error: 'Failed to save document' }
  }
}

export async function updateDocument(
  id: string,
  {
    name,
    description,
    documentTemplate,
    documentBrand,
    documentData,
    projectId,
    sprintId,
  }: {
    name: string
    description?: string
    documentTemplate: 'nda' | 'sow'
    documentBrand: 'personal' | 'orcaclub'
    documentData: object
    projectId?: string
    sprintId?: string
  },
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'user')) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })

    await payload.update({
      collection: 'files',
      id,
      data: {
        name,
        description,
        documentTemplate,
        documentBrand,
        documentData,
        ...(projectId ? { project: projectId } : { project: null }),
        ...(sprintId ? { sprint: sprintId } : { sprint: null }),
      } as any,
    })

    return { success: true }
  } catch (error) {
    console.error('[updateDocument]', error)
    return { success: false, error: 'Failed to update document' }
  }
}

export async function sendDocumentEmail(
  fileId: string,
  recipients: { email: string; name?: string }[],
  message?: string,
): Promise<{ success: boolean; sent?: number; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'user')) {
      return { success: false, error: 'Unauthorized' }
    }

    if (!recipients.length) {
      return { success: false, error: 'No recipients specified' }
    }

    const payload = await getPayload({ config })

    const file = await payload.findByID({
      collection: 'files',
      id: fileId,
      depth: 0,
    })

    if (!file) return { success: false, error: 'File not found' }

    console.log(`[sendDocumentEmail] file id=${file.id} template=${file.documentTemplate} brand=${file.documentBrand} hasData=${!!file.documentData}`)

    // Generate PDF
    let pdfBase64: string | null = null
    let pdfFilename = 'document.pdf'

    const template = file.documentTemplate as string | null | undefined
    const hasData = file.documentData != null

    if (hasData && (template === 'nda' || template === 'sow')) {
      try {
        const data = file.documentData as any
        const brand = (file.documentBrand as string) ?? 'orcaclub'
        let bytes: Uint8Array

        if (template === 'nda') {
          bytes = brand === 'personal'
            ? await buildPersonalNdaPdf(data)
            : await buildOrcaclubNdaPdf(data)
          pdfFilename = `NDA_${(data.clientName || 'Client').replace(/\s+/g, '_')}.pdf`
        } else {
          bytes = brand === 'personal'
            ? await buildPersonalSowPdf(data)
            : await buildOrcaclubSowPdf(data)
          pdfFilename = `SOW_${(data.projectName || data.clientName || 'Project').replace(/\s+/g, '_')}.pdf`
        }

        pdfBase64 = Buffer.from(bytes).toString('base64')
        console.log(`[sendDocumentEmail] PDF ready (${template}, ${bytes.byteLength} bytes): ${pdfFilename}`)
      } catch (err) {
        console.error('[sendDocumentEmail] PDF generation failed:', err)
        // Log the data shape to help diagnose
        console.error('[sendDocumentEmail] documentData keys:', Object.keys(file.documentData as any || {}))
      }
    } else {
      console.log(`[sendDocumentEmail] Skipping PDF: hasData=${hasData} template=${template}`)
    }

    const docTypeLabel =
      file.documentTemplate === 'nda' ? 'Non-Disclosure Agreement'
      : file.documentTemplate === 'sow' ? 'Scope of Work'
      : file.fileType
        ? file.fileType.charAt(0).toUpperCase() + file.fileType.slice(1)
        : 'Document'

    const fileUrl = file.file && typeof file.file === 'object'
      ? (file.file as any).url as string | undefined
      : undefined

    const content = `
      <tr>
        <td style="padding:32px 40px 8px 40px;">
          <p class="oc-eyebrow" style="margin:0 0 10px 0;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#4a4a4a;">Document Shared</p>
          <h1 class="oc-heading" style="margin:0;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">${file.name}</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 40px 24px 40px;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td class="oc-detail-box-lborder" style="background-color:#0e0e0e;border:1px solid #1a1a1a;border-left:3px solid #67e8f9;border-radius:6px;padding:14px 16px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                  <tr>
                    <td style="padding-bottom:${file.documentBrand ? '8px' : '0'};">
                      <span class="oc-detail-label" style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4a4a4a;">Document Type</span><br>
                      <span class="oc-detail-val" style="font-size:14px;font-weight:500;color:#e0e0e0;">${docTypeLabel}</span>
                    </td>
                  </tr>
                  ${file.documentBrand ? `<tr><td><span class="oc-detail-label" style="font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4a4a4a;">Branding</span><br><span class="oc-detail-val" style="font-size:14px;font-weight:500;color:#e0e0e0;">${file.documentBrand === 'orcaclub' ? 'ORCACLUB' : 'Personal'}</span></td></tr>` : ''}
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      ${message ? `
      <tr>
        <td style="padding:0 40px 24px 40px;">
          <p class="oc-detail-label" style="margin:0 0 6px 0;font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#4a4a4a;">Message</p>
          <p class="oc-body-text" style="margin:0;font-size:14px;color:#aaaaaa;line-height:1.6;">${message.replace(/\n/g, '<br>')}</p>
        </td>
      </tr>` : ''}
      ${pdfBase64 ? `
      <tr>
        <td style="padding:0 40px 8px 40px;">
          <p class="oc-body-text" style="margin:0;font-size:13px;color:#5a5a5a;line-height:1.6;">The document is attached to this email as a PDF.</p>
        </td>
      </tr>` : fileUrl ? `
      <tr>
        <td style="padding:0 40px 24px 40px;text-align:center;">
          <a href="${fileUrl}" style="display:inline-block;background-color:#67e8f9;color:#000000;font-size:13px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">Download Document</a>
        </td>
      </tr>` : ''}
      <tr>
        <td style="padding:16px 40px 32px 40px;">
          <p class="oc-muted" style="margin:0;font-size:12px;color:#3a3a3a;line-height:1.5;">This document was sent from ORCACLUB. For questions, contact <a href="mailto:chance@orcaclub.pro" style="color:#67e8f9;text-decoration:none;">chance@orcaclub.pro</a>.</p>
        </td>
      </tr>
    `

    const html = baseEmailTemplate({ content })

    const text = [
      `Document Shared: ${file.name}`,
      '',
      `Type: ${docTypeLabel}`,
      file.documentBrand ? `Branding: ${file.documentBrand === 'orcaclub' ? 'ORCACLUB' : 'Personal'}` : '',
      message ? `\nMessage:\n${message}` : '',
      pdfBase64 ? '\nThe document is attached as a PDF.' : fileUrl ? `\nDownload: ${fileUrl}` : '',
      '',
      'For questions, contact chance@orcaclub.pro',
      'ORCACLUB | Technical Operations Development Studio',
    ].filter(Boolean).join('\n')

    let sent = 0
    for (const recipient of recipients) {
      try {
        if (pdfBase64) {
          console.log(`[sendDocumentEmail] Sending to ${recipient.email} WITH attachment: ${pdfFilename}`)
          await payload.sendEmail({
            to: recipient.email,
            subject: `Document from ORCACLUB: ${file.name}`,
            html,
            text,
            attachments: [
              {
                filename: pdfFilename,
                content: pdfBase64,
                encoding: 'base64',
                contentType: 'application/pdf',
              },
            ],
          } as any)
        } else {
          console.log(`[sendDocumentEmail] Sending to ${recipient.email} without attachment`)
          await payload.sendEmail({
            to: recipient.email,
            subject: `Document from ORCACLUB: ${file.name}`,
            html,
            text,
          })
        }
        sent++
      } catch (err) {
        console.error(`[sendDocumentEmail] Failed to send to ${recipient.email}:`, err)
      }
    }

    return { success: sent > 0, sent }
  } catch (error) {
    console.error('[sendDocumentEmail]', error)
    return { success: false, error: 'Failed to send document' }
  }
}

export async function deleteFileRecord(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const user = await getCurrentUser()
    if (!user || (user.role !== 'admin' && user.role !== 'user')) {
      return { success: false, error: 'Unauthorized' }
    }

    const payload = await getPayload({ config })
    await payload.delete({ collection: 'files', id })
    return { success: true }
  } catch (error) {
    console.error('[deleteFileRecord]', error)
    return { success: false, error: 'Failed to delete file' }
  }
}
