export type Account = {
  id: string
  customerId: string
  name: string
  type: string
  accountNumber: string
  balance: string
  balanceRaw: number
  currency: string
  institution: {
    name: string
    bankCode: string
    type: string
  }
  bvn: string | null
  status: string
  authMethod: string
  monoCustomerId: string
  monoCustomerEmail?: string
  lastRefreshed: Date
  provider: string
}
