'use server'

import { revalidateTag } from 'next/cache'
import { logger } from '@koboflow/shared'

type ActionOptions<T> = {
  actionName: string
  handler: () => Promise<T>
  revalidate?: string[]
}

export async function actionFactory<T>({
  actionName,
  handler,
  revalidate = [],
}: ActionOptions<T>): Promise<T> {
  try {
    const result: any = await handler()

    if (result?.success) {
      revalidate.forEach(tag =>
        revalidateTag(tag, 'default')
      )
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