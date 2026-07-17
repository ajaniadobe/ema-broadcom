/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Broadcom section breaks and section metadata.
 *
 * Runs in afterTransform only. Reads payload.template.sections and, for each
 * section (processed in reverse document order so insertions don't shift the
 * elements still to be processed):
 *   - inserts an <hr> before the section element for every non-first section,
 *   - appends a "Section Metadata" block (via WebImporter.Blocks.createBlock)
 *     after the section element for every section that declares a `style`.
 *
 * Section selectors are validated against migration-work/cleaned.html:
 *   top-banner            -> .top-banner                 (line 141)
 *   pencil-promo-section  -> .pencil-promo-section       (line 185, style: promo)
 *   solutions-section     -> .solutions-section          (line 217)
 *   popular-links-section -> .popular-links-section      (line 318, style: dark)
 *   feeds-section         -> .feeds-section              (line 348)
 *   about-us-section      -> .ContentCardTwoColumn-section (line 451)
 */

/**
 * Resolve the first matching element for a section from its list of selectors.
 */
function findSectionElement(root, selectors) {
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const selector of list) {
    if (!selector) continue;
    const el = root.querySelector(selector);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  if (hookName === 'afterTransform') {
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;

    const doc = (payload && payload.document) || element.ownerDocument;

    // Process in reverse order so earlier insertions do not disturb later lookups.
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      const sectionEl = findSectionElement(element, section && section.selector);
      if (!sectionEl) continue;

      // Section Metadata block after the section for sections that declare a style.
      if (section.style) {
        const metadataBlock = WebImporter.Blocks.createBlock(doc, {
          name: 'Section Metadata',
          cells: { style: section.style },
        });
        if (sectionEl.parentNode) {
          sectionEl.parentNode.insertBefore(metadataBlock, sectionEl.nextSibling);
        }
      }

      // Section break before every non-first section.
      if (i > 0 && sectionEl.parentNode) {
        const hr = doc.createElement('hr');
        sectionEl.parentNode.insertBefore(hr, sectionEl);
      }
    }
  }
}
