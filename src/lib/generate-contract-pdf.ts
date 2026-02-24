import os from 'os'
import path from 'path'
import fs from 'fs'
import puppeteer from 'puppeteer'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateContractHTML } from './contract-html'

/**
 * Generates a PDF of the signed contract, uploads it to Media + Files collections,
 * and saves the Files document ID back onto the Package.
 *
 * Safe to call multiple times — skips generation if contractFile is already set.
 * Non-blocking: call as `generateContractPDF(payload, packageId, pkg).catch(...)`.
 */
export async function generateContractPDF(
  payload: Awaited<ReturnType<typeof getPayload>>,
  packageId: string,
  pkg: any,
): Promise<{ fileId: string; mediaUrl: string | null } | null> {
  // Guard: skip if already generated
  if (pkg.contractFile) return null

  // Build filename using the LATER of the two signature timestamps
  const clientSignedAt   = pkg.clientSignature?.signedAt   ?? pkg.createdAt
  const orcaclubSignedAt = pkg.orcaclubSignature?.authorizedAt ?? pkg.createdAt
  const contractDatetime = new Date(
    Math.max(new Date(clientSignedAt).getTime(), new Date(orcaclubSignedAt).getTime()),
  )
  const shortId = packageId.slice(-6).toUpperCase()
  // Sanitize datetime for filesystem: "2026-02-23T14-30-00Z"
  const datetimeStr = contractDatetime.toISOString().replace(/:/g, '-').replace(/\.\d+Z$/, 'Z')
  const filename = `contract_PKG-${shortId}_${datetimeStr}.pdf`
  const tmpPath  = path.join(os.tmpdir(), filename)

  try {
    // Generate HTML and produce PDF via Puppeteer
    const html = generateContractHTML(pkg)
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    })
    try {
      const page = await browser.newPage()
      page.setDefaultTimeout(30_000)
      // setContent lets Google Fonts load without needing auth
      await page.setContent(html, { waitUntil: 'networkidle0' })
      const pdfBuffer = await page.pdf({
        format: 'Letter',
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      })
      fs.writeFileSync(tmpPath, pdfBuffer)
    } finally {
      await browser.close()
    }

    // Upload to Media collection
    const mediaDoc = await payload.create({
      collection: 'media',
      data: { alt: filename } as any,
      filePath: tmpPath,
    })

    // Create Files document
    const fileDoc = await payload.create({
      collection: 'files',
      data: {
        name: filename,
        fileType: 'pdf',
        file: mediaDoc.id,
        tags: ['contract', 'signed'],
        description: `Fully executed service agreement for ${pkg.name ?? packageId}`,
      } as any,
    })

    // Save reference back to Package
    await payload.update({
      collection: 'packages',
      id: packageId,
      data: { contractFile: fileDoc.id } as any,
    })

    return { fileId: String(fileDoc.id), mediaUrl: (mediaDoc as any).url ?? null }
  } finally {
    // Cleanup temp file — best-effort, always runs even on error
    try {
      fs.unlinkSync(tmpPath)
    } catch {
      // ignore — temp file cleanup is best-effort
    }
  }
}
