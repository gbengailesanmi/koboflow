'use server'

import { revalidateTag, revalidatePath } from 'next/cache'
import { logger } from '@koboflow/shared'
import { getServerSession } from '@/lib/api/get-server-session'

type ActionOptions<T> = {
  actionName: string
  handler: () => Promise<T>
  revalidate?: string[]
  revalidatePaths?: string[]
  requireAuth?: boolean
}

export async function actionFactory<T>({
  actionName,
  handler,
  revalidate = [],
  revalidatePaths = [],
  requireAuth = true,
}: ActionOptions<T>): Promise<T> {
  try {
    if (requireAuth) {
      const session = await getServerSession()
      
      if (!session?.user?.customerId) {
        logger.warn({ actionName }, 'Unauthorized action attempt')
        return {
          success: false,
          message: 'Unauthorized',
        } as T
      }
    }

    const result: any = await handler()

    if (result?.success) {
      revalidate.forEach(tag =>
        revalidateTag(tag, 'default')
      )
      
      revalidatePaths.forEach(path => {
        revalidatePath(path, 'page')
        logger.info({ actionName, path }, 'Revalidated path')
      })
    }

    logger.info(`[ACTION: ${actionName}]`, result)
    return result
  } catch (error: any) {
    logger.error(`[ACTION: ${actionName}]`, error)
    return {
      success: false,
      message: error.message || 'Action failed',
    } as T
  }
}