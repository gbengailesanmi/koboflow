import { formatAmount, getStableId } from '@/helpers/db-insert-helper'
const tinkUrl = 'https://api.tink.com'

async function getTinkTokens({ code, uriBase, port }) {
  const tokenResponse = await fetch(`${tinkUrl}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${uriBase}:${port}/callback`,
      client_id: process.env.TINK_CLIENT_ID,
      client_secret: process.env.TINK_CLIENT_SECRET
    }),
  })
  const tokenData = await tokenResponse.json()
  if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Token fetch failed')
  return tokenData.access_token
}

async function getTinkData(accessToken, customerId) {
  console.log('Fetching Tink data >>>>>>')
  
  const [accountsRes, trxnRes] = await Promise.all([
    fetch(`${tinkUrl}/data/v2/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`${tinkUrl}/data/v2/transactions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ])

  const accountsJson = await accountsRes.json()
  const transactionsJson = await trxnRes.json()

  const accounts = accountsJson.accounts.map(item => ({
    ...item,
    customerId,
    balanceFormatted: formatAmount(
      item?.balances?.available?.amount?.value?.unscaledValue,
      item?.balances?.available?.amount?.value?.scale
    ),
    stable_id: getStableId(item)
  }))

  const transactions = transactionsJson.transactions.map((item) => {
    const relatedAccount = accounts.find(acc => acc.id === item.accountId)
    return {
      ...item,
      customerId,
      amountFormatted: formatAmount(
        item?.amount?.value?.unscaledValue,
        item?.amount?.value?.scale
      ),
      accountStableId: relatedAccount?.stable_id ?? null, // mirror stableId
    }
  })

  return {
    accounts: accounts,
    transactions: transactions
  }
}

export { getTinkTokens, getTinkData }
