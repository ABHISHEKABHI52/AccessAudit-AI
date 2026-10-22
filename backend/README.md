# AccessAudit AI — Backend

Real accessibility scanning service for the AccessAudit AI frontend.

- **Node.js + Express** — REST API on port `8000`
- **Playwright (Chromium)** — loads the target page in a controlled headless browser
- **axe-core** — runs the actual accessibility audit inside the page

There is no demo/mock data anywhere in this backend: every finding comes from a
real axe-core run against the real page.

## Quick start

```bash
cd backend
npm install
npx playwright install chromium   # one-time browser download (~170 MB)
npm start                          # API on http://localhost:8000
```

Optional configuration: copy `.env.example` to `.env` and adjust.

## API contract

| Method | Path                 | Description |
| ------ | -------------------- | ----------- |
| GET    | `/api/health`        | `{ status, time, uptimeSeconds, scansStored }` |
| POST   | `/api/scans`         | Body `{ "url": "https://example.com" }` → `202 { id, url, status: "scanning", date }` |
| GET    | `/api/scans`         | History, newest first: `[{ id, url, date, status, issues: number|null }]` (`issues` is `null` unless completed) |
| GET    | `/api/scans/latest`  | Newest scan detail, or `null` when there are no scans |
| GET    | `/api/scans/:id`     | Scan detail: `{ id, url, date, status, issues: Issue[], completedAt, error }` |
| GET    | `/api/dashboard`     | `{ stats, scansOverTime, severity, recentScans }` computed from real stored scans |
| GET    | `/api/reports`       | `[{ id, title, url, date }]` for completed scans only |

Errors use `{ "error": { "code", "message" } }` with appropriate HTTP status
codes (`400` invalid URL/protocol, `403` blocked internal target, `404` not
found, `429` rate/queue limit). Stack traces are never returned.

### Issue shape (mapped from axe-core)

```
{ id, ruleId, severity, wcagCriterion, description, affectedUsers,
  element, selector, fix: { explanation, before, after },
  impact, help, axeDescription, helpUrl, tags, affectedNodes, failureSummary }
```

- `severity` = axe-core's own `impact` value (`critical | serious | moderate |
  minor`); a missing impact falls back to `moderate` (documented, only mapping applied).
- `wcagCriterion` is derived from axe criterion tags (`wcag111` → `WCAG 1.1.1`).
- `fix` guidance is hand-written, rule-based remediation text (`src/fixGuidance.js`,
  explicitly **not AI-generated**). `fix.after` is only present for curated rules
  and is clearly labelled as a generic example pattern — never an edit of the
  scanned page. Unmapped rules get an honest fallback pointing to the axe-core
  documentation URL.
- axe-core does **not** catch every accessibility problem and does not prove
  WCAG compliance; the UI repeats this caveat.

## Configuration (`.env`)

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| `PORT` | `8000` | API port |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | CORS origins |
| `DATA_DIR` | `backend/data` | JSON scan storage location |
| `NAVIGATION_TIMEOUT_MS` | `30000` | Page-load timeout (never waits for networkidle) |
| `SCAN_TIMEOUT_MS` | `60000` | Whole-scan timeout |
| `MAX_CONCURRENT_SCANS` | `2` | Simultaneous browsers |
| `MAX_QUEUE_LENGTH` | `20` | Queued scans before HTTP 429 |
| `RATE_LIMIT_WINDOW_MS` / `RATE_LIMIT_MAX_SCANS` | `60000` / `20` | Per-IP scan-start limit |
| `ALLOW_LOCAL_TARGETS` | `false` | **TEST ONLY** — allows scanning loopback URLs so the test suite can scan the controlled fixture page. Never enable on a shared deployment. |

## Security (SSRF) protections

An arbitrary-URL scanner can be abused as a server-side request proxy. This
backend:

- accepts only `http://` / `https://` URLs (no `file:`, `javascript:`, `data:`, credentials);
- rejects localhost, `*.local`, `*.internal`, single-label hostnames, and all
  private/internal IPv4 + IPv6 ranges (`10/8`, `127/8`, `172.16/12`, `192.168/16`,
  `169.254/16` incl. cloud metadata `169.254.169.254`, CGNAT, `::1`, `fc00::/7`, …);
- resolves hostnames via DNS before scanning and rejects names that resolve to
  private addresses;
- revalidates **every request inside the browser session** (initial navigation,
  redirects and subresources) through request interception — disallowed
  requests are aborted;
- applies bounded navigation + whole-scan timeouts and concurrency/queue limits;
- returns only safe error messages (no stacks/secrets).

**Documented limitations:** DNS answers are cached for 60s (reduced but
non-zero DNS-rebinding window); there is no authentication layer (demo use);
storage is a single-process JSON file (no cross-instance locking, no retention
cap); the scan browser can reach the public internet (pages are still filtered
through the checks above).

## Tests

```bash
cd backend
npm test
```

26 tests (`node:test`):

- `test/urlGuard.test.js` — SSRF/protocol/hostname validation;
- `test/axeMapper.test.js` — axe output → frontend contract mapping;
- `test/api.test.js` — endpoints with a controllable fake scanner (validation,
  lifecycle, dashboard maths, honest failures);
- `test/scanner.e2e.test.js` — **real Chromium + axe-core** against the
  controlled fixture page (`test/fixtures/inaccessible.html`, which contains a
  known missing-`alt` image). Asserts the genuine `image-alt` violation is
  reported, plus failed-navigation, timeout and blocked-target behaviour.

## Storage

Scan records (id, url, timestamps, status, normalized findings, error info)
are kept in memory and persisted to `DATA_DIR/scans.json` using
write-temp-then-rename atomic writes on a serialized queue. No page HTML is
stored. Fine for the hackathon MVP; not intended for multi-instance production.
