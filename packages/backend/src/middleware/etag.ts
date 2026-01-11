import { Request, Response, NextFunction } from 'express'
import { makeETagFromData } from '../utils/etag'
import { logger } from '@koboflow/shared'

export const etagMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (req.method !== 'GET') {
    return next()
  }

  const requestPath = req.originalUrl || req.url
  const originalJson = res.json.bind(res)

  res.json = function (data: any) {
    try {
      const etag = makeETagFromData(data)
      
      res.setHeader('ETag', etag)
      
      res.setHeader('Cache-Control', 'private, must-revalidate')
      const clientETag = req.headers['if-none-match']
      
      if (clientETag === etag) {
        logger.info(
          { 
            module: 'etag-middleware', 
            path: requestPath, 
            etag,
            status: 304 
          }, 
          'ETag match (returning 304)'
        )
        
        return res.status(304).end()
      }
      
      logger.info(
        { 
          module: 'etag-middleware', 
          path: requestPath, 
          serverETag: etag,
          clientETag: clientETag || 'none',
          etagsMatch: clientETag === etag,
          status: 200 
        }, 
        'ETag miss - sending new data'
      )
      
      return originalJson(data)
    } catch (error) {
      logger.error(
        { 
          module: 'etag-middleware', 
          path: requestPath, 
          error 
        }, 
        'ETag generation failed - returning response without ETag'
      )
      return originalJson(data)
    }
  }

  next()
}
