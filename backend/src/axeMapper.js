'use strict'

/*
 * Maps raw axe-core results to the data contract the existing frontend
 * consumes (see src/hooks/useScanData.js in the frontend):
 *
 * Issue: { id, ruleId, severity, wcagCriterion, description, affectedUsers,
 *          element, selector, fix: { explanation, before, after } }
 *
 * Extended fields keep the original axe evidence: impact, help, helpUrl, tags,
 * affectedNodes, failureSummary. Severity uses axe-core's own impact values
 * (critical | serious | moderate | minor); anything else (e.g. null impact)
 * falls back to "moderate" — documented, no other mapping is applied.
 */

const { guidanceFor } = require('./fixGuidance')

const SEVERITIES = new Set(['critical', 'serious', 'moderate', 'minor'])
const DEFAULT_SEVERITY = 'moderate'
const MAX_HTML_LENGTH = 400
const MAX_TEXT_LENGTH = 600

function normalizeSeverity(impact) {
  return SEVERITIES.has(impact) ? impact : DEFAULT_SEVERITY
}

/** wcag111 -> "WCAG 1.1.1", wcag2410 -> "WCAG 2.4.10"; level tags (wcag2aa) are ignored. */
function wcagCriterionFromTags(tags) {
  if (!Array.isArray(tags)) return null
  const criterionTag = tags.find((tag) => /^wcag\d{3,4}$/.test(tag))
  if (!criterionTag) return null
  const digits = criterionTag.slice(4)
  const formatted = digits.length === 3
    ? `${digits[0]}.${digits[1]}.${digits[2]}`
    : `${digits[0]}.${digits[1]}.${digits.slice(2)}`
  return `WCAG ${formatted}`
}

function truncate(text, max) {
  const value = String(text ?? '')
  return value.length > max ? `${value.slice(0, max - 1)}…` : value
}

function selectorFromTarget(target) {
  if (Array.isArray(target)) return target.join(' ')
  return typeof target === 'string' ? target : null
}

function mapNode(node) {
  if (!node) return null
  return {
    html: truncate(node.html, MAX_HTML_LENGTH) || null,
    selector: selectorFromTarget(node.target),
    failureSummary: truncate(node.failureSummary, MAX_TEXT_LENGTH) || null,
    impact: node.impact ?? null,
  }
}

function mapViolation(violation, index) {
  const nodes = Array.isArray(violation.nodes) ? violation.nodes : []
  const firstNode = mapNode(nodes[0])
  const guidance = guidanceFor(violation.id, { help: violation.help, helpUrl: violation.helpUrl })

  return {
    id: `${violation.id}-${index + 1}`,
    ruleId: violation.id,
    severity: normalizeSeverity(violation.impact),
    impact: violation.impact ?? null,
    wcagCriterion: wcagCriterionFromTags(violation.tags),
    // Short, human-readable rule summary ("Images must have alternative text").
    description: violation.help || violation.description || violation.id,
    affectedUsers: guidance.affectedUsers,
    element: firstNode?.html ?? null,
    selector: firstNode?.selector ?? null,
    fix: {
      explanation: guidance.explanation,
      before: firstNode?.html ?? null,
      after: guidance.exampleAfter,
    },
    // Original axe-core evidence, preserved for the UI / exports.
    help: violation.help ?? null,
    axeDescription: violation.description ?? null,
    helpUrl: violation.helpUrl ?? null,
    tags: Array.isArray(violation.tags) ? violation.tags : [],
    affectedNodes: nodes.length,
    failureSummary: firstNode?.failureSummary ?? null,
  }
}

function mapIncomplete(result) {
  return {
    ruleId: result.id,
    help: result.help ?? null,
    helpUrl: result.helpUrl ?? null,
    count: Array.isArray(result.nodes) ? result.nodes.length : 0,
  }
}

/** Converts a full axe-core results object into the stored scan payload. */
function mapAxeResults(axeResults) {
  const violations = Array.isArray(axeResults?.violations) ? axeResults.violations : []
  const incomplete = Array.isArray(axeResults?.incomplete) ? axeResults.incomplete : []
  const passes = Array.isArray(axeResults?.passes) ? axeResults.passes : []

  return {
    issues: violations.map(mapViolation),
    incomplete: incomplete.map(mapIncomplete),
    passesCount: passes.length,
    engine: axeResults?.testEngine
      ? { name: axeResults.testEngine.name ?? null, version: axeResults.testEngine.version ?? null }
      : null,
    axeTimestamp: axeResults?.timestamp ?? null,
  }
}

module.exports = { mapAxeResults, normalizeSeverity, wcagCriterionFromTags }
