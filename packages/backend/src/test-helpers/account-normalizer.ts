import config from '../config'

/**
 * Test Mode Helper: Modify account numbers to simulate different banks
 * 
 * Mono's test environment returns the same account number for all banks.
 * This helper appends the bank code to create unique account numbers per bank,
 * allowing proper testing of duplicate detection logic.
 * 
 * Example:
 * - Original: "0123456789"
 * - GTBank (058): "0123456789-058"
 * - Access (044): "0123456789-044"
 * 
 * This only runs in non-production environments.
 */
export function normalizeTestAccountNumber(
  accountNumber: string,
  bankCode: string
): string {
  // Only modify in test/dev mode
  if (config.IS_PRODUCTION) {
    return accountNumber
  }

  // If already modified (contains hyphen), return as-is
  if (accountNumber.includes('-')) {
    return accountNumber
  }

  // Append bank code to make it unique per bank
  const normalized = `${accountNumber}-${bankCode}`
  console.log(`[Test Mode] Normalized account: ${accountNumber} → ${normalized} (${bankCode})`)
  
  return normalized
}
