#!/usr/bin/env node
/**
 * Provision or clear a Payload user API key for the MCP server.
 *
 * Why this exists instead of the admin panel: Payload declares both `enableAPIKey` and
 * `apiKey` with `admin: { components: { Field: false } }` (see
 * node_modules/payload/dist/auth/baseFields/apiKey.js), so neither field renders in the
 * admin UI. There is nothing to tick.
 *
 * Why it talks to Mongo directly instead of through Payload: the `apiKey` field's
 * `afterRead` hook calls `payload.decrypt()`. If the stored value is not already a valid
 * Payload-encrypted string, ANY read of that user throws ERR_CRYPTO_INVALID_IV — including
 * the read a fix would need to do first. Writing at the driver level is the only way to get
 * out of that state.
 *
 * It reproduces Payload's own scheme exactly, verified against the installed source:
 *   payload.secret = sha256(PAYLOAD_SECRET).hex().slice(0, 32)      index.js:252
 *   apiKey         = aes-256-ctr, stored as {32-hex IV}{hex ciphertext}   auth/crypto.js
 *   apiKeyIndex    = HMAC-SHA1(payload.secret, plaintextKey).hex()  baseFields/apiKey.js
 *
 * ── PAYLOAD_SECRET must match the environment that will READ the key ────────────────
 * `apiKeyIndex` is an HMAC under the secret, and API-key auth looks the user up by that
 * index. Provision with a different secret than production runs, and auth fails silently
 * with a 401 and no error in the log. This script prints a fingerprint of the secret it
 * used — compare it against the one your deployment uses before trusting the key.
 *
 * Usage:
 *   node scripts/mcp-api-key.mjs --email you@example.com --show
 *   node scripts/mcp-api-key.mjs --email you@example.com --clear --yes
 *   node scripts/mcp-api-key.mjs --email you@example.com --set   --yes
 *
 * --show   report current state, change nothing
 * --clear  unset enableAPIKey/apiKey/apiKeyIndex — use this to recover from a bad value
 * --set    generate a key, store it Payload-correctly, print the plaintext once
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'

const ALGORITHM = 'aes-256-ctr'

// ── Args ────────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2)
const flag = (n) => argv.includes(`--${n}`)
const val = (n) => {
  const i = argv.indexOf(`--${n}`)
  return i >= 0 ? argv[i + 1] : undefined
}

const email = val('email')
const mode = flag('set') ? 'set' : flag('clear') ? 'clear' : flag('show') ? 'show' : null

if (!email || !mode) {
  console.error('Usage: node scripts/mcp-api-key.mjs --email <email> (--show | --clear | --set) [--yes]')
  process.exit(1)
}
if (mode !== 'show' && !flag('yes')) {
  console.error(`Refusing to ${mode} without --yes. This writes to the database in DATABASE_URI.`)
  process.exit(1)
}

// ── Env ─────────────────────────────────────────────────────────────────────────

function loadEnv() {
  const out = {}
  for (const name of ['.env.local', '.env']) {
    const p = path.resolve(process.cwd(), name)
    if (!fs.existsSync(p)) continue
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#')) continue
      const i = t.indexOf('=')
      if (i < 0) continue
      const k = t.slice(0, i).trim()
      if (!(k in out)) out[k] = t.slice(i + 1).trim().replace(/^["']|["']$/g, '')
    }
  }
  return out
}

const env = { ...loadEnv(), ...process.env }
const uri = env.DATABASE_URI
const rawSecret = env.PAYLOAD_SECRET

if (!uri) throw new Error('DATABASE_URI is not set')
if (!rawSecret) throw new Error('PAYLOAD_SECRET is not set')

/** Exactly Payload's derivation — index.js:252. */
const payloadSecret = crypto.createHash('sha256').update(rawSecret).digest('hex').slice(0, 32)
const secretFingerprint = crypto.createHash('sha256').update(rawSecret).digest('hex').slice(0, 12)

// ── Payload's crypto, reproduced ────────────────────────────────────────────────

function encrypt(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, payloadSecret, iv)
  const enc = Buffer.concat([cipher.update(text), cipher.final()])
  return `${iv.toString('hex')}${enc.toString('hex')}`
}

function decrypt(hash) {
  const iv = hash.slice(0, 32)
  const content = hash.slice(32)
  const decipher = crypto.createDecipheriv(ALGORITHM, payloadSecret, Buffer.from(iv, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(content, 'hex')), decipher.final()]).toString()
}

function indexFor(plaintext) {
  return crypto.createHmac('sha1', payloadSecret).update(plaintext).digest('hex')
}

/** Prove the round-trip works before writing anything. */
function selfCheck() {
  const probe = crypto.randomUUID()
  if (decrypt(encrypt(probe)) !== probe) {
    throw new Error('Self-check failed: encrypt/decrypt did not round-trip.')
  }
}

/** Describe a stored apiKey without printing the credential. */
function describe(stored) {
  if (stored == null) return String(stored)
  const ivPart = stored.slice(0, 32)
  const validShape = /^[0-9a-f]{32}$/i.test(ivPart)
  let decrypts = false
  if (validShape) {
    try {
      decrypts = Boolean(decrypt(stored))
    } catch {
      decrypts = false
    }
  }
  return {
    length: stored.length,
    looksPayloadEncrypted: validShape,
    decryptsUnderThisSecret: decrypts,
    // The exact failure that breaks every read of this user:
    wouldThrowOnRead: !validShape,
  }
}

// ── Run ─────────────────────────────────────────────────────────────────────────

selfCheck()
console.log(`PAYLOAD_SECRET fingerprint: ${secretFingerprint}  (must match the env that reads the key)`)

await mongoose.connect(uri)
try {
  const users = mongoose.connection.db.collection('users')
  const user = await users.findOne(
    { email },
    { projection: { email: 1, role: 1, enableAPIKey: 1, apiKey: 1, apiKeyIndex: 1 } },
  )

  if (!user) {
    console.error(`No user with email ${email}`)
    process.exitCode = 1
  } else if (mode === 'show') {
    console.log({
      email: user.email,
      role: user.role,
      enableAPIKey: user.enableAPIKey ?? null,
      hasApiKeyIndex: Boolean(user.apiKeyIndex),
      apiKey: describe(user.apiKey ?? null),
    })
  } else if (mode === 'clear') {
    await users.updateOne(
      { _id: user._id },
      { $unset: { enableAPIKey: '', apiKey: '', apiKeyIndex: '' } },
    )
    console.log(`Cleared API key fields for ${email}. Reads of this user will no longer throw.`)
  } else {
    if (user.role === 'client') {
      console.error('Refusing: MCP is staff only and this user has role "client".')
      process.exitCode = 1
    } else {
      const plaintext = crypto.randomUUID()
      await users.updateOne(
        { _id: user._id },
        { $set: { enableAPIKey: true, apiKey: encrypt(plaintext), apiKeyIndex: indexFor(plaintext) } },
      )
      console.log(`\nAPI key set for ${email} (role: ${user.role}). Shown once:\n`)
      console.log(`  Authorization: users API-Key ${plaintext}\n`)
      console.log('Next: uncomment `useAPIKey: true` in payload.config.ts, deploy, then')
      console.log('  claude mcp add --transport http orcaclub <url>/api/mcp \\')
      console.log(`    --header "Authorization: users API-Key ${plaintext}"\n`)
    }
  }
} finally {
  await mongoose.disconnect()
}
