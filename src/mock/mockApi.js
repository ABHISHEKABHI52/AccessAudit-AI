
const KEY = 'accessaudit-mock-scans'
const SCAN_MS = 3500 // scan kitni der "scanning" dikhe
const DAY = 86400000

const delay = (ms = 500) => new Promise((r) => setTimeout(r, ms))

/* ---------- 10 realistic issues ---------- */
const LIBRARY = [
  {
    ruleId: 'image-alt',
    severity: 'critical',
    wcagCriterion: '1.1.1 Non-text Content',
    description: 'Images must have alternative text',
    affectedUsers: 'Screen reader users who cannot see the image',
    element: '<img src="/img/hero-banner.jpg">',
    selector: 'main > section.hero > img',
    fix: {
      explanation: 'Add a short alt text that describes the purpose of the image. Use alt="" only for purely decorative images.',
      before: '<img src="/img/hero-banner.jpg">',
      after: '<img src="/img/hero-banner.jpg" alt="Team reviewing a project plan">',
    },
  },
  {
    ruleId: 'button-name',
    severity: 'critical',
    wcagCriterion: '4.1.2 Name, Role, Value',
    description: 'Buttons must have discernible text',
    affectedUsers: 'Screen reader and voice control users',
    element: '<button class="icon-btn"><svg>...</svg></button>',
    selector: 'header .icon-btn',
    fix: {
      explanation: 'Give the button an accessible name with visible text or an aria-label.',
      before: '<button class="icon-btn"><svg>...</svg></button>',
      after: '<button class="icon-btn" aria-label="Open menu"><svg aria-hidden="true">...</svg></button>',
    },
  },
  {
    ruleId: 'label',
    severity: 'critical',
    wcagCriterion: '3.3.2 Labels or Instructions',
    description: 'Form inputs must have labels',
    affectedUsers: 'Screen reader users and people using voice control',
    element: '<input type="email" placeholder="Email">',
    selector: 'form#newsletter input[type="email"]',
    fix: {
      explanation: 'Connect a visible <label> to the input. A placeholder alone is not a label.',
      before: '<input type="email" placeholder="Email">',
      after: '<label for="email">Email</label>\n<input id="email" type="email" placeholder="you@example.com">',
    },
  },
  {
    ruleId: 'color-contrast',
    severity: 'serious',
    wcagCriterion: '1.4.3 Contrast (Minimum)',
    description: 'Text does not have enough contrast with its background',
    affectedUsers: 'People with low vision or colour deficiency',
    element: '<p class="caption">Free shipping on all orders</p>',
    selector: 'section.offers p.caption',
    fix: {
      explanation: 'Use a darker text colour so the contrast ratio is at least 4.5:1 for normal text.',
      before: '.caption { color: #999999; }',
      after: '.caption { color: #475569; }',
    },
  },
  {
    ruleId: 'link-name',
    severity: 'serious',
    wcagCriterion: '2.4.4 Link Purpose (In Context)',
    description: 'Links must have discernible text',
    affectedUsers: 'Screen reader users navigating by links',
    element: '<a href="/cart"><i class="icon-cart"></i></a>',
    selector: 'nav a[href="/cart"]',
    fix: {
      explanation: 'Add text or an aria-label that explains where the link goes.',
      before: '<a href="/cart"><i class="icon-cart"></i></a>',
      after: '<a href="/cart" aria-label="Shopping cart"><i class="icon-cart" aria-hidden="true"></i></a>',
    },
  },
  {
    ruleId: 'html-has-lang',
    severity: 'serious',
    wcagCriterion: '3.1.1 Language of Page',
    description: 'The <html> element must have a lang attribute',
    affectedUsers: 'Screen reader users (wrong pronunciation) and translation tools',
    element: '<html>',
    selector: 'html',
    fix: {
      explanation: 'Set the main language of the page on the html element.',
      before: '<html>',
      after: '<html lang="en">',
    },
  },
  {
    ruleId: 'heading-order',
    severity: 'moderate',
    wcagCriterion: '1.3.1 Info and Relationships',
    description: 'Heading levels should only increase by one',
    affectedUsers: 'Screen reader users who navigate by headings',
    element: '<h4>Our services</h4>',
    selector: 'section#services > h4',
    fix: {
      explanation: 'Do not skip heading levels. Use h3 after h2, and style it with CSS if you need a different size.',
      before: '<h2>About</h2>\n<h4>Our services</h4>',
      after: '<h2>About</h2>\n<h3>Our services</h3>',
    },
  },
  {
    ruleId: 'landmark-one-main',
    severity: 'moderate',
    wcagCriterion: '1.3.1 Info and Relationships',
    description: 'Page should contain one main landmark',
    affectedUsers: 'Screen reader and keyboard users',
    element: '<div class="content">...</div>',
    selector: 'body > div.content',
    fix: {
      explanation: 'Wrap the primary content in a <main> element so users can jump straight to it.',
      before: '<div class="content">...</div>',
      after: '<main class="content">...</main>',
    },
  },
  {
    ruleId: 'tabindex',
    severity: 'minor',
    wcagCriterion: '2.4.3 Focus Order',
    description: 'Elements should not have tabindex greater than 0',
    affectedUsers: 'Keyboard users',
    element: '<a href="#top" tabindex="5">Back to top</a>',
    selector: 'footer a[tabindex]',
    fix: {
      explanation: 'Remove positive tabindex values. Order the DOM the way you want focus to move.',
      before: '<a href="#top" tabindex="5">Back to top</a>',
      after: '<a href="#top">Back to top</a>',
    },
  },
  {
    ruleId: 'meta-viewport',
    severity: 'minor',
    wcagCriterion: '1.4.4 Resize Text',
    description: 'Zooming and scaling must not be disabled',
    affectedUsers: 'People with low vision who zoom the page',
    element: '<meta name="viewport" content="width=device-width, user-scalable=no">',
    selector: 'meta[name="viewport"]',
    fix: {
      explanation: 'Remove user-scalable=no and maximum-scale restrictions.',
      before: '<meta name="viewport" content="width=device-width, user-scalable=no">',
      after: '<meta name="viewport" content="width=device-width, initial-scale=1">',
    },
  },
]

/* ---------- helpers ---------- */
function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

function cleanUrl(url) {
  return url.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '')
}

// Same URL = same issues (realistic)
function issuesFor(scan) {
  const h = hash(scan.url)
  const count = 4 + (h % 6) // 4 se 9 issues
  const start = h % LIBRARY.length
  return Array.from({ length: count }, (_, i) => {
    const base = LIBRARY[(start + i) % LIBRARY.length]
    return { id: `${scan.id}-${i + 1}`, ...base }
  })
}

function statusOf(scan) {
  if (Date.now() - scan.startedAt < SCAN_MS) return 'scanning'
  return scan.failed ? 'failed' : 'completed'
}

/* ---------- store (localStorage) ---------- */
function seed() {
  const now = Date.now()
  const rows = [
    ['example.com', 0.1],
    ['mystore.in', 1],
    ['demo-site.com', 2],
    ['blog.acme.dev', 4],
    ['status.broken.net', 6, true],
    ['college.edu.in', 12],
    ['news.portal.io', 22],
    ['shop.fresh.co', 38],
    ['docs.tool.dev', 55],
    ['portfolio.me', 75],
  ]
  return rows.map(([url, daysAgo, failed], i) => ({
    id: `seed-${i + 1}`,
    url,
    startedAt: now - daysAgo * DAY,
    failed: Boolean(failed),
  }))
}

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  const fresh = seed()
  save(fresh)
  return fresh
}

function save(scans) {
  try {
    localStorage.setItem(KEY, JSON.stringify(scans))
  } catch {
    /* ignore */
  }
}

const listItem = (s) => {
  const status = statusOf(s)
  return {
    id: s.id,
    url: s.url,
    date: new Date(s.startedAt).toISOString(),
    status,
    issues: status === 'completed' ? issuesFor(s).length : null,
  }
}

const detail = (s) => {
  const status = statusOf(s)
  return {
    id: s.id,
    url: s.url,
    date: new Date(s.startedAt).toISOString(),
    status,
    issues: status === 'completed' ? issuesFor(s) : [],
  }
}

function timeAgo(ms) {
  const mins = Math.round((Date.now() - ms) / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  const days = Math.round(hrs / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

/* ============================================================
   PUBLIC API (real backend ke saath same function names)
   ============================================================ */
export async function getDashboard() {
  await delay(600)
  const scans = load().sort((a, b) => b.startedAt - a.startedAt)

  // Har website ka latest completed scan = "open issues"
  const latestByUrl = new Map()
  scans.forEach((s) => {
    if (statusOf(s) === 'completed' && !latestByUrl.has(s.url)) latestByUrl.set(s.url, s)
  })
  const open = [...latestByUrl.values()].flatMap(issuesFor)
  const count = (level) => open.filter((i) => i.severity === level).length

  // Last 6 months chart
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - (5 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString('en', { month: 'short' }), value: 0 }
  })
  scans.forEach((s) => {
    const d = new Date(s.startedAt)
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (m) m.value += 1
  })

  return {
    stats: {
      totalScans: scans.length,
      openIssues: open.length,
      criticalSerious: count('critical') + count('serious'),
      lastScan: scans[0] ? timeAgo(scans[0].startedAt) : null,
    },
    scansOverTime: months.map(({ label, value }) => ({ label, value })),
    severity: ['critical', 'serious', 'moderate', 'minor'].map((level) => ({ level, count: count(level) })),
    recentScans: scans.slice(0, 5).map(listItem),
  }
}

export async function getHistory() {
  await delay(500)
  return load().sort((a, b) => b.startedAt - a.startedAt).map(listItem)
}

export async function getReports() {
  await delay(500)
  return load()
    .sort((a, b) => b.startedAt - a.startedAt)
    .filter((s) => statusOf(s) === 'completed')
    .map((s) => ({
      id: s.id,
      title: `Accessibility report: ${s.url}`,
      url: s.url,
      date: new Date(s.startedAt).toISOString(),
    }))
}

export async function getScan(id) {
  await delay(400)
  const scan = load().find((s) => s.id === id)
  return scan ? detail(scan) : null
}

export async function getLatestScan() {
  await delay(400)
  const latest = load().sort((a, b) => b.startedAt - a.startedAt)[0]
  return latest ? detail(latest) : null
}

// Naya scan shuru karta hai. URL mein "fail" ho to scan fail hoga (error state test).
export async function startScan(url) {
  await delay(500)
  const clean = cleanUrl(url)
  const scan = {
    id: `scan-${Date.now().toString(36)}`,
    url: clean,
    startedAt: Date.now(),
    failed: /fail/i.test(clean),
  }
  save([scan, ...load()])
  return { id: scan.id }
}

// Demo data reset (browser console mein: localStorage.removeItem('accessaudit-mock-scans'))
export function resetMockData() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
}