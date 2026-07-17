/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-links. Base: cards (container block, no-images variant).
 * Source: https://www.broadcom.com/
 * Structure (library): container, one row per card. Each card row has 2 cells:
 *   cell 1 = image (empty here — no-images variant), cell 2 = text (field:text) containing the CTA link.
 * xwalk field hints: text (col2). The image cell is left empty (no hint on empty cells).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(':scope > .popular-link-wrapper, .popular-link-wrapper'));

  // Empty-block guard
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((item) => {
    const link = item.querySelector('a.popular-link, a.lnk, a');
    if (!link) return;

    // Cell 1: image — empty for the no-images variant, but the cell must still exist.
    const imageCell = '';

    // Cell 2: text (field:text) — the CTA link.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    textCell.appendChild(link);

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-links', cells });
  element.replaceWith(block);
}
