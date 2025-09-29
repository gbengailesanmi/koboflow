import { formatAmount } from '@/db/helpers/format-amount'
import { getAccountUniqueId } from '@/db/helpers/account-unique-id'
// import fs from 'fs'

const tinkUrl = 'https://api.tink.com'

async function getTinkTokens({ code, uriBase, port }) {
  const tokenResponse = await fetch(`${tinkUrl}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${uriBase}:${port}/api/callback`,
      client_id: process.env.TINK_CLIENT_ID,
      client_secret: process.env.TINK_CLIENT_SECRET,
      // scope: 'balances:read,accounts:read,transactions:read,credentials:refresh'
    }),
  })
  const tokenData = await tokenResponse.json()
  if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Token fetch failed')
  return tokenData.access_token
}

async function getTinkAccountsData(accessToken, customerId) {
  
  const accountsRes = await fetch(`${tinkUrl}/data/v2/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

  const accountsJson = await accountsRes.json()
  const accounts = accountsJson.accounts.map(item => ({
    ...item,
    customerId,
    balanceFormatted: formatAmount(
      item?.balances?.available?.amount?.value?.unscaledValue,
      item?.balances?.available?.amount?.value?.scale
    ),
    unique_id: getAccountUniqueId(item)
  }))

  return {
    accounts: accounts
  }
}

const getTinkTransactionsData = async (accessToken, accounts, customerId) => {

  const fetchAllTransactionsForAccount = async (account) => {
    let allTransactions = []
    let pageToken = null

    do {
      const trxnUrl = new URL(`${tinkUrl}/data/v2/transactions`)
      trxnUrl.searchParams.set('accountIdIn', account.id),
      trxnUrl.searchParams.set('pageSize', '100')
      if (pageToken) trxnUrl.searchParams.set('pageToken', pageToken)

      const trxnResponse = await fetch(trxnUrl.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })

      if (!trxnResponse.ok) {
        console.warn(`Failed to fetch transactions for account ${account.id}`)
        return []
      }

      const trxnJson = await trxnResponse.json()

      const transactions = (trxnJson.transactions || []).map((item) => ({
        ...item,
        customerId,
        amountFormatted: formatAmount(
          item?.amount?.value?.unscaledValue,
          item?.amount?.value?.scale
        ),
        accountUniqueId: account.unique_id ?? null,
      }))


      allTransactions.push(...transactions)
      pageToken = trxnJson.nextPageToken || null
    } while (pageToken)

    return allTransactions
  }

  const allTransactionsGrouped = await Promise.all(
    accounts.accounts.map((acc) => fetchAllTransactionsForAccount(acc))
  )
  const allTransactions = allTransactionsGrouped.flat()

  return {
    transactions: allTransactions
  }
}


export { getTinkTokens, getTinkAccountsData, getTinkTransactionsData }
