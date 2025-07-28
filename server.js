const express = require('express')
const next = require('next')
const { getTinkTokens, getTinkData } = require('./src/app/api/tink/tink')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()
const uriBase = 'http://localhost'
const port = 3000

app.prepare().then(() => {
  const server = express()

  server.get('/callback', async (req, res) => {
    const { code, credentialsId } = req.query
    if (!code || !credentialsId) {
      return res.status(400).send('Missing code or credentialsId')
    }
    try {
      const accessToken = await getTinkTokens({ code, credentialsId, uriBase, port })
      const { accounts, transactions } = await getTinkData(accessToken)

      console.log('Accounts:', accounts)
      // console.log('Transactions:', transactions)
      res.redirect(`/12345/main`)
    } catch (error) {
      console.error('Error in /callback:', error)
      res.status(500).send('Internal Server Error')
    }
  })

  server.all('/*splat', (req, res) => handle(req, res))
  server.listen(port, () => {
    console.log(`> Server running on ${uriBase}:${port}`)
  })
})
