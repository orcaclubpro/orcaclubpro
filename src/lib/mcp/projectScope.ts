/**
 * Scope pin for the MCP `project_create` tool.
 *
 * Bots may create projects only under ORCACLUB's own internal client account
 * (Chance Noonan). Work there needs no approval (Chance, 2026-11-02). Any other
 * client account, or none, is a real client, and creating a project for one
 * stays a human decision: the tool returns a needs-chance error instead.
 *
 * The id is a pinned constant, not an env value, so nothing at runtime can widen
 * it. It matches SCOPE_CLIENT in the ops poller.
 */
export const MCP_PROJECT_CLIENT_ID = '699bce7bf14753ae5d17cf8d'

export type ProjectScopeResult = { ok: true; clientId: string } | { ok: false; error: string }

export function checkProjectCreateScope(clientAccountId: unknown): ProjectScopeResult {
  const id = typeof clientAccountId === 'string' ? clientAccountId.trim() : ''
  if (id === MCP_PROJECT_CLIENT_ID) return { ok: true, clientId: id }
  return {
    ok: false,
    error:
      `needs-chance: project_create only creates projects under the internal client account ` +
      `${MCP_PROJECT_CLIENT_ID}. ${id ? `Client account ${id} is` : 'A project with no client account is'} ` +
      'outside that scope. Ask Chance to create it in the portal.',
  }
}
