const formatAmount = (unscaledValue?: string, scale?: string): string => {
  const value = Number(unscaledValue)
  const scaleNum = Number(scale)

  if (isNaN(value) || isNaN(scaleNum)) return "0.00"

  const result = value * Math.pow(10, -scaleNum)
  return result.toFixed(2)
}

const getStableId = (account: any): string => {
  // if (account.identifiers?.iban?.iban) return account.identifiers.iban.iban
  const sortCode = account.identifiers?.sortCode?.code ?? ''
  const accountNumber = account.identifiers?.sortCode?.accountNumber ?? ''
  return `${sortCode}-${accountNumber}`
}

export { formatAmount, getStableId }

// {"iban":{"iban":"GB39YGDH90153671247781","bban":"YGDH90153671247781"},"sortCode":{"code":"987106","accountNumber":"07897654"},"financialInstitution":{"accountNumber":"9871067897654","referenceNumbers":{}}}
//{"sortCode":{"code":"987106","accountNumber":"06527609"},"financialInstitution":{"accountNumber":"9871066527609","referenceNumbers":{}}}