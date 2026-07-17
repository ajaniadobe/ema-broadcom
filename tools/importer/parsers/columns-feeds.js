/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-feeds. Base: columns.
 * Source: https://www.broadcom.com/
 * Structure (library): row 1 = block name; row 2 = N columns (one cell each).
 * Here: 3 columns (Latest Products, Latest News, Latest Blogs). Each column holds a
 *   heading, a list of dated linked items, and a footer link.
 * NOTE: Columns blocks do NOT use field hints (per xwalk hinting rules) — default content only.
 */
export default function parse(element, { document }) {
  const columns = Array.from(element.querySelectorAll(':scope > .content-block, .content-block'));

  // Empty-block guard
  if (columns.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const row = columns.map((column) => {
    const cell = [];

    // Column heading
    const heading = column.querySelector('h2, h3');
    if (heading) cell.push(heading);

    // Build a single list of items across all list groups (products has visible + collapsed groups).
    const listItems = Array.from(column.querySelectorAll('ul > li'));
    if (listItems.length > 0) {
      const ul = document.createElement('ul');
      listItems.forEach((li) => {
        const newLi = document.createElement('li');

        // Optional date
        const date = li.querySelector('.date');
        // Primary link (news/blogs wrap link in h5; products link is direct)
        const link = li.querySelector('a.lnk, a');
        // Product description (products feed only)
        const description = li.querySelector('.product-description');

        if (date && date.textContent.trim()) {
          const dateEl = document.createElement('p');
          dateEl.textContent = date.textContent.trim();
          newLi.appendChild(dateEl);
        }
        if (link) {
          const a = document.createElement('a');
          a.setAttribute('href', link.getAttribute('href'));
          a.textContent = link.textContent.trim();
          newLi.appendChild(a);
        }
        if (description && description.textContent.trim()) {
          const descEl = document.createElement('p');
          descEl.textContent = description.textContent.trim();
          newLi.appendChild(descEl);
        }

        ul.appendChild(newLi);
      });
      cell.push(ul);
    }

    // Footer link (news/blogs have an anchor footer; products footer is a JS button with no href — skip)
    const footerLink = column.querySelector('.feed-footer a[href], .show-more-footer a[href]');
    if (footerLink) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', footerLink.getAttribute('href'));
      a.textContent = footerLink.textContent.trim();
      p.appendChild(a);
      cell.push(p);
    }

    return cell;
  });

  const cells = [row];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-feeds', cells });
  element.replaceWith(block);
}
