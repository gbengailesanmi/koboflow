'use server'

import { revalidateTag } from 'next/cache'
import {
  // Config
  getMonoConfig,
  // Connection
  connectMonoAccount,
  linkMonoAccount,
  linkAllMonoAccounts,
  initiateMonoLinking,
  initiateMonoReauth,
  // Account Management
  getMonoAccounts,
  getAllMonoAccounts,
  getMonoAccountsByCustomer,
  syncMonoAccount,
  refreshMonoAccount,
  getMonoBalance,
  unlinkMonoAccount,
  // Account Data
  getMonoIdentity,
  getMonoTransactions,
  getMonoStatement,
  getMonoStatementJobStatus,
  getMonoCreditworthiness,
  // Investments
  getMonoEarnings,
  getMonoAssets,
  // Enrichment
  getMonoCategorisation,
  getMonoInsights,
  // Notifications
  getMonoNotifications,
  markMonoNotificationRead,
  markAllMonoNotificationsRead,
} from '@/app/api/api-service'

// ============================================================================
// Config Actions
// ============================================================================

/** Get Mono public key for widget */
export async function getMonoConfigAction() {
  try {
    return await getMonoConfig()
  } catch (error: any) {
    console.error('getMonoConfigAction error:', error)
    return { success: false, message: error.message }
  }
}

// ============================================================================
// Connection Actions
// ============================================================================

/** Connect account via Mono Connect widget code */
export async function connectMonoAccountAction(code: string) {
  try {
    const result = await connectMonoAccount(code)

    if (result.success) {
      revalidateTag('accounts')
      revalidateTag('transactions')
    }

    return result
  } catch (error: any) {
    console.error('connectMonoAccountAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Link account using Mono Customer/Account ID */
export async function linkMonoAccountAction(
  monoCustomerId: string,
  monoAccountId?: string
) {
  try {
    const result = await linkMonoAccount(monoCustomerId, monoAccountId)

    if (result.success) {
      revalidateTag('accounts')
      revalidateTag('transactions')
    }

    return result
  } catch (error: any) {
    console.error('linkMonoAccountAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Link all accounts for a Mono customer */
export async function linkAllMonoAccountsAction(monoCustomerId: string) {
  try {
    const result = await linkAllMonoAccounts(monoCustomerId)

    if (result.success) {
      revalidateTag('accounts')
      revalidateTag('transactions')
    }

    return result
  } catch (error: any) {
    console.error('linkAllMonoAccountsAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Initiate account linking (server-side flow) */
export async function initiateMonoLinkingAction(redirectUrl: string) {
  try {
    return await initiateMonoLinking(redirectUrl)
  } catch (error: any) {
    console.error('initiateMonoLinkingAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Initiate account reauthorization */
export async function initiateMonoReauthAction(
  accountId: string,
  redirectUrl: string
) {
  try {
    return await initiateMonoReauth(accountId, redirectUrl)
  } catch (error: any) {
    console.error('initiateMonoReauthAction error:', error)
    return { success: false, message: error.message }
  }
}

// ============================================================================
// Account Management Actions
// ============================================================================

/** Get user's linked Mono accounts */
export async function getMonoAccountsAction() {
  try {
    return await getMonoAccounts()
  } catch (error: any) {
    console.error('getMonoAccountsAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Get all accounts from Mono (admin) */
export async function getAllMonoAccountsAction() {
  try {
    return await getAllMonoAccounts()
  } catch (error: any) {
    console.error('getAllMonoAccountsAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Get accounts by Mono customer ID */
export async function getMonoAccountsByCustomerAction(monoCustomerId: string) {
  try {
    return await getMonoAccountsByCustomer(monoCustomerId)
  } catch (error: any) {
    console.error('getMonoAccountsByCustomerAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Trigger manual sync for an account */
export async function syncMonoAccountAction(accountId: string) {
  try {
    const result = await syncMonoAccount(accountId)

    if (result.success) {
      // Sync triggers background update, revalidate after delay
      setTimeout(() => {
        revalidateTag('accounts')
        revalidateTag('transactions')
      }, 5000)
    }

    return result
  } catch (error: any) {
    console.error('syncMonoAccountAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Refresh account data + transactions */
export async function refreshMonoAccountAction(accountId: string) {
  try {
    const result = await refreshMonoAccount(accountId)

    if (result.success) {
      revalidateTag('accounts')
      revalidateTag('transactions')
    }

    return result
  } catch (error: any) {
    console.error('refreshMonoAccountAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Get real-time balance */
export async function getMonoBalanceAction(accountId: string) {
  try {
    return await getMonoBalance(accountId)
  } catch (error: any) {
    console.error('getMonoBalanceAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Unlink account */
export async function unlinkMonoAccountAction(accountId: string) {
  try {
    const result = await unlinkMonoAccount(accountId)

    if (result.success) {
      revalidateTag('accounts')
      revalidateTag('transactions')
    }

    return result
  } catch (error: any) {
    console.error('unlinkMonoAccountAction error:', error)
    return { success: false, message: error.message }
  }
}

// ============================================================================
// Account Data Actions
// ============================================================================

/** Get account identity info */
export async function getMonoIdentityAction(accountId: string) {
  try {
    return await getMonoIdentity(accountId)
  } catch (error: any) {
    console.error('getMonoIdentityAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Get transactions with filters */
export async function getMonoTransactionsAction(
  accountId: string,
  options?: {
    start?: string
    end?: string
    type?: 'debit' | 'credit'
    narration?: string
  }
) {
  try {
    return await getMonoTransactions(accountId, options)
  } catch (error: any) {
    console.error('getMonoTransactionsAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Get account statement */
export async function getMonoStatementAction(
  accountId: string,
  period: 'last1month' | 'last2months' | 'last3months' | 'last6months' | 'last12months',
  output?: 'json' | 'pdf'
) {
  try {
    return await getMonoStatement(accountId, period, output)
  } catch (error: any) {
    console.error('getMonoStatementAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Get statement job status */
export async function getMonoStatementJobStatusAction(
  accountId: string,
  jobId: string
) {
  try {
    return await getMonoStatementJobStatus(accountId, jobId)
  } catch (error: any) {
    console.error('getMonoStatementJobStatusAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Get credit score */
export async function getMonoCreditworthinessAction(
  accountId: string,
  data: {
    bvn: string
    principal: number
    interestRate: number
    term: number
    runCreditCheck: boolean
  }
) {
  try {
    return await getMonoCreditworthiness(accountId, data)
  } catch (error: any) {
    console.error('getMonoCreditworthinessAction error:', error)
    return { success: false, message: error.message }
  }
}

// ============================================================================
// Investment Actions
// ============================================================================

/** Get investment earnings */
export async function getMonoEarningsAction(accountId: string) {
  try {
    return await getMonoEarnings(accountId)
  } catch (error: any) {
    console.error('getMonoEarningsAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Get investment assets */
export async function getMonoAssetsAction(accountId: string) {
  try {
    return await getMonoAssets(accountId)
  } catch (error: any) {
    console.error('getMonoAssetsAction error:', error)
    return { success: false, message: error.message }
  }
}

// ============================================================================
// Enrichment Actions
// ============================================================================

/** Get transaction categories */
export async function getMonoCategorisationAction(accountId: string) {
  try {
    return await getMonoCategorisation(accountId)
  } catch (error: any) {
    console.error('getMonoCategorisationAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Get statement insights */
export async function getMonoInsightsAction(accountId: string) {
  try {
    return await getMonoInsights(accountId)
  } catch (error: any) {
    console.error('getMonoInsightsAction error:', error)
    return { success: false, message: error.message }
  }
}

// ============================================================================
// Notification Actions
// ============================================================================

/** Get user notifications */
export async function getMonoNotificationsAction() {
  try {
    return await getMonoNotifications()
  } catch (error: any) {
    console.error('getMonoNotificationsAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Mark notification as read */
export async function markMonoNotificationReadAction(notificationId: string) {
  try {
    return await markMonoNotificationRead(notificationId)
  } catch (error: any) {
    console.error('markMonoNotificationReadAction error:', error)
    return { success: false, message: error.message }
  }
}

/** Mark all notifications as read */
export async function markAllMonoNotificationsReadAction() {
  try {
    return await markAllMonoNotificationsRead()
  } catch (error: any) {
    console.error('markAllMonoNotificationsReadAction error:', error)
    return { success: false, message: error.message }
  }
}
