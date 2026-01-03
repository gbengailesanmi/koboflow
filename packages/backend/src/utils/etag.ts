import { createHash } from 'crypto'

export function makeETag(input: string): string {
  return `"${createHash('sha1').update(input).digest('hex')}"`
}

export function makeETagFromData(data: any[] | any): string {
  if (!Array.isArray(data)) {
    return makeETag(JSON.stringify(data))
  }

  if (!data || data.length === 0) {
    return makeETag('empty')
  }

  const timestamps = data
    .map(item => {
      const updated = item.updatedAt || item.updated_at || item.lastRefreshed || item.created_at || item.createdAt
      return updated ? new Date(updated).getTime() : 0
    })
    .filter(t => t > 0)

  // const maxTimestamp = timestamps.length > 0 ? Math.max(...timestamps) : Date.now()
  const versionSource = JSON.stringify(data)
  
  return makeETag(versionSource)
}
