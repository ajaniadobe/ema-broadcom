/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroBannerParser from './parsers/hero-banner.js';
import cardsSolutionsParser from './parsers/cards-solutions.js';
import cardsLinksParser from './parsers/cards-links.js';
import columnsFeedsParser from './parsers/columns-feeds.js';
import columnsMediaParser from './parsers/columns-media.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/broadcom-cleanup.js';
import sectionsTransformer from './transformers/broadcom-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-banner': heroBannerParser,
  'cards-solutions': cardsSolutionsParser,
  'cards-links': cardsLinksParser,
  'columns-feeds': columnsFeedsParser,
  'columns-media': columnsMediaParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: 'Broadcom corporate homepage with hero banner, promo pencil bar, solutions grid, popular links, news/blogs/products feeds, and about-us section',
  urls: [
    'https://www.broadcom.com/',
  ],
  blocks: [
    {
      name: 'hero-banner',
      instances: ['#content > div.Home_V2 > div.top-banner', '.top-banner'],
    },
    {
      name: 'cards-solutions',
      instances: ['.solutions-list'],
    },
    {
      name: 'cards-links',
      instances: ['.popular-link-list'],
    },
    {
      name: 'columns-feeds',
      instances: ['.feeds-content'],
    },
    {
      name: 'columns-media',
      instances: ['.ContentCardTwoColumn'],
    },
  ],
  sections: [
    {
      id: 'top-banner',
      name: 'Hero Banner',
      selector: ['#content > div.Home_V2 > div.top-banner', '.top-banner'],
      style: null,
      blocks: ['hero-banner'],
      defaultContent: [],
    },
    {
      id: 'pencil-promo-section',
      name: 'Promo Bar',
      selector: ['.pencil-promo-section'],
      style: 'promo',
      blocks: [],
      defaultContent: ['.pencil-promo-section'],
    },
    {
      id: 'solutions-section',
      name: 'Solutions Grid',
      selector: ['.solutions-section'],
      style: null,
      blocks: ['cards-solutions'],
      defaultContent: ['.solutions-title'],
    },
    {
      id: 'popular-links-section',
      name: 'Popular Links',
      selector: ['.popular-links-section'],
      style: 'dark',
      blocks: ['cards-links'],
      defaultContent: [],
    },
    {
      id: 'feeds-section',
      name: 'Feeds',
      selector: ['.feeds-section'],
      style: null,
      blocks: ['columns-feeds'],
      defaultContent: [],
    },
    {
      id: 'about-us-section',
      name: 'About Us',
      selector: ['.ContentCardTwoColumn-section', '#content > div.Home_V2 > div.main-body > div.section-container > div.section'],
      style: null,
      blocks: ['columns-media'],
      defaultContent: ['.section-title'],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        if (seen.has(element)) return;
        seen.add(element);
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, '') || '/index',
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
