'use strict'

/*
 * AccessAudit AI backend entrypoint.
 * Run: npm start (see README.md for configuration).
 */

const { buildConfig } = require('./config')
const { ScanStore } = require('./store')
const { createScanner } = require('./scanner')
const { createApp } = require('./app')

async function main() {
  const config = buildConfig()
  const store = new ScanStore(config.dataDir)
  await store.init()

  const scanner = createScanner(config)
  const app = createApp({ store, config, scanner })

  const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`AccessAudit backend listening on http://localhost:${config.port}`)
    console.log(`Scan storage: ${config.dataDir}`)
    console.log(`Local (loopback) scan targets: ${config.allowLocalTargets ? 'ALLOWED â€” test mode, do not use in shared deployments' : 'blocked'}`)
  })

  const shutdown = () => {
    console.log('Shutting down...')
    server.close(() => process.exit(0))
    // Failsafe if open connections keep the server alive.
    setTimeout(() => process.exit(0), 5000).unref()
  }
  process.on('SIGINT', shutdown)
  process.on('SIGTERM', shutdown)
}

main().catch((err) => {
  console.error('Failed to start backend:', err)
  process.exit(1)
})

