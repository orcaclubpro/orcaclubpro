/**
 * WebAuthn Relying Party configuration derived from environment
 */
export function getRpConfig() {
  // NODE_ENV is checked before NEXT_PUBLIC_SERVER_URL on purpose: that var holds
  // the production URL even in local dev, and an rpID must be a registrable-domain
  // suffix of the origin the ceremony runs on. Reading it first gave localhost an
  // rpID of `orcaclub.pro`, which the browser rejects outright.
  const serverUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_SERVER_URL || 'https://orcaclub.pro'
  const url = new URL(serverUrl)
  const rpID = url.hostname
  const origin = rpID === 'localhost' ? 'http://localhost:3000' : serverUrl
  return { rpID, origin, rpName: 'ORCACLUB' }
}
