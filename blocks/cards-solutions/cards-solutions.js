import { createOptimizedPicture } from '../../scripts/aem.js';
import { moveInstrumentation } from '../../scripts/scripts.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-solutions-card-image';
      else div.className = 'cards-solutions-card-body';
    });
    ul.append(li);
  });

  /* convert the "### Title" link paragraph into a heading link */
  ul.querySelectorAll('.cards-solutions-card-body a').forEach((a) => {
    const text = a.textContent.trim();
    const match = text.match(/^#{1,6}\s+(.*)$/);
    if (match) {
      const [, title] = match;
      a.textContent = title;
      const p = a.closest('p');
      if (p && p.childNodes.length === 1) {
        const h4 = document.createElement('h4');
        h4.className = 'cards-solutions-card-title';
        h4.append(a);
        p.replaceWith(h4);
      }
    }
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    // SVG icons should not be run through the raster optimizer (it mangles the src);
    // keep the original picture/img so vector glyphs render as authored.
    if (/\.svg(\?|$)/i.test(img.src)) return;
    const optimizedPic = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    moveInstrumentation(img, optimizedPic.querySelector('img'));
    img.closest('picture').replaceWith(optimizedPic);
  });
  block.textContent = '';
  block.append(ul);
}
