'use server'

import { actionFactory } from './factory.action'
import { updateSettings } from '../../lib/server/api-service'
import type { UserSettings } from '@money-mapper/shared'

export const settingsUpdateAction = (
  settings: Partial<UserSettings>
) =>
  actionFactory({
    actionName: 'settings.update',
    handler: () => updateSettings(settings),
    revalidate: ['settings', 'session'],
  })
  