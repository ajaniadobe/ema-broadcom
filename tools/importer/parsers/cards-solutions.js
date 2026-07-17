/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-solutions. Base: cards (container block).
 * Source: https://www.broadcom.com/
 * Structure (library): container, one row per card. Each card row has 2 cells:
 *   cell 1 = image/icon (field:image), cell 2 = text (field:text) containing linked title + description.
 * xwalk field hints: image (col1), text (col2). imageAlt collapses into the img element.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll(':scope > .solution-item, .solution-item'));

  // Empty-block guard
  if (items.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  items.forEach((item) => {
    // Primary link wraps the icon + title
    const link = item.querySelector('a.lnk, a');
    const href = link ? link.getAttribute('href') : null;

    // Icon: prefer the default (visible) icon over the hover variant
    const icon = item.querySelector('.solution-icon img.solution-icon-default, .solution-icon img.image-source, .solution-icon img, img');

    // Title heading
    const title = item.querySelector('.solution-item-title, h4, h3, h2');

    // Description
    const description = item.querySelector('.solution-item-description .rte p, .solution-item-description p, .solution-item-description');

    // --- Cell 1: image (field:image) ---
    const imageCell = document.createDocumentFragment();
    if (icon) {
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(icon);
    }

    // --- Cell 2: text (field:text) — linked title + description ---
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (title) {
      if (href) {
        const a = document.createElement('a');
        a.setAttribute('href', href);
        const heading = document.createElement('h3');
        heading.textContent = title.textContent.trim();
        a.appendChild(heading);
        textCell.appendChild(a);
      } else {
        const heading = document.createElement('h3');
        heading.textContent = title.textContent.trim();
        textCell.appendChild(heading);
      }
    }
    if (description) {
      const p = document.createElement('p');
      p.textContent = description.textContent.trim();
      textCell.appendChild(p);
    }

    cells.push([imageCell, textCell]);
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-solutions', cells });
  element.replaceWith(block);
}
