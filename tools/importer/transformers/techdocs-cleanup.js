/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Broadcom TechDocs documentation article cleanup.
 *
 * Scope: the "techdocs-release-notes" template (single documentation article page,
 * e.g. Tanzu Hub release notes). Separate from broadcom-cleanup.js which targets the
 * corporate homepage — the docs shell uses different selectors.
 *
 * Keeps ONLY the center article (div.main-mid → div.main-mid-top title/description +
 * div.main-content .markdown prose/lists/code/tables) and strips all surrounding site
 * chrome. Every selector below was verified against migration-work/cleaned.html.
 */

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Cookie consent overlay — verified in cleaned.html: <div id="onetrust-consent-sdk">
    WebImporter.DOMUtils.remove(element, ['#onetrust-consent-sdk']);
  }

  if (hookName === 'afterTransform') {
    // Non-authorable docs-shell chrome. All selectors verified in cleaned.html.
    WebImporter.DOMUtils.remove(element, [
      // Top navigation / header
      'nav.cmp-header',
      '.navbar',
      '.header-gradient',
      '.footer-gradient',
      // Breadcrumbs
      'nav.cmp-breadcrumbs',
      // Left sidebar: TOC, version dropdown, language select
      'div.main-left',
      // Right sidebar: in-page navigation + feedback widget
      'div.main-right',
      'div.main-right-mobile',
      // Search / PDF widget (child of main-mid — remove selectively, keep the rest of main-mid)
      'div.main-mid-top-search-pdf',
      // Previous / next article navigation
      'div.previous-next-navigation',
      // Support resources block
      'div.cmp-support-resources',
      // Footer
      'footer.cmp-footer',
      // Leftover non-content elements
      'script',
      'style',
      'noscript',
      'iframe',
      'link',
    ]);
  }
}
