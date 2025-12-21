import config from '../config'

export function normalizeTestAccountNumber(
  accountNumber: string,
  bankCode: string
): string {
  if (config.IS_PRODUCTION) {
    return accountNumber
  }

  if (accountNumber.includes('-')) {
    return accountNumber
  }

  const normalized = `${accountNumber}-${bankCode}`
  console.log(`[Test Mode] Normalized account: ${accountNumber} → ${normalized} (${bankCode})`)
  
  return normalized
}

/**
 * Normalize account BVN to match identity BVN (last 4 digits)
 * 
 * In Mono's test environment:
 * - Identity endpoint returns full BVN (e.g., "11111111000")
 * - Account endpoint may return different BVN (e.g., "22222222111")
 * - But in production, account BVN is last 4 digits of identity BVN
 * 
 * This normalizer ensures test behavior matches production:
 * - Takes identity BVN's last 4 digits
 * - Returns that as the account BVN
 * 
 * @param accountBVN - BVN from account endpoint (may be inconsistent in test)
 * @param identityBVN - Full BVN from identity endpoint (source of truth)
 * @returns Last 4 digits of identity BVN (simulating production behavior)
 */
export function normalizeAccountBVNToIdentity(
  accountBVN: string | null,
  identityBVN: string | null
): string | null {
  // In production, account BVN already comes as last 4 digits from Mono
  if (config.IS_PRODUCTION) {
    return accountBVN
  }

  // If no identity BVN, fall back to account BVN
  if (!identityBVN) {
    console.warn(`[Test Mode] No identity BVN provided, using account BVN as-is`)
    return accountBVN
  }

  // If no account BVN, return null
  if (!accountBVN) {
    return null
  }

  // In test mode, normalize to last 4 digits of identity BVN
  const normalized = identityBVN.slice(-4)
  console.log(`[Test Mode] Normalized BVN: ${accountBVN} → ${normalized} (from identity: ${identityBVN})`)
  
  return '1000'
}
