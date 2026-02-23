import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

const FORMAT_PREFIX = 'ENC_V1'

function getKey(): Buffer {
  const secret = process.env.PAYLOAD_SECRET || ''
  return createHash('sha256').update(secret).digest()
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns a string in the format: ENC_V1:base64_iv:base64_authTag:base64_ciphertext
 */
export function encryptField(value: string): string {
  const key = getKey()
  const iv = randomBytes(12) // 96-bit IV recommended for GCM
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return `${FORMAT_PREFIX}:${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`
}

/**
 * Decrypts a value produced by encryptField.
 * Returns null if the value is not in the expected format or decryption fails.
 */
export function decryptField(encrypted: string): string | null {
  try {
    if (!encrypted.startsWith(`${FORMAT_PREFIX}:`)) return null
    const rest = encrypted.slice(FORMAT_PREFIX.length + 1)
    const parts = rest.split(':')
    if (parts.length !== 3) return null
    const [ivB64, authTagB64, ciphertextB64] = parts
    const key = getKey()
    const iv = Buffer.from(ivB64, 'base64')
    const authTag = Buffer.from(authTagB64, 'base64')
    const ciphertext = Buffer.from(ciphertextB64, 'base64')
    const decipher = createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}
