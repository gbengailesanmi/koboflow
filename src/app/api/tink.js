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
  }))

  const transactions = transactionsJson.transactions.slice(0, 3).map(item => ({
    ...item,
    customerId,
  }))

  return {
    accounts: accounts,
    transactions: transactions
  }
}

module.exports = { getTinkTokens, getTinkData }
