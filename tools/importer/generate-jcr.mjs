/* eslint-disable no-console */
/**
 * Generate JCR XML for an imported *.plain.html page.
 *
 * Pipeline (mirrors helix-importer PageImporter.createMarkdown + helix-md2jcr):
 *   plain.html -> (convert known block divs to tables) -> hast -> mdast
 *              -> markdown (grid tables) -> md2jcr -> JCR XML
 *
 * Usage:
 *   node generate-jcr.mjs <plain-html-path> <out-xml-path> <project-root>
 *
 * IMPORTANT: this script depends on the content-import toolchain's node_modules
 * (@adobe/helix-md2jcr, @adobe/helix-importer, unified, rehype-parse,
 * hast-util-to-mdast, @adobe/remark-gridtables, jsdom). Run it from a directory
 * whose node_modules resolves those packages (e.g. copy this file into the
 * excat-content-import scripts folder and run it there), passing absolute paths.
 *
 * See MD2JCR-BEST-PRACTICES.md in this folder for the rationale.
 */
import { readFileSync, writeFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { unified } from 'unified';
import parse from 'rehype-parse';
import { toMdast, defaultHandlers } from 'hast-util-to-mdast';
import stringify from 'remark-stringify';
import remarkGridTable from '@adobe/remark-gridtables';
import { md2jcr } from '@adobe/helix-md2jcr';
import DOMUtils from '@adobe/helix-importer/src/utils/DOMUtils.js';
import Blocks from '@adobe/helix-importer/src/utils/Blocks.js';
import gridtableHandlers from '@adobe/helix-importer/src/importer/hast-to-mdast-gridtable-handlers.js';

const [, , htmlPath, outPath, projectRoot] = process.argv;
if (!htmlPath || !outPath) {
  console.error('Usage: node generate-jcr.mjs <plain-html-path> <out-xml-path> <project-root>');
  process.exit(1);
}

// Block selectors to convert into grid tables. Scope this TIGHTLY to real EDS
// block wrappers only — never "all divs with a class" — or genuine data tables
// and layout wrappers get wrongly promoted to blocks. See best-practices doc.
//
// The authoritative list of known blocks is page-templates.json: every block
// name registered on any template is a real block. Data tables and layout
// wrappers are never registered there, so they are correctly left as content.
function resolveBlockSelectors(root) {
  try {
    const pt = JSON.parse(readFileSync(`${root}/tools/importer/page-templates.json`, 'utf-8'));
    const names = new Set();
    for (const tmpl of pt.templates ?? []) {
      for (const b of tmpl.blocks ?? []) {
        if (b.name) names.add(b.name);
      }
    }
    return [...names].map((n) => `div.${n}`);
  } catch {
    return [];
  }
}

const raw = readFileSync(htmlPath, 'utf-8');
const dom = new JSDOM(`<body><div class="root-content">${raw}</div></body>`);
const { document } = dom.window;
const container = document.querySelector('.root-content');

const blockSelectors = resolveBlockSelectors(projectRoot || process.cwd());

// Convert each known block div (e.g. <div class="note">) into a table, mirroring
// helix-importer's Blocks.convertBlocksToTables (scoped to registered blocks only).
const blockEls = blockSelectors.length
  ? container.querySelectorAll(blockSelectors.join(', '))
  : [];
blockEls.forEach((block) => {
  const name = Blocks.computeBlockName(block.className);
  const rows = block.querySelectorAll(':scope > div');
  if (!rows.length) return;
  const data = [[name]];
  rows.forEach((div) => {
    const subDivs = div.querySelectorAll(':scope > div');
    if (subDivs && subDivs.length > 0) {
      const rowData = [];
      subDivs.forEach((cell) => {
        const cellContent = [];
        Array.from(cell.childNodes).forEach((c) => cellContent.push(c));
        rowData.push(cellContent);
      });
      data.push(rowData);
    } else {
      data.push([div.innerHTML]);
    }
  });
  const table = DOMUtils.createTable(data, document);
  block.replaceWith(table);
});

const html = container.innerHTML;
const hast = unified().use(parse, { emitParseErrors: true, fragment: true }).parse(html);
const mdast = toMdast(hast, { handlers: { ...defaultHandlers, ...gridtableHandlers } });
const md = unified()
  .use(stringify, {
    strong: '*',
    emphasis: '*',
    bullet: '-',
    fence: '`',
    fences: true,
    incrementListMarker: true,
    rule: '-',
    ruleRepetition: 3,
    ruleSpaces: false,
  })
  .use(remarkGridTable)
  .stringify(mdast);

const root = projectRoot || process.cwd();
const opts = {};
try {
  opts.models = JSON.parse(readFileSync(`${root}/component-models.json`, 'utf-8'));
  opts.definition = JSON.parse(readFileSync(`${root}/component-definition.json`, 'utf-8'));
  opts.filters = JSON.parse(readFileSync(`${root}/component-filters.json`, 'utf-8'));
} catch (e) {
  console.error('Warning: could not load component JSON:', e.message);
}

// Emit the intermediate markdown next to the xml for reference/debugging.
writeFileSync(outPath.replace(/\.xml$/, '.md'), md, 'utf-8');
const jcr = await md2jcr(md, opts);
writeFileSync(outPath, jcr, 'utf-8');
console.log(`JCR XML written to ${outPath} (${jcr.length} bytes)`);
