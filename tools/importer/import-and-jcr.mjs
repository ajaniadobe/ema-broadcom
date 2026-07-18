/* eslint-disable no-console */
/**
 * Import wrapper that runs the content import AND generates JCR XML for every
 * successfully imported page in one step.
 *
 * Flow:
 *   1. Bundle the template import script (aem-import-bundle.sh).
 *   2. Run the bulk import (run-bulk-import.js) -> content/<path>.plain.html + reports.
 *   3. For each success report, generate JCR XML into migration-work/jcr-content/.
 *
 * JCR generation (generate-jcr.mjs) depends on the content-import toolchain's
 * node_modules (@adobe/helix-md2jcr, @adobe/helix-importer, unified, jsdom, ...),
 * which are NOT installed in this repo. So we run it from inside that scripts
 * folder (module resolution walks up to its node_modules). generate-jcr.mjs is
 * copied there for the run and removed afterwards.
 *
 * Usage:
 *   node tools/importer/import-and-jcr.mjs --template <name> [--skip-import]
 *   node tools/importer/import-and-jcr.mjs --import-script <bundle.js> --urls <urls.txt>
 *
 * JCR scope (which imported pages get converted):
 *   --template <name>   only pages whose report.template === <name>
 *   --paths <a,b,...>   only these doc paths (as they appear in reports, e.g.
 *                       "index" or "us/en/.../release-notes")
 *   --urls <file|list>  only pages whose report.url matches (file path or
 *                       comma-separated URLs). --urls also feeds the import.
 *   --all               convert every successful report (ignore scope)
 *
 * Scope precedence: --all > --paths > --urls > --template. If no scope flag is
 * given, the wrapper converts every successful report (with a warning) — pass a
 * scope flag (or --all) to be explicit. When importing (not --skip-import), the
 * import args naturally imply the scope, so the JCR step only touches those pages.
 *
 * See MD2JCR-BEST-PRACTICES.md for the conversion rationale.
 */
import {
  existsSync, readFileSync, readdirSync, copyFileSync, rmSync, mkdirSync,
} from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const REPO_ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const IMPORTER_DIR = join(REPO_ROOT, 'tools', 'importer');
const REPORTS_DIR = join(IMPORTER_DIR, 'reports');
const JCR_OUT_DIR = join(REPO_ROOT, 'migration-work', 'jcr-content');

// --- Resolve the excat-content-import scripts dir portably (mirrors content-import.md) ---
function resolveScriptsDir() {
  const rel = 'excat/skills/excat-content-import/scripts';
  const candidates = [
    `/excat-marketplace/${rel}`,
    join(process.cwd(), 'excat-marketplace', rel),
    process.env.EXCAT_MARKETPLACE_ROOT ? join(process.env.EXCAT_MARKETPLACE_ROOT, rel) : null,
    `/home/node/.excat-marketplaces/excat-marketplace/${rel}`,
  ].filter(Boolean);
  const found = candidates.find((p) => existsSync(join(p, 'run-bulk-import.js')));
  if (!found) {
    throw new Error(
      'Unable to resolve excat-content-import scripts directory. '
      + 'Set EXCAT_MARKETPLACE_ROOT to the excat-marketplace root and retry.',
    );
  }
  return found;
}

// --- Parse args ---
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--skip-import') { args.skipImport = true; continue; }
    if (a === '--all') { args.all = true; continue; }
    if (a.startsWith('--')) { args[a.slice(2)] = argv[i + 1]; i += 1; }
  }
  return args;
}

// Read a --urls value that may be a file path (one URL per line) or a
// comma-separated list, returning a Set of trimmed URLs.
function readUrlSet(value) {
  const urls = new Set();
  if (!value) return urls;
  let text = value;
  if (existsSync(value)) {
    text = readFileSync(value, 'utf-8');
  }
  text.split(/[\n,]+/).forEach((u) => {
    const t = u.trim();
    if (t) urls.add(t);
  });
  return urls;
}

const args = parseArgs(process.argv);
const scriptsDir = resolveScriptsDir();

// Resolve import script + urls, from an explicit pair or from a template name.
// Only required when actually importing; --skip-import runs the JCR step alone
// and may be scoped by --template/--paths/--urls without an import script.
let bundlePath = args['import-script'];
let urlsPath = args.urls;
if (args.template) {
  bundlePath = bundlePath || join(IMPORTER_DIR, `import-${args.template}.bundle.js`);
  urlsPath = urlsPath || join(IMPORTER_DIR, `urls-${args.template}.txt`);
}

// --- 1 + 2. Run the bulk import (unless skipped) ---
if (!args.skipImport) {
  if (!bundlePath || !urlsPath) {
    console.error('Import requires an import script + urls. Provide one of:');
    console.error('  --template <name>');
    console.error('  --import-script <bundle.js> --urls <urls.txt>');
    console.error('(or pass --skip-import to only (re)generate JCR)');
    process.exit(1);
  }
  const jsPath = bundlePath.replace(/\.bundle\.js$/, '.js');
  if (existsSync(jsPath) && jsPath !== bundlePath) {
    console.log(`[import-and-jcr] Bundling ${jsPath}`);
    execFileSync(join(scriptsDir, 'aem-import-bundle.sh'), ['--importjs', jsPath], { stdio: 'inherit' });
  }
  console.log(`[import-and-jcr] Running bulk import (${bundlePath})`);
  execFileSync('node', [
    join(scriptsDir, 'run-bulk-import.js'),
    '--import-script', bundlePath,
    '--urls', urlsPath,
  ], { stdio: 'inherit', cwd: REPO_ROOT });
}

// --- 3. Generate JCR for each successfully imported page ---
function collectSuccessReports(dir) {
  const out = [];
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) { out.push(...collectSuccessReports(full)); continue; }
    if (!entry.name.endsWith('.report.json')) continue;
    try {
      const r = JSON.parse(readFileSync(full, 'utf-8'));
      if (r.status === 'success' && r.path) out.push(r);
    } catch { /* skip malformed report */ }
  }
  return out;
}

const allReports = collectSuccessReports(REPORTS_DIR);
if (allReports.length === 0) {
  console.log('[import-and-jcr] No successful import reports found; nothing to convert.');
  process.exit(0);
}

// --- Scope which reports get converted to JCR ---
// Precedence: --all > --paths > --urls > --template > (default: everything).
function scopeReports(all) {
  if (args.all) {
    return { reports: all, label: 'all pages' };
  }
  if (args.paths) {
    const wanted = new Set(args.paths.split(',').map((p) => p.trim().replace(/^\/+|\.plain\.html$|\.html$/g, '')).filter(Boolean));
    return {
      reports: all.filter((r) => wanted.has(r.path)),
      label: `paths [${[...wanted].join(', ')}]`,
    };
  }
  if (args.urls) {
    const wanted = readUrlSet(args.urls);
    return {
      reports: all.filter((r) => wanted.has(r.url)),
      label: `urls (${wanted.size})`,
    };
  }
  if (args.template) {
    return {
      reports: all.filter((r) => r.template === args.template),
      label: `template "${args.template}"`,
    };
  }
  console.warn('[import-and-jcr] No scope flag given (--template/--paths/--urls/--all); converting ALL successful reports.');
  return { reports: all, label: 'all pages (default)' };
}

const { reports, label: scopeLabel } = scopeReports(allReports);
console.log(`[import-and-jcr] JCR scope: ${scopeLabel} -> ${reports.length} page(s)`);
if (reports.length === 0) {
  console.log('[import-and-jcr] No reports matched the requested scope; nothing to convert.');
  process.exit(0);
}

mkdirSync(JCR_OUT_DIR, { recursive: true });

// Copy generate-jcr.mjs into the scripts dir so its ESM imports resolve against
// the toolchain node_modules, then run it per page.
const genSrc = join(IMPORTER_DIR, 'generate-jcr.mjs');
const genRun = join(scriptsDir, 'generate-jcr.mjs');
copyFileSync(genSrc, genRun);

let ok = 0;
let failed = 0;
try {
  for (const r of reports) {
    const plainHtml = join(REPO_ROOT, 'content', `${r.path}.plain.html`);
    if (!existsSync(plainHtml)) {
      console.warn(`[import-and-jcr] skip ${r.path}: ${plainHtml} not found`);
      continue;
    }
    // Flatten the doc path into a single xml filename under jcr-content/.
    const xmlName = `${r.path.replace(/\//g, '_')}.xml`;
    const outXml = join(JCR_OUT_DIR, xmlName);
    try {
      execFileSync('node', [genRun, plainHtml, outXml, REPO_ROOT], { stdio: 'inherit' });
      ok += 1;
    } catch (e) {
      console.error(`[import-and-jcr] JCR generation FAILED for ${r.path}: ${e.message}`);
      failed += 1;
    }
  }
} finally {
  rmSync(genRun, { force: true });
}

console.log(`[import-and-jcr] JCR generation complete. Success: ${ok}, Failed: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
