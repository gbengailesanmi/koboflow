'use server'

import { revalidateTag } from 'next/cache'
import { logger } from '@koboflow/shared'
import { getServerSession } from '@/lib/api/get-server-session'

type ActionOptions<T> = {
  actionName: string
  handler: () => Promise<T>
  revalidate?: string[]
  requireAuth?: boolean
}

export async function actionFactory<T>({
  actionName,
  handler,
  revalidate = [],
  requireAuth = true,
}: ActionOptions<T>): Promise<T> {
  try {
    let customerId: string | undefined

    if (requireAuth) {
      const session = await getServerSession()
      
      if (!session?.user?.customerId) {
        logger.warn({ actionName }, 'Unauthorized action attempt')
        return {
          success: false,
          message: 'Unauthorized',
        } as T
      }
      customerId = session.user.customerId
    }

    const result: any = await handler()

    if (result?.success) {
      revalidate.forEach(tag =>
        revalidateTag(tag, 'default')
      )
    }

    logger.info(`[ACTION: ${actionName}]`, result)
    
    return {
      ...result,
      __actionName: actionName,
    } as T
  } catch (error: any) {
    logger.error(`[ACTION: ${actionName}]`, error)
    return {
      success: false,
      message: error.message || 'Action failed',
    } as T
  }
}