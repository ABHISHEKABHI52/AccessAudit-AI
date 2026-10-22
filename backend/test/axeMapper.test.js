'use strict'

const test = require('node:test')
const assert = require('node:assert/strict')

const { mapAxeResults, normalizeSeverity, wcagCriterionFromTags } = require('../src/axeMapper')

test('normalizeSeverity passes through real axe impact values', () => {
  assert.equal(normalizeSeverity('critical'), 'critical')
  assert.equal(normalizeSeverity('serious'), 'serious')
  assert.equal(normalizeSeverity('moderate'), 'moderate')
  assert.equal(normalizeSeverity('minor'), 'minor')
  assert.equal(normalizeSeverity(null), 'moderate', 'null impact falls back to moderate (documented)')
  assert.equal(normalizeSeverity('bogus'), 'moderate')
})

test('wcagCriterionFromTags extracts criterion tags, ignoring level tags', () => {
  assert.equal(wcagCriterionFromTags(['cat.text-alternatives', 'wcag2a', 'wcag111']), 'WCAG 1.1.1')
  assert.equal(wcagCriterionFromTags(['wcag2aa', 'wcag143']), 'WCAG 1.4.3')
  assert.equal(wcagCriterionFromTags(['wcag2aa', 'wcag2410']), 'WCAG 2.4.10')
  assert.equal(wcagCriterionFromTags(['best-practice']), null)
  assert.equal(wcagCriterionFromTags(undefined), null)
})

test('mapAxeResults converts real axe output into the frontend issue contract', () => {
  const axeResults = {
    testEngine: { name: 'axe-core', version: '4.10.2' },
    timestamp: '2026-01-01T00:00:00.000Z',
    violations: [
      {
        id: 'image-alt',
        impact: 'critical',
        help: 'Images must have alternative text',
        description: 'Ensures <img> elements have alternate text',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/image-alt',
        tags: ['cat.text-alternatives', 'wcag2a', 'wcag111'],
        nodes: [
          {
            html: '<img src="x.jpg">',
            target: ['main', 'img'],
            failureSummary: 'Fix any of the following: ... element has no title attribute',
            impact: 'critical',
          },
        ],
      },
      {
        id: 'color-contrast',
        impact: 'serious',
        help: 'Elements must meet minimum colour contrast ratio thresholds',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/color-contrast',
        tags: ['cat.color', 'wcag2aa', 'wcag143'],
        nodes: [{ html: '<p>Hi</p>', target: ['p'], failureSummary: 'Contrast 2.1:1' }],
      },
    ],
    incomplete: [{ id: 'link-in-text-block', help: 'Links must be distinguishable', nodes: [{}, {}] }],
    passes: [{ id: 'html-has-lang' }, { id: 'document-title' }],
  }

  const mapped = mapAxeResults(axeResults)
  assert.equal(mapped.issues.length, 2)
  assert.equal(mapped.passesCount, 2)
  assert.equal(mapped.incomplete.length, 1)
  assert.equal(mapped.incomplete[0].count, 2)
  assert.equal(mapped.engine.name, 'axe-core')

  const [imageAlt, contrast] = mapped.issues
  assert.equal(imageAlt.id, 'image-alt-1')
  assert.equal(imageAlt.ruleId, 'image-alt')
  assert.equal(imageAlt.severity, 'critical')
  assert.equal(imageAlt.wcagCriterion, 'WCAG 1.1.1')
  assert.equal(imageAlt.description, 'Images must have alternative text')
  assert.equal(imageAlt.element, '<img src="x.jpg">')
  assert.equal(imageAlt.selector, 'main img')
  assert.equal(imageAlt.failureSummary, 'Fix any of the following: ... element has no title attribute')
  assert.equal(imageAlt.affectedNodes, 1)
  assert.ok(imageAlt.affectedUsers && imageAlt.affectedUsers.length > 0)
  assert.equal(imageAlt.fix.before, '<img src="x.jpg">')
  assert.ok(imageAlt.fix.explanation.length > 0)
  assert.ok(imageAlt.helpUrl.includes('dequeuniversity.com'))
  assert.deepEqual(imageAlt.tags, ['cat.text-alternatives', 'wcag2a', 'wcag111'])

  // colour-contrast has curated guidance without fabricated before/after code.
  assert.equal(contrast.severity, 'serious')
  assert.equal(contrast.wcagCriterion, 'WCAG 1.4.3')
  assert.equal(contrast.fix.after, null)
})

test('mapAxeResults never invents findings for empty or missing input', () => {
  assert.deepEqual(mapAxeResults({ violations: [], incomplete: [], passes: [] }).issues, [])
  assert.deepEqual(mapAxeResults(null).issues, [])
  assert.deepEqual(mapAxeResults({}).issues, [])
})

test('unmapped rules get an honest fallback that points to axe documentation', () => {
  const mapped = mapAxeResults({
    violations: [
      {
        id: 'some-future-rule',
        impact: null,
        help: 'Future rule help',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.10/some-future-rule',
        tags: ['best-practice'],
        nodes: [{ html: '<div></div>', target: ['div'] }],
      },
    ],
    incomplete: [],
    passes: [],
  })
  const issue = mapped.issues[0]
  assert.equal(issue.severity, 'moderate')
  assert.equal(issue.wcagCriterion, null)
  assert.match(issue.fix.explanation, /dequeuniversity\.com/)
  assert.equal(issue.fix.after, null, 'no fabricated example code')
  assert.match(issue.affectedUsers, /General guidance/)
})
