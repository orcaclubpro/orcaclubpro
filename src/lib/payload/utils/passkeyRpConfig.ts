/**
 * WebAuthn Relying Party configuration derived from environment
 */
export function getRpConfig() {
  const serverUrl =
    process.env.NEXT_PUBLIC_SERVER_URL ||
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://orcaclub.pro')
  const url = new URL(serverUrl)
  const rpID = url.hostname
  const origin = rpID === 'localhost' ? 'http://localhost:3000' : serverUrl
  return { rpID, origin, rpName: 'ORCACLUB' }
}
