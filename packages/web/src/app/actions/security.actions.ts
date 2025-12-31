'use server'

import { actionFactory } from './factory.action'
import {
  changeUserPassword,
  changeUserPIN,
  setUserPIN,
  resendVerificationEmail,
} from '../../lib/server/api-service'

export const securityChangePasswordAction = (
  currentPassword: string,
  newPassword: string,
  confirmPassword: string
) =>
  actionFactory({
    actionName: 'security.changePassword',
    handler: () =>
      changeUserPassword(currentPassword, newPassword, confirmPassword),
    revalidate: ['settings', 'session'],
  })

export const securityChangePINAction = (
  oldPin: string,
  newPin: string,
  password: string
) =>
  actionFactory({
    actionName: 'security.changePIN',
    handler: () => changeUserPIN(oldPin, newPin, password),
    revalidate: ['settings'],
  })

export const securitySetPINAction = (pin: string, password: string) =>
  actionFactory({
    actionName: 'security.setPIN',
    handler: () => setUserPIN(pin, password),
    revalidate: ['settings'],
  })

export const securityResendVerificationEmailAction = (email: string) =>
  actionFactory({
    actionName: 'security.resendVerificationEmail',
    handler: () => resendVerificationEmail(email),
  })
  