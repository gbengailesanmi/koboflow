export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  const currencies: Record<string, string> = {
    USD: '$', EUR: '€', GBP: '£', JPY: '¥', AUD: 'A$', 
    CAD: 'C$', CHF: 'Fr', CNY: '¥', INR: '₹', NGN: '₦'
  }
  
  const symbol = currencies[currency] || '$'
  return `${symbol}${Math.abs(amount).toLocaleString()}`
}
