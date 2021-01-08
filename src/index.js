/* eslint-disable no-console */

// import required modules
const fs = require('fs')
const https = require('https')

// import internal modules
const logger = require('./logger')
const app = require('./app')

// get the assigned port
const port = app.get('port')

// configure the server for various scenarios
let server
if (!['production', 'staging', 'test'].includes(process.env.NODE_ENV)) {
  // dev environment; use https locally
  server = https.createServer({
    key: fs.readFileSync('./api.blackjack.test-key.pem', 'utf8'),
    cert: fs.readFileSync('./api.blackjack.test.pem', 'utf8'),
  }, app)
  // startup the server
  server.listen(port)
  // re-run setup; see: https://crow.docs.feathersjs.com/api/express.html#https
  logger.info(app.get('mongodb'))
  app.setup(server)
} else {
  // production/staging mode
  server = app.listen(port)
}

process.on('unhandledRejection', (reason, p) =>
  logger.error('Unhandled Rejection at: Promise ', p, reason),
)

server.on('listening', () =>
  logger.info('Blackjack API started on https://%s:%d', app.get('host'), port),
)
