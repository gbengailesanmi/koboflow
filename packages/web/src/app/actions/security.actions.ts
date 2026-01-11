'use server'

import { actionFactory } from './factory.action'
import {
  changeUserPassword,
  changeUserPIN,
  setUserPIN,
  resendVerificationEmail,
} from '../../lib/api/api-service'

export async function securityChangePasswordAction(
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) {
  return actionFactory({
    actionName: 'security.changePassword',
    handler: () =>
      changeUserPassword(currentPassword, newPassword, confirmPassword),
  })
}

export async function securityChangePINAction(
  oldPin: string,
  newPin: string,
  password: string
) {
  return actionFactory({
    actionName: 'security.changePIN',
    handler: () => changeUserPIN(oldPin, newPin, password),
  })
}

export async function securitySetPINAction(pin: string, password: string) {
  return actionFactory({
    actionName: 'security.setPIN',
    handler: () => setUserPIN(pin, password),
  })
}

export async function securityResendVerificationEmailAction(email: string) {
  return actionFactory({
    actionName: 'security.resendVerificationEmail',
    handler: () => resendVerificationEmail(email),
  })
}
