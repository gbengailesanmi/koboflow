import { hasher } from '@/db/helpers/hasher'

export const getAccountUniqueId = (account: any): string => {
  const sortCode = account.identifiers?.sortCode?.code ?? ''
  const accountNumber = account.identifiers?.sortCode?.accountNumber ?? ''
  const finIstitutionId = account.financialInstitutionId ?? ''
  const uid = `${accountNumber}${finIstitutionId}${sortCode}`
  return hasher(uid)
}
