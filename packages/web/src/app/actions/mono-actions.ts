'use server'

import { revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import {
  initiateMonoLinking,
  getMonoTransactions,
  getMonoAccountDetails,
  exchangeMonoToken,
  importMonoAccount,
  syncMonoTransactions,
} from '@/app/api/api-service'

export async function initiateMonoLinkingAction(redirectUrl: string) {
  try {
    const result = await initiateMonoLinking(redirectUrl)
    
    if (result.success && result.monoCustomerId) {
      const cookieStore = await cookies()
      cookieStore.set('mono-customer-id', result.monoCustomerId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 30,
        path: '/',
      })
    }
    
    return result
  } catch (error: any) {
    console.error('initiateMonoLinkingAction error:', error)
    return { success: false, message: error.message }
  }
}

export async function getMonoTransactionsAction(
  accountId: string,
  options?: {
    start?: string
    end?: string
    type?: 'debit' | 'credit'
    paginate?: boolean
    page?: number
  }
) {
  try {
    return await getMonoTransactions(accountId, options)
  } catch (error: any) {
    console.error('getMonoTransactionsAction error:', error)
    return { success: false, message: error.message }
  }
}

export async function getMonoAccountDetailsAction(accountId: string) {
  try {
    return await getMonoAccountDetails(accountId)
  } catch (error: any) {
    console.error('getMonoAccountDetailsAction error:', error)
    return { success: false, message: error.message }
  }
}

export async function exchangeMonoTokenAction(code: string) {
  try {
    return await exchangeMonoToken(code)
  } catch (error: any) {
    console.error('exchangeMonoTokenAction error:', error)
    return { success: false, message: error.message }
  }
}

export async function importMonoAccountAction(accountId: string) {
  try {
    const result = await importMonoAccount(accountId)

    if (result.success) {
      revalidateTag('accounts')
    }

    return result
  } catch (error: any) {
    console.error('importMonoAccountAction error:', error)
    return { success: false, message: error.message }
  }
}

export async function syncMonoTransactionsAction(
  accountId: string,
  options?: {
    start?: string
    end?: string
  }
) {
  try {
    const result = await syncMonoTransactions(accountId, options)

    if (result.success) {
      revalidateTag('transactions')
    }

    return result
  } catch (error: any) {
    console.error('syncMonoTransactionsAction error:', error)
    return { success: false, message: error.message }
  }
}
