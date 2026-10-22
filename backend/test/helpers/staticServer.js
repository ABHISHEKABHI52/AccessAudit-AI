'use strict'

/*
 * Minimal local HTTP server for the test fixture page. Binds to 127.0.0.1 on
 * an ephemeral port. The /hang route accepts the connection but never
 * responds, used to verify navigation-timeout handling.
 */

const http = require('node:http')
const fs = require('node:fs')
const path = require('node:path')

const FIXTURES_DIR = path.join(__dirname, '..', 'fixtures')

function createFixtureServer() {
  const server = http.createServer((req, res) => {
    const url = (req.url ?? '/').split('?')[0]
    if (url === '/hang') return // deliberately never respond

    const name = url === '/' ? 'inaccessible.html' : url.slice(1)
    if (!/^[a-z0-9-]+\.html$/.test(name)) {
      res.writeHead(404, { 'content-type': 'text/plain' })
      res.end('not found')
      return
    }
    fs.readFile(path.join(FIXTURES_DIR, name), (err, data) => {
      if (err) {
        res.writeHead(404, { 'content-type': 'text/plain' })
        res.end('not found')
        return
      }
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' })
      res.end(data)
    })
  })

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` })
    })
  })
}

module.exports = { createFixtureServer }
