import crypto from 'crypto'

export function hasher(data: any): string {
  const str = JSON.stringify(data, Object.keys(data).sort())
  return crypto.createHash('sha256').update(str).digest('hex')
}
