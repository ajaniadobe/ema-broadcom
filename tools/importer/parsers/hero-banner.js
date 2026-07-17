/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-banner. Base: hero.
 * Source: https://www.broadcom.com/
 * Structure (library): 1 column, 3 rows — row1 block name, row2 background image, row3 text (title + subheading + CTA).
 * xwalk field hints: image (row2), text (row3). imageAlt collapses into the img element.
 */
export default function parse(element, { document }) {
  // Background image — pick the largest/primary banner image
  const bgImage = element.querySelector('picture img.banner-image, img.banner-image, picture img, img');

  // Text content: heading, description, CTA link(s)
  const heading = element.querySelector('h1.featurette-heading, .teaser h1, h1, h2');
  const description = element.querySelector('.teaser-description .rte p, .teaser-description p, .teaser p');
  const ctaLinks = Array.from(element.querySelectorAll('.banner-cta-links a, .banner-cta a, a.lnk'));

  // Empty-block guard
  if (!bgImage && !heading && !description && ctaLinks.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background image (field:image). Empty cell if absent (no hint on empty cell).
  if (bgImage) {
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(bgImage);
    cells.push([imageCell]);
  } else {
    cells.push(['']);
  }

  // Row 3: text content (field:text) — heading, subheading, CTA all in one richtext cell.
  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  if (heading) textCell.appendChild(heading);
  if (description) textCell.appendChild(description);
  ctaLinks.forEach((a) => {
    // Wrap CTA in a paragraph so it renders as its own line in richtext
    const p = document.createElement('p');
    p.appendChild(a);
    textCell.appendChild(p);
  });
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-banner', cells });
  element.replaceWith(block);
}
