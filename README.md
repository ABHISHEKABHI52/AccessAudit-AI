# AccessAudit AI

AI-assisted website accessibility scanner. Enter a URL, run a real browser-based
audit, and review genuine WCAG findings with rule-based fix guidance.

The scan is **real, not simulated**: a backend service drives headless Chromium
(Playwright) to load the page and runs **axe-core** inside it. Every issue shown
in the UI comes from that live audit.

## Architecture

```
AccessAudit AI/
├── src/        React + Vite + Tailwind frontend (root of repo)
└── backend/    Node.js + Express + Playwright + axe-core scanning service
```

- **Frontend** (`src/`): React 19, React Router, Tailwind CSS v4, Lucide icons.
  Talks to the backend through `src/api/client.js`.
- **Backend** (`backend/`): Express API that validates URLs (SSRF protection),
  scans pages with Playwright + axe-core, normalizes results, and persists scan
  history to a JSON file. See [`backend/README.md`](backend/README.md) for the
  full API contract, configuration and security notes.

There is **no mock/demo data** in the application flow. If the backend is
unreachable or a scan fails, the UI shows an honest error state — it never
fabricates results.

## Prerequisites

- Node.js 18+ (developed on Node 22)
- npm
- Internet access on first backend setup (Playwright downloads Chromium once)

## Setup

### 1. Frontend

```bash
npm install
cp .env.example .env     # optional; defaults already point at localhost:8000
npm run dev              # http://localhost:5173
```

`.env`:

```
VITE_API_BASE_URL=http://localhost:8000
```

### 2. Backend

```bash
cd backend
npm install
npx playwright install chromium    # one-time Chromium download
npm start                          # http://localhost:8000
```

Configuration lives in `backend/.env` (see `backend/.env.example`). By default
private/internal targets (localhost, `10.x`, `169.254.169.254`, …) are blocked
so the scanner cannot be used for SSRF.

## Scripts

| Where | Command | Purpose |
| ----- | ------- | ------- |
| root | `npm run dev` | Start the Vite dev server |
| root | `npm run build` | Production build to `dist/` |
| root | `npm run lint` | ESLint (frontend + backend) |
| root | `npm test` | API-client unit tests (mocked network) |
| backend | `npm start` | Start the scanning API |
| backend | `npm test` | Backend unit + API + real-browser E2E tests |

## How a scan works

1. The scan form posts the URL to `POST /api/scans`.
2. The backend validates the URL (protocol, DNS, private-network checks) and
   returns `{ id, status: "scanning" }`.
3. A headless Chromium loads the page (bounded timeout), axe-core is injected,
   and the audit runs against the live DOM.
4. Results are normalized to the frontend contract and stored by scan ID.
5. The frontend polls `GET /api/scans/:id` every 1.5s until the status is
   `completed` or `failed`, then renders the genuine findings.

## Testing

```bash
npm test                 # frontend API-client tests
cd backend && npm test   # 26 backend tests, including a real Chromium scan
```

The backend E2E test scans a controlled local fixture page with a known
missing-`alt` image and asserts axe-core reports the genuine `image-alt`
violation.

## Honest limitations

- axe-core catches only a subset of accessibility issues; automated results do
  not prove WCAG compliance. Manual keyboard and screen-reader testing is still
  required (the UI says this too).
- Fix guidance is rule-based remediation text plus the axe-core docs link — it
  is **not AI-generated**, and suggestions are not auto-applied to the site.
- Scan history is stored in a local JSON file (single process, demo scale).
- The arbitrary-URL scanner has SSRF protections but no auth layer; run it on
  trusted networks only.
