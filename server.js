const express = require('express')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()


app.prepare().then(() => {
  const server = express()

  server.get('/callback', async (req, res) => {
    const { code, credentialsId } = req.query

    if (!code || !credentialsId) {
      return res.status(400).send('Missing code or credentialsId')
    }

    try {
      const tokenResponse = await fetch('https://api.tink.com/api/v1/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: 'http://localhost:3000/callback',
          client_id: 'c2296ba610e54fda8a7769872888a1f6',
          client_secret: 'a2daae6de157478eb42187b6343400ef',
        }),
      })


      const tokenData = await tokenResponse.json()

      if (!tokenResponse.ok) {
        console.error(tokenData)
        return res.status(500).send('Failed to exchange code for token')
      }

      const accessToken = tokenData.access_token

      const [accountsRes, trxnRes] = await Promise.all([
        fetch('https://api.tink.com/data/v2/accounts', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
        fetch('https://api.tink.com/data/v2/transactions', {
          headers: { Authorization: `Bearer ${accessToken}` },
        }),
      ])

      const accounts = await accountsRes.json()
      const transactions = await trxnRes.json()
      console.log('Accounts:', accounts)
      // console.log('Transactions:', transactions)

      res.redirect(`/dashboard?status=success`)
    } catch (error) {
      console.error('Error in /callback:', error)
      res.status(500).send('Internal Server Error')
    }
  })

  server.all('/*splat', (req, res) => {
    return handle(req, res)
  })

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000')
  })
})
