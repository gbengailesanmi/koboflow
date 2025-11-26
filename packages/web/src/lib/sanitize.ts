import { ObjectId, Decimal128, Long, Binary, Timestamp } from 'mongodb'

function isObject(v: any) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

export function sanitizeValue(value: any): any {
  if (value === null || value === undefined) return value

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value

  if (value instanceof Date) return value.toISOString()

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(value)) return value.toString('base64')

  if (value && typeof value === 'object' && value.buffer instanceof ArrayBuffer) {
    try {
      return Buffer.from(value.buffer).toString('base64')
    } catch {
    }
  }

  if (value instanceof ObjectId || value?._bsontype === 'ObjectID' || value?.constructor?.name === 'ObjectId') {
    return value.toString()
  }

  if (value instanceof Decimal128 || value?.constructor?.name === 'Decimal128' || value?._bsontype === 'Decimal128') {
    try { return value.toString() } catch { return String(value) }
  }

  if (value instanceof Long || value?.constructor?.name === 'Long' || value?._bsontype === 'Long') {
    try { return value.toString() } catch { return Number(value) }
  }

  if (value instanceof Binary || value?.constructor?.name === 'Binary' || value?._bsontype === 'Binary') {
    try { return Buffer.from(value.buffer).toString('base64') } catch { return null }
  }

  if (value instanceof Timestamp || value?.constructor?.name === 'Timestamp' || value?._bsontype === 'Timestamp') {
    try { return new Date(value.toNumber ? value.toNumber() * 1000 : value.getHighBits()).toISOString() } catch { return String(value) }
  }

  if (Array.isArray(value)) return value.map(sanitizeValue)

  if (isObject(value)) {
    const out: any = {}
    for (const key of Object.keys(value)) {
      out[key] = sanitizeValue((value as any)[key])
    }
    return out
  }

  try { return JSON.parse(JSON.stringify(value)) } catch { return String(value) }
}

export function sanitizeDoc<T = any>(doc: T): T {
  return sanitizeValue(doc) as T
}

export function sanitizeArray<T = any>(arr: T[]): T[] {
  return arr.map(sanitizeDoc)
}