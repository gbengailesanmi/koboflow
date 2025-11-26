export type Account = {
  id: string
  uniqueId: string
  customerId: string
  balance: string
  name: string
  type: string
  bookedAmount: number
  bookedScale: number
  bookedCurrency: string
  availableAmount: number
  availableScale: number
  availableCurrency: string
  identifiers: any
  lastRefreshed: Date
  financialInstitutionId: string
  customerSegment: string
}
