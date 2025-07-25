import type { Account } from '@/types/account-type'

export const accounts: Account[] = [                 
  { id: 1, name: 'natwest', balance: 10000, currency: 'USD' , type: 'savings', accountNo: '60806761', sortCode: '20-04-70'},
  { id: 2, name: 'barclays', balance: 500, currency: 'GBP', type: 'checking', accountNo: '60806761', sortCode: '20-04-70' },
  { id: 3, name: 'lloyds', balance: 15000, currency: 'USD', type: 'investment', accountNo: '60806761', sortCode: '20-04-70' },
  { id: 4, name: 'hsbc', balance: 20000, currency: 'EUR', type: 'retirement', accountNo: '60806761', sortCode: '20-04-70' },
  { id: 5, name: 'hsbc', balance: 3000, currency: 'USD', type: 'savings', accountNo: '60806761', sortCode: '20-04-70' },
  { id: 6, name: 'lloyds', balance: -200, currency: 'USD', type: 'credit', accountNo: '60806761', sortCode: '20-04-70' },
  { id: 7, name: 'lloyds', balance: -5000, currency: 'USD', type: 'loan', accountNo: '60806761', sortCode: '20-04-70' },
  { id: 8, name: 'natwest', balance: 8000, currency: 'USD', type: 'joint', accountNo: '60806761', sortCode: '20-04-70' },
  { id: 9, name: 'hsbc', balance: 25000, currency: 'USD', type: 'business', accountNo: '60806761', sortCode: '20-04-70' },
  { id: 10, name: 'barclays', balance: 1200, currency: 'USD', type: 'savings', accountNo: '60806761', sortCode: '20-04-70' }
]
