'use strict'

/**
 * Secure Encryption Utilities using Web Crypto API
 * Replaces XOR obfuscation with AES-GCM encryption
 *
 * Note: For localStorage encryption, this provides obfuscation against casual inspection.
 * For truly sensitive data, use server-side storage with proper authentication.
 */

// Encryption key derivation salt (should be unique per application)
const SALT = 'dashbarber_2026_salt'
const ITERATIONS = 100000
const KEY_LENGTH = 256

/**
 * Derives a cryptographic key from a password using PBKDF2
 */
async function deriveKey(password: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(SALT),
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * Encrypts data using AES-GCM
 * @param data - Plain text data to encrypt
 * @param password - Password for encryption (defaults to app-specific key)
 * @returns Base64 encoded encrypted string with IV prepended
 */
export async function encryptData(
  data: string,
  password: string = 'dashbarber_local_key'
): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const key = await deriveKey(password)

    // Generate a random IV for each encryption
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encryptedBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encryptedBuffer), iv.length)

    // Convert to base64
    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('Encryption failed:', error)
    // Fallback to simple base64 encoding if crypto fails
    return btoa(data)
  }
}

/**
 * Decrypts data encrypted with encryptData
 * @param encryptedData - Base64 encoded encrypted string
 * @param password - Password for decryption (must match encryption password)
 * @returns Decrypted plain text or empty string on failure
 */
export async function decryptData(
  encryptedData: string,
  password: string = 'dashbarber_local_key'
): Promise<string> {
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

    // Extract IV (first 12 bytes)
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)

    const key = await deriveKey(password)

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    return new TextDecoder().decode(decryptedBuffer)
  } catch (error) {
    // Try fallback base64 decoding for legacy data
    try {
      return atob(encryptedData)
    } catch {
      console.error('Decryption failed:', error)
      return ''
    }
  }
}

/**
 * Generates a secure random string for tokens/IDs
 * @param length - Length of the random string (default 32)
 * @returns Hex-encoded random string
 */
export function generateSecureId(length: number = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(length / 2)))
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

/**
 * Hashes a string using SHA-256
 * @param data - Data to hash
 * @returns Hex-encoded hash
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder()
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data))
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Validates that a value matches its hash
 * @param data - Original data
 * @param hash - Expected hash
 * @returns True if hash matches
 */
export async function validateHash(data: string, hash: string): Promise<boolean> {
  const computedHash = await hashData(data)
  return computedHash === hash
}

/**
 * Simple sync obfuscation for non-critical data (fallback when async not available)
 * Uses XOR with rotating key - NOT cryptographically secure
 */
export function obfuscateSync(data: string): string {
  const key = 'dashbarber_2026'
  let result = ''
  for (let i = 0; i < data.length; i++) {
    result += String.fromCharCode(data.charCodeAt(i) ^ key.charCodeAt(i % key.length))
  }
  return btoa(result)
}

/**
 * Deobfuscates data obfuscated with obfuscateSync
 */
export function deobfuscateSync(data: string): string {
  const key = 'dashbarber_2026'
  try {
    const decoded = atob(data)
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length))
    }
    return result
  } catch {
    return ''
  }
}

// Aliases for backward compatibility and API consistency
export { encryptData as encrypt }
export { decryptData as decrypt }
