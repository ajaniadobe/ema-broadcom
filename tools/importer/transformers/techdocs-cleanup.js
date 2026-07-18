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

    const doc = element.ownerDocument;

    // STEP 1 — Genuine data <table>s must become the project "Table" block, NOT a
    // block auto-named after the first header cell (leaving a raw <table> for
    // html2md turns "Software or tile" into a bogus "software-or-tile" block and
    // drops the header row). Rebuild each table as the EDS Table block structure
    // md2jcr understands:
    //   row 1 (full-width): "Table"             -> block name
    //   row 2 (full-width): "table-<n>-columns"  -> the filter (column count)
    //   each data row: ["table-col-<n>", ...cells] incl. the original header row
    // Full-width rows use colspan so the serialized grid table aligns (misaligned
    // borders would make md2jcr treat the whole thing as prose or mis-split rows).
    //
    // IMPORTANT: this runs BEFORE the blockquote->note conversion below. That step
    // uses WebImporter.Blocks.createBlock, which itself emits <table> elements; if
    // table conversion ran afterwards it would wrap those generated tables too.
    // Snapshotting the source tables up front (Array.from) and running first keeps
    // us scoped to the page's real data tables only.
    Array.from(element.querySelectorAll('table')).forEach((srcTable) => {
      const srcRows = Array.from(srcTable.querySelectorAll('tr'))
        .filter((tr) => tr.querySelector('th, td'));
      if (srcRows.length === 0) return;
      const ncol = Math.max(
        ...srcRows.map((tr) => tr.querySelectorAll('th, td').length),
      );
      if (ncol < 1 || ncol > 5) return; // table-col-N models cover 1..5 columns
      const total = ncol + 1; // +1 for the leading table-col-N marker column

      const out = doc.createElement('table');
      const fullRow = (text) => {
        const tr = doc.createElement('tr');
        const td = doc.createElement('td');
        td.setAttribute('colspan', String(total));
        td.textContent = text;
        tr.appendChild(td);
        out.appendChild(tr);
      };
      fullRow('Table');
      fullRow(`table-${ncol}-columns`);
      srcRows.forEach((tr) => {
        const cells = Array.from(tr.querySelectorAll('th, td'));
        const row = doc.createElement('tr');
        const marker = doc.createElement('td');
        marker.textContent = `table-col-${ncol}`;
        row.appendChild(marker);
        for (let i = 0; i < ncol; i += 1) {
          const td = doc.createElement('td');
          if (cells[i]) td.innerHTML = cells[i].innerHTML;
          row.appendChild(td);
        }
        out.appendChild(row);
      });
      srcTable.replaceWith(out);
    });

    // STEP 2 — blockquote is not a supported node type in the xwalk md2jcr
    // conversion (throws UnsupportedElementError). These are documentation "note"
    // callouts — convert each into a "note" block so it renders as a distinct note
    // box. WebImporter.Blocks.createBlock builds the block table; the single cell
    // carries the note content with the field:content hint for the xwalk model.
    element.querySelectorAll('blockquote').forEach((bq) => {
      const contentCell = doc.createDocumentFragment();
      contentCell.appendChild(doc.createComment(' field:content '));
      while (bq.firstChild) {
        contentCell.appendChild(bq.firstChild);
      }

      const block = WebImporter.Blocks.createBlock(doc, {
        name: 'note',
        cells: [[contentCell]],
      });
      bq.replaceWith(block);
    });
  }
}
