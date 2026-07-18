# md2jcr Conversion: Handling Unsupported Elements

Guidance for converting imported content (`content/*.plain.html`) to JCR XML for
xwalk / Universal Editor projects, with a focus on elements that `@adobe/helix-md2jcr`
does not support out of the box.

## How md2jcr classifies content

The conversion pipeline is:

```
plain.html  ->  mdast  ->  markdown (grid tables)  ->  md2jcr  ->  JCR XML
```

`md2jcr` renders each top-level mdast node through a Handlebars partial. It only
registers partials for a fixed set of node types:

- `heading`, `paragraph`, `image`, `link`, `strong`, `emphasis`
- `columns` (the columns block) and `gridTable` (any block table)

Any node type without a matching partial falls through to the **`unsupported`**
partial, which throws:

```
UnsupportedElementError: Element '<type>' is currently not supported.
```

Practically, content resolves into one of two shapes:

- **Prose** (paragraphs, headings, links, emphasis, inline code, lists, code
  fences) becomes `text` nodes.
- **Structure** (a block table, or a genuine data table) becomes a `block` /
  content table.

So "unsupported" almost always means a construct that is neither plain prose nor a
recognized table: `blockquote`, raw `html` nodes, bare GFM/HTML tables that were not
wrapped as a block, stray `thematicBreak`, `footnoteDefinition`, unhandled frontmatter,
etc.

## Core principle

**Fix unsupported elements upstream (at import / transform time). Never patch the
md2jcr library.** By the time content reaches md2jcr, every node must already be
either prose or a well-formed table. Deciding what an element becomes is a
content-modeling decision made in the importer transformer/parser — the single
chokepoint before serialization.

## Decision guide for an unsupported element

Ask, in order:

1. **Is it decoration / prose?**
   Unwrap it into supported prose. Example: a `<blockquote>` that is just
   emphasized text can be replaced with its inner paragraphs. Lowest effort, but
   loses any visual distinction.

2. **Is it a meaningful, repeatable component?** (preferred when semantic)
   Model it as a **block**: create `blocks/<name>/` (`js`, `css`, `_<name>.json`
   model), register it (see below), and have the transformer emit it as a block
   table via `WebImporter.Blocks.createBlock(...)` with field hints. Example: the
   `note` block for documentation callouts.

3. **Is it genuine tabular data?**
   Leave it as a real table. md2jcr's `gridTable` partial handles tables that are
   not named blocks as content tables. The only requirement is that it survives the
   html->mdast step as a grid table and is **not** mistakenly converted into a
   named block.

4. **None of the above?**
   Map it to the closest existing block, model a new block, or degrade to prose —
   in that order. Forking md2jcr to add a partial is a last resort; new node-type
   support belongs upstream (the error message itself says "please open an issue").

## Rules that prevent the common failures

- **Handle unsupported elements in the transformer, per template.** Do not rely on
  md2jcr to cope; convert before serialization.
- **Prefer a block over unwrapping** when the element is semantically distinct
  (note / warning / tip callouts, admonitions, figures with captions). Unwrap only
  pure styling wrappers.
- **Block tables must be actual tables by the time md2jcr runs.** A
  `<div class="note">` in `.plain.html` only becomes a block if the html->md step
  converts it to a grid table. A leftover `<div>` or a raw GFM pipe table will
  throw.
- **Field-hint comments must sit inside a table cell.** `<!-- field:content -->`
  placed outside a cell leaks out as a stray `html` mdast node and throws
  `Element 'html' is currently not supported`.
- **Register xwalk blocks everywhere.** Add `blocks/<name>/_<name>.json`, add the
  block to the `section` filter in `models/_section.json`, then run
  `npm run build:json` so `component-models.json`, `component-definition.json`, and
  `component-filters.json` include it. Otherwise md2jcr fails with
  `The component '<Name>' does not exist`.
- **Scope block conversion tightly.** Convert only known block selectors
  (e.g. `div.note`) — never "all divs with a class". A broad selector turns real
  data tables and layout wrappers into bogus blocks (observed: the Software/Version
  compatibility tables were wrongly promoted to blocks until the selector was
  narrowed).
- **Keep prose as prose.** Lists, code fences, inline code, links, bold/italic all
  convert cleanly — do not over-engineer them into blocks.

## Validate by round-tripping

Do not verify by eye. Run the full plain.html -> md -> md2jcr conversion and assert:

1. No `UnsupportedElementError` is thrown.
2. The expected number of `model="<name>"` blocks are present.
3. Genuine data tables are preserved as content (not turned into blocks).

The reusable converter lives at `tools/importer/generate-jcr.mjs`. It must run with
the import toolchain's `node_modules` on the module resolution path (it depends on
`@adobe/helix-md2jcr`, `@adobe/helix-importer`, `unified`, `rehype-parse`,
`hast-util-to-mdast`, and the remark grid-table plugins). You normally do not call it
directly — use the wrapper below, which handles module resolution for you.

## Regenerating JCR

JCR generation is wired into the import step via `tools/importer/import-and-jcr.mjs`,
exposed as `npm run import`. It bundles the import script, runs the bulk import, then
generates JCR XML into `migration-work/jcr-content/` for the imported pages. The
wrapper also solves the module-resolution problem: `generate-jcr.mjs` needs the import
toolchain's `node_modules` (not installed in this repo), so the wrapper copies it into
the toolchain scripts folder for the run and removes it afterward.

### Import and generate JCR in one step

```bash
npm run import -- --template <name>
npm run import -- --import-script tools/importer/import-<name>.bundle.js --urls tools/importer/urls-<name>.txt
```

During a real import the JCR step is automatically scoped to the pages you just
imported (e.g. `--template <name>` only converts that template's pages), so importing
one page never re-touches another page's JCR.

### Regenerate JCR only (no re-import)

Pass `--skip-import` with a scope flag to (re)generate JCR for exactly the pages you
name — useful after editing a block, transformer, or model:

```bash
npm run import -- --skip-import --template <name>
npm run import -- --skip-import --paths index,us/en/.../release-notes
npm run import -- --skip-import --urls tools/importer/urls-<name>.txt
npm run import -- --skip-import --all      # every successful report
```

### Scope flags

Which imported pages get converted (precedence `--all` > `--paths` > `--urls` >
`--template`):

- `--template <name>` — pages whose report `template` matches `<name>`.
- `--paths <a,b,...>` — comma-separated doc paths as they appear in reports
  (e.g. `index` or `us/en/.../release-notes`); a trailing `.plain.html`/`.html` or
  leading `/` is tolerated.
- `--urls <file|list>` — a urls file (one per line) or comma-separated URLs; matches
  the report `url`. When importing, this also drives the import.
- `--all` — convert every successful report.
- No scope flag — the wrapper warns and converts all successful reports. Prefer an
  explicit flag.

### Why scoping matters

`generate-jcr.mjs` only converts block `<div>`s whose names are registered in
`tools/importer/page-templates.json`; everything else stays as content. Scoping is a
separate concern: it limits *which pages* are (re)converted so an unrelated page's
committed JCR is not silently regenerated. Keep both narrow — registered blocks only,
and only the pages you intend to touch.

## Worked example: documentation note callouts

Broadcom TechDocs pages use `<blockquote>` for note callouts. `blockquote` is
unsupported, so:

1. The transformer (`tools/importer/transformers/techdocs-cleanup.js`) converts each
   `<blockquote>` into a `note` block via `WebImporter.Blocks.createBlock`, with the
   note text in a `content` cell hinted `<!-- field:content -->`.
2. The `note` block (`blocks/note/`) provides the model, decoration, and styling
   (distinct left-border callout box).
3. The block is registered in `models/_section.json` and the generated
   `component-*.json` files via `npm run build:json`.
4. `note` is listed in the template's `blocks[]` in `page-templates.json`, so
   `generate-jcr.mjs` converts `div.note` (and no unrelated divs) into a block table.

Result: notes render as reusable, visually distinct blocks and the page converts to
JCR with no unsupported-element errors.

## Data tables: use the `Table` block, never a header-named block

md2jcr has **no support for a bare data table** — a plain GFM/HTML table throws
`Element 'table' is currently not supported`. Tabular data must be expressed as the
project's composite **`Table` block** (`blocks/table/`), which md2jcr renders as a
`model="table"` parent with `table-col-N` row items.

**The trap:** if you leave a source `<table>` untouched, the importer's html2md step
auto-names it a block using its first header cell — e.g. a table headed
"Software or tile" becomes a bogus `software-or-tile` block, and the header row is
consumed as the block name (so it is lost). The Broadcom TechDocs Compatibility and
Known/Resolved-Issues tables hit exactly this.

**The fix (in `techdocs-cleanup.js`, before the blockquote→note step):** rebuild every
genuine data `<table>` into the exact grid-table shape the `Table` block expects:

- Row 1 (full width, `colspan`): `Table` — the block name.
- Row 2 (full width, `colspan`): `table-<n>-columns` — the `filter` (column count).
- Each data row (including the original header row): a leading `table-col-<n>` marker
  cell, then the `<n>` real column cells.

Key details learned the hard way:

- **Column count** is the max cells across the source rows; `table-col-N` models
  only exist for N = 1..5, so out-of-range tables are skipped.
- **The full-width rows must use `colspan`** equal to `N + 1` (the marker column plus
  the data columns). Without this the serialized grid-table borders do not align, and
  md2jcr either treats the whole thing as prose or splits phantom rows. Border
  alignment — not the text — is what makes the grid table valid.
- **Run table conversion BEFORE `WebImporter.Blocks.createBlock`** (used by the
  note step): `createBlock` emits `<table>` elements, so snapshot the source tables
  (`Array.from(querySelectorAll('table'))`) and convert them first, or the generated
  block tables get wrapped too.
- **Register `table` in the template's `blocks[]`** in `page-templates.json` (with
  instance selector `table`) so `generate-jcr.mjs` recognizes `div.table` as a block
  to convert. The `table` block is already in the base scaffold's models/definitions.

Result: the data tables become proper, editable `Table` blocks with their header row
intact, and no header-derived phantom blocks appear in the JCR.
