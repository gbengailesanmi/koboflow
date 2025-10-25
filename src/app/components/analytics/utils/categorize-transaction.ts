// Simple category mapping based on transaction narration
export const categorizeTransaction = (narration: string): string => {
  const text = narration.toLowerCase()
  
  if (text.includes('grocery') || text.includes('supermarket') || text.includes('food')) return 'food'
  if (text.includes('gas') || text.includes('fuel') || text.includes('petrol')) return 'transport'
  if (text.includes('restaurant') || text.includes('cafe') || text.includes('dining')) return 'dining'
  if (text.includes('shop') || text.includes('store') || text.includes('retail')) return 'shopping'
  if (text.includes('utility') || text.includes('electric') || text.includes('water') || text.includes('internet')) return 'utilities'
  if (text.includes('rent') || text.includes('mortgage') || text.includes('housing')) return 'housing'
  if (text.includes('medical') || text.includes('hospital') || text.includes('pharmacy')) return 'healthcare'
  if (text.includes('entertainment') || text.includes('movie') || text.includes('game')) return 'entertainment'
  
  return 'other'
}
