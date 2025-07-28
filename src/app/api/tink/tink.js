const tinkUrl = 'https://api.tink.com'

async function getTinkTokens({ code, credentialsId, uriBase, port }) {
  const tokenResponse = await fetch(`${tinkUrl}/api/v1/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${uriBase}:${port}/callback`,
      client_id: 'c2296ba610e54fda8a7769872888a1f6',
      client_secret: 'a2daae6de157478eb42187b6343400ef',
    }),
  })
  const tokenData = await tokenResponse.json()
  if (!tokenResponse.ok) throw new Error(tokenData.error_description || 'Token fetch failed')
  return tokenData.access_token
}

async function getTinkData(accessToken) {
  console.log('Fetching Tink data >>>>>>')
  
  const [accountsRes, trxnRes] = await Promise.all([
    fetch(`${tinkUrl}/data/v2/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    fetch(`${tinkUrl}/data/v2/transactions`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ])
  return {
    accounts: await accountsRes.json(),
    transactions: await trxnRes.json(),
  }
}

module.exports = { getTinkTokens, getTinkData }
