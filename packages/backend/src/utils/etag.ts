import { createHash } from 'crypto'

export function makeETag(input: string): string {
  return `"${createHash('sha1').update(input).digest('hex')}"`
}

function deepSort(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(deepSort)
  
  const sorted: any = {}
  Object.keys(obj)
    .sort()
    .forEach(key => {
      if (key === 'timestamp') return
      sorted[key] = deepSort(obj[key])
    })
  return sorted
}

export function makeETagFromData(data: any[] | any): string {
  if (!data) {
    return makeETag('null')
  }

  if (Array.isArray(data) && data.length === 0) {
    return makeETag('empty-array')
  }

  const sortedData = deepSort(data)
  const versionSource = JSON.stringify(sortedData)
  
  return makeETag(versionSource)
}
