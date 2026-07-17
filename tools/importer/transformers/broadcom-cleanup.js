/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Broadcom site-wide cleanup.
 *
 * Removes non-authorable site chrome (header, footer, cookie consent, back-to-top,
 * iframes, and other non-content leftovers) so the import contains only the
 * page-level authorable content under #content > div.Home_V2.
 *
 * All selectors validated against migration-work/cleaned.html:
 *   #header                   -> line 3    (global site header / nav)
 *   #footer                   -> line 928  (global site footer)
 *   #onetrust-consent-sdk     -> line 1044 (OneTrust cookie consent)
 *   .scrollto-top-container   -> line 922  (back-to-top widget)
 *   a.scrollto-top            -> line 923  (back-to-top link)
 *   iframe                    -> lines 1026, 1302 (embedded/consent iframes)
 */

export default function transform(hookName, element, payload) {
  if (hookName === 'beforeTransform') {
    // Cookie consent overlay/banner blocks parsing; remove before block matching.
    // Selectors from captured DOM (cleaned.html).
    WebImporter.DOMUtils.remove(element, [
      '#onetrust-consent-sdk',
    ]);
  }

  if (hookName === 'afterTransform') {
    // Non-authorable global chrome and leftover non-content elements.
    // Selectors from captured DOM (cleaned.html).
    WebImporter.DOMUtils.remove(element, [
      '#header',
      '#footer',
      '.scrollto-top-container',
      'a.scrollto-top',
      'iframe',
      'noscript',
      'script',
      'style',
      'link',
    ]);
  }
}
