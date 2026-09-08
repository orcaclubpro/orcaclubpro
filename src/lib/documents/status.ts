/**
 * Execution tracking for generated agreements.
 *
 * `documentStatus` moves draft → sent → executed. Only the first of those two
 * steps is ever inferred: a send marks the document sent, and nothing marks it
 * executed except a person confirming the countersigned copy came back.
 */

/**
 * Record that a document was emailed out.
 *
 * Called from every send path — the Files tab and the package Documents modal —
 * so the status column means the same thing wherever a contract went out from.
 * Two rules:
 *
 *  1. Never regress. Re-sending a countersigned agreement is a normal thing to
 *     do, and it must not walk `executed` back to `sent`.
 *  2. Never fail the send. The mail is already gone by the time this runs, so a
 *     failed status write is logged and swallowed — reporting failure here would
 *     tell staff to send a contract that has already been sent.
 */
export async function markDocumentSent(
  payload: any,
  fileId: string | null | undefined,
): Promise<void> {
  if (!fileId) return
  try {
    const file = await payload.findByID({ collection: 'files', id: fileId, depth: 0 })
    if (!file) return

    await payload.update({
      collection: 'files',
      id: fileId,
      data: {
        ...(file.documentStatus === 'executed' ? {} : { documentStatus: 'sent' }),
        sentAt: new Date().toISOString(),
      } as any,
    })
  } catch (err) {
    console.error('[markDocumentSent] status update failed:', err)
  }
}
