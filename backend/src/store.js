'use strict'

/*
 * File-based JSON scan store for the hackathon MVP.
 *
 * - Scans are kept in memory (Map) and persisted to data/scans.json.
 * - Writes are serialized through a promise chain and use write-temp-then-rename
 *   so a crash mid-write cannot corrupt the stored file.
 * - Loaded records are validated; malformed entries are skipped.
 *
 * Limitations: single-process storage only (no cross-instance locking) and no
 * retention cap. Fine for a local demo, not for multi-instance production.
 */

const fs = require('node:fs/promises')
const path = require('node:path')
const crypto = require('node:crypto')

const VALID_STATUSES = new Set(['scanning', 'completed', 'failed'])

function isRecordValid(record) {
  return Boolean(
    record &&
    typeof record.id === 'string' &&
    typeof record.url === 'string' &&
    typeof record.date === 'string' &&
    VALID_STATUSES.has(record.status),
  )
}

class ScanStore {
  constructor(dataDir) {
    this.file = path.join(dataDir, 'scans.json')
    this.scans = new Map()
    this.writeChain = Promise.resolve()
    this.initPromise = null
  }

  init() {
    if (this.initPromise) return this.initPromise
    this.initPromise = (async () => {
      await fs.mkdir(path.dirname(this.file), { recursive: true })
      try {
        const raw = await fs.readFile(this.file, 'utf8')
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          for (const record of parsed) {
            if (isRecordValid(record)) this.scans.set(record.id, record)
          }
        }
      } catch (err) {
        if (err.code !== 'ENOENT') {
          console.error(`[store] Could not load ${this.file}: ${err.message}. Starting with an empty store.`)
        }
      }
    })()
    return this.initPromise
  }

  /** Newest first. */
  list() {
    return [...this.scans.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  get(id) {
    return this.scans.get(id) ?? null
  }

  count() {
    return this.scans.size
  }

  newId() {
    return crypto.randomUUID()
  }

  create(record) {
    if (!isRecordValid(record)) throw new Error('Invalid scan record')
    if (this.scans.has(record.id)) throw new Error('Duplicate scan id')
    this.scans.set(record.id, record)
    this.persist()
    return record
  }

  update(id, patch) {
    const record = this.scans.get(id)
    if (!record) return null
    Object.assign(record, patch)
    this.persist()
    return record
  }

  /** Wait for all pending writes (used by tests and shutdown). */
  flush() {
    return this.writeChain
  }

  persist() {
    const snapshot = JSON.stringify(this.list(), null, 2)
    this.writeChain = this.writeChain
      .then(async () => {
        const tmp = `${this.file}.${crypto.randomBytes(6).toString('hex')}.tmp`
        await fs.writeFile(tmp, snapshot, 'utf8')
        await fs.rename(tmp, this.file)
      })
      .catch((err) => {
        console.error(`[store] Persist failed: ${err.message}`)
      })
    return this.writeChain
  }
}

module.exports = { ScanStore }
