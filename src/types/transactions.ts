export type Transaction = {
  id: string
  accountUniqueId: string
  accountId: string
  customerId: string
  amount: string
  unscaledValue: number
  scale: number
  narration: string
  currencyCode: string
  descriptions: {original: string, display: string}
  bookedDate: Date
  identifiers: {providerTransactionId: string}
  types: {type: string}
  status: string
  providerMutability: string
}
