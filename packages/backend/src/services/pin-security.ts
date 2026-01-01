import crypto from 'crypto'
import { logger } from '@money-mapper/shared'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 64

/**
 * Generates a secure encryption key from a password using PBKDF2
 */
function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha256')
}

/**
 * Encrypts a PIN with a password-derived key
 * Returns: salt:iv:authTag:encryptedData (all base64)
 */
export function encryptPIN(pin: string, password: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const key = deriveKey(password, salt)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(pin, 'utf8', 'base64')
  encrypted += cipher.final('base64')
  
  const authTag = cipher.getAuthTag()
  
  return [
    salt.toString('base64'),
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted,
  ].join(':')
}

/**
 * Decrypts a PIN using the password
 */
export function decryptPIN(encryptedPIN: string, password: string): string | null {
  try {
    const [saltB64, ivB64, authTagB64, encrypted] = encryptedPIN.split(':')
    
    const salt = Buffer.from(saltB64, 'base64')
    const iv = Buffer.from(ivB64, 'base64')
    const authTag = Buffer.from(authTagB64, 'base64')
    
    const key = deriveKey(password, salt)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    let decrypted = decipher.update(encrypted, 'base64', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    logger.error({ module: 'pin-security', error }, 'Failed to decrypt PIN')
    return null
  }
}

/**
 * Validates a PIN against an encrypted PIN
 */
export function validatePIN(
  inputPIN: string,
  encryptedPIN: string,
  password: string
): boolean {
  const decrypted = decryptPIN(encryptedPIN, password)
  return decrypted === inputPIN
}

/**
 * Hashes a PIN for secure storage (one-way hash)
 */
export function hashPIN(pin: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512')
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

/**
 * Verifies a PIN against a hash
 */
export function verifyPINHash(pin: string, hashedPIN: string): boolean {
  const [saltHex, hashHex] = hashedPIN.split(':')
  const salt = Buffer.from(saltHex, 'hex')
  const hash = Buffer.from(hashHex, 'hex')
  
  const inputHash = crypto.pbkdf2Sync(pin, salt, 100000, 64, 'sha512')
  
  return crypto.timingSafeEqual(hash, inputHash)
}

/**
 * Validates PIN format (4-6 digits)
 */
export function isValidPINFormat(pin: string): boolean {
  return /^\d{4,6}$/.test(pin)
}
