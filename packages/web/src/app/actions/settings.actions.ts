'use server'

import { actionFactory } from './factory.action'
import { updateSettings } from '../../lib/api/api-service'
import type { UserSettings } from '@koboflow/shared'

export async function settingsUpdateAction(
  settings: Partial<UserSettings>
) {
  return actionFactory({
    actionName: 'settings.update',
    handler: () => updateSettings(settings),
    revalidatePaths: ['/[customerId]/settings'],
  })
}
