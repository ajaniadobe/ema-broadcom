/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-media. Base: columns.
 * Source: https://www.broadcom.com/
 * Structure (library): row 1 = block name; row 2 = 2 columns (one cell each).
 *   Left column: text (rich text) + CTA link.
 *   Right column: video represented by its poster image + video title heading.
 *     (The Brightcove player exposes only a blob: src at scrape time — no durable video URL —
 *      so the poster image is the faithful, importable representation of the media.)
 * NOTE: Columns blocks do NOT use field hints (per xwalk hinting rules) — default content only.
 */
export default function parse(element, { document }) {
  const cols = Array.from(element.querySelectorAll(':scope .row > [class*="col-"], .row > [class*="col-"]'));

  // --- LEFT COLUMN: text + CTA ---
  const leftCol = cols.find((c) => c.querySelector('.rte, .card-text'))
    || element.querySelector('.col-lg-7, .col-12.col-lg-7');
  const leftCell = [];
  if (leftCol) {
    const paragraphs = Array.from(leftCol.querySelectorAll('.rte p, .card-text p'));
    paragraphs.forEach((p) => {
      const np = document.createElement('p');
      np.textContent = p.textContent.trim();
      leftCell.push(np);
    });
    const cta = leftCol.querySelector('.cb-cta-link a, .card-footer a, a.card-link');
    if (cta) {
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.setAttribute('href', cta.getAttribute('href'));
      a.textContent = cta.textContent.trim();
      p.appendChild(a);
      leftCell.push(p);
    }
  }

  // --- RIGHT COLUMN: video poster image + title ---
  const rightCol = cols.find((c) => c.querySelector('.video-wrapper, .brightcove-wrapper, video-js, .vjs-poster'))
    || element.querySelector('.col-lg-5, .col-12.col-lg-5');
  const rightCell = [];
  if (rightCol) {
    // Derive the video title from the player control text (available once the player exists).
    const playBtn = rightCol.querySelector('.vjs-big-play-button, [title*="Play Video"]');
    const rawTitle = (playBtn && (playBtn.getAttribute('title') || playBtn.textContent) || '').trim();
    const videoTitle = rawTitle.replace(/^Play Video\s*/i, '').trim();

    // Poster image represents the video visually (Brightcove exposes no durable video URL,
    // only a blob: src, so the poster is the importable media artifact).
    const poster = rightCol.querySelector('.vjs-poster picture img, .vjs-poster img, .video-wrapper picture img, .video-wrapper img');
    if (poster) {
      const img = document.createElement('img');
      img.setAttribute('src', poster.getAttribute('src'));
      img.setAttribute('alt', poster.getAttribute('alt') || videoTitle || '');
      rightCell.push(img);
    }
    // Video title as a heading (present whenever the player has rendered).
    if (videoTitle) {
      const h = document.createElement('h3');
      h.textContent = videoTitle;
      rightCell.push(h);
    }
  }

  // Empty-block guard
  if (leftCell.length === 0 && rightCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[leftCell, rightCell]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-media', cells });
  element.replaceWith(block);
}
