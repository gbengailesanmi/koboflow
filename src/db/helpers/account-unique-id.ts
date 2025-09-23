export const getAccountUniqueId = (account: any): string => {
  const sortCode = account.identifiers?.sortCode?.code ?? ''
  const accountNumber = account.identifiers?.sortCode?.accountNumber ?? ''
  const finIstitutionId = account.financialInstitutionId ?? ''
  return `accountUId-${accountNumber}${finIstitutionId}${sortCode}`
}
