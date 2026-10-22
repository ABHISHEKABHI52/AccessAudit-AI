'use strict'

/*
 * Rule-based remediation guidance for common axe-core rules.
 *
 * This is NOT AI-generated content. Every entry is a hand-written, generic
 * description of how the named axe-core rule is normally fixed, plus an
 * optional generic example snippet. Rules without an entry get an honest
 * fallback built from axe-core's own help text and documentation URL — no
 * fabricated code suggestions are ever produced.
 */

const RULE_GUIDANCE = {
  'image-alt': {
    affectedUsers: 'Screen reader users cannot understand images that have no alternative text.',
    explanation: 'Add an alt attribute to the image that describes its content or purpose. Use alt="" only when the image is purely decorative.',
    exampleAfter: '<img src="photo.jpg" alt="Team reviewing the project roadmap">',
  },
  'input-image-alt': {
    affectedUsers: 'Screen reader and voice-control users cannot identify image submit buttons without alternative text.',
    explanation: 'Add an alt attribute to the <input type="image"> element that describes the action it performs.',
    exampleAfter: '<input type="image" src="search.png" alt="Search">',
  },
  'area-alt': {
    affectedUsers: 'Screen reader users navigating image maps cannot understand link areas without alternative text.',
    explanation: 'Add an alt attribute to every <area> element in the image map describing its destination or action.',
    exampleAfter: '<area shape="rect" coords="0,0,80,40" href="/about" alt="About us">',
  },
  'button-name': {
    affectedUsers: 'Screen reader and voice-control users cannot identify buttons that have no accessible name.',
    explanation: 'Give the button an accessible name with visible text inside the button, or an aria-label / aria-labelledby attribute when the button only contains an icon.',
    exampleAfter: '<button type="button" aria-label="Open menu"><svg aria-hidden="true">...</svg></button>',
  },
  'link-name': {
    affectedUsers: 'Screen reader users who navigate by links cannot tell where a link goes without an accessible name.',
    explanation: 'Give the link discernible text: visible link text, or an aria-label when the link only contains an icon.',
    exampleAfter: '<a href="/cart" aria-label="Shopping cart"><svg aria-hidden="true">...</svg></a>',
  },
  label: {
    affectedUsers: 'Screen reader and voice-control users cannot identify form fields that have no label.',
    explanation: 'Connect a <label for="..."> element to the input (or wrap the input in a label). A placeholder alone is not a label. aria-label or aria-labelledby also work when a visible label is impossible.',
    exampleAfter: '<label for="email">Email</label>\n<input id="email" type="email">',
  },
  'select-name': {
    affectedUsers: 'Screen reader users cannot identify select controls without an accessible name.',
    explanation: 'Associate a <label> with the select element, or give it an aria-label / aria-labelledby attribute.',
    exampleAfter: '<label for="country">Country</label>\n<select id="country">...</select>',
  },
  'color-contrast': {
    affectedUsers: 'People with low vision or colour-vision deficiency may not be able to read text that does not contrast enough with its background.',
    explanation: 'Increase the contrast between the text colour and its background so the ratio is at least 4.5:1 for normal text (3:1 for large text). Check the axe-core help link for the measured ratio.',
  },
  'html-has-lang': {
    affectedUsers: 'Screen reader users may hear the page pronounced in the wrong language when the page language is not declared.',
    explanation: 'Set the main language of the page on the <html> element with a valid BCP 47 language code.',
    exampleAfter: '<html lang="en">',
  },
  'html-lang-valid': {
    affectedUsers: 'Screen reader users may receive incorrect pronunciation when the declared language code is invalid.',
    explanation: 'Use a valid BCP 47 language code on the <html> element, for example lang="en" or lang="en-GB".',
    exampleAfter: '<html lang="en">',
  },

  'valid-lang': {
    affectedUsers: 'Screen reader users may receive incorrect pronunciation for elements that declare an invalid language.',
    explanation: 'Use a valid BCP 47 language code on the element that overrides the page language.',
  },
  'document-title': {
    affectedUsers: 'Screen reader users rely on the page title to understand what a page is about and to tell pages apart.',
    explanation: 'Give the page a unique, descriptive <title> inside <head>.',
    exampleAfter: '<title>Order confirmation - Example Shop</title>',
  },
  'heading-order': {
    affectedUsers: 'Screen reader users who navigate by heading levels get confused when levels are skipped.',
    explanation: 'Change the heading level so headings descend one level at a time (h2 after h1, h3 after h2). Style headings with CSS instead of choosing a level for its size.',
  },
  'empty-heading': {
    affectedUsers: 'Screen reader users hear an unlabelled heading while navigating the page outline.',
    explanation: 'Remove the empty heading or give it descriptive text.',
  },
  'frame-title': {
    affectedUsers: 'Screen reader users cannot identify the purpose of an iframe that has no title.',
    explanation: 'Add a title attribute to the <iframe> that describes its content.',
    exampleAfter: '<iframe title="Customer reviews widget" src="..."></iframe>',
  },
  'meta-viewport': {
    affectedUsers: 'People who need to zoom the page (low vision users) can be blocked when zooming is disabled in the viewport meta tag.',
    explanation: 'Allow zooming: remove user-scalable=no / maximum-scale restrictions from the viewport meta tag.',
    exampleAfter: '<meta name="viewport" content="width=device-width, initial-scale=1">',
  },
  list: {
    affectedUsers: 'Screen reader users receive broken list semantics when non-list-item elements sit directly inside <ul>/<ol>.',
    explanation: 'Keep only <li> (and script/template) elements as direct children of <ul> and <ol>.',
  },
  listitem: {
    affectedUsers: 'Screen reader users lose list context when <li> elements are not inside a valid list container.',
    explanation: 'Make sure every <li> is a direct child of a <ul> or <ol>.',
  },
  tabindex: {
    affectedUsers: 'Keyboard users can get stuck or lose logical focus order when positive tabindex values are used.',
    explanation: 'Use tabindex="0" for natural order and tabindex="-1" for programmatic focus only. Avoid positive tabindex values.',
  },
  'aria-hidden-focus': {
    affectedUsers: 'Keyboard users can land on controls that are hidden from assistive technology, causing confusion.',
    explanation: 'Do not put aria-hidden="true" on containers that contain focusable elements. Hide the elements themselves, or remove them from the tab order.',
  },
  'landmark-one-main': {
    affectedUsers: 'Screen reader users rely on landmarks to jump between page regions; duplicate or missing main landmarks make navigation harder.',
    explanation: 'Include exactly one <main> element (or role="main") on the page.',
  },
  region: {
    affectedUsers: 'Screen reader users can miss content that is not placed inside a landmark region.',
    explanation: 'Place all page content inside landmarks such as <header>, <nav>, <main>, <aside> or <footer>.',
  },
}

const GENERIC_AFFECTED_USERS = 'General guidance: issues like this one can block or confuse people who use assistive technology such as screen readers. See the axe-core rule documentation for details.'

/**
 * Returns honest, rule-based guidance for an axe-core rule. Never fabricates
 * page-specific code edits; example snippets are generic patterns only.
 */
function guidanceFor(ruleId, { help, helpUrl } = {}) {
  const entry = RULE_GUIDANCE[ruleId]
  if (entry) {
    const exampleNote = entry.exampleAfter ? ' The "After" block shows a generic example pattern, not an automatic edit of this page.' : ''
    return {
      affectedUsers: entry.affectedUsers ?? null,
      explanation: `${entry.explanation}${exampleNote}`,
      exampleAfter: entry.exampleAfter ?? null,
    }
  }
  const doc = helpUrl ? ` ${helpUrl}` : ''
  return {
    affectedUsers: GENERIC_AFFECTED_USERS,
    explanation: help
      ? `axe-core reports: ${help}. No specific automated fix is available for this rule — follow the guidance in the rule documentation:${doc}`
      : `Follow the guidance in the axe-core rule documentation:${doc}`,
    exampleAfter: null,
  }
}

module.exports = { guidanceFor, RULE_GUIDANCE }
