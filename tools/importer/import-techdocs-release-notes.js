/* eslint-disable */
/* global WebImporter */

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/techdocs-cleanup.js';

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'techdocs-release-notes',
  description: 'Broadcom TechDocs documentation article (Tanzu Hub release notes): article title + markdown body, all default content',
  urls: [
    'https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/release-notes.html',
  ],
  blocks: [],
  sections: [
    {
      id: 'article-title',
      name: 'Article Title',
      selector: ['div.main-mid .main-mid-top'],
      style: null,
      blocks: [],
      defaultContent: ['div.main-mid .main-mid-top'],
    },
    {
      id: 'article-body',
      name: 'Article Body',
      selector: ['div.main-mid .main-content .markdown'],
      style: null,
      blocks: [],
      defaultContent: ['div.main-mid .main-content .markdown'],
    },
  ],
};

// TRANSFORMER REGISTRY
const transformers = [
  cleanupTransformer,
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

// EXPORT DEFAULT CONFIGURATION
export default {
  transform: (payload) => {
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup — remove cookie consent)
    executeTransformers('beforeTransform', main, payload);

    // 2. No blocks on this page — content is entirely default content.

    // 3. afterTransform (strip site chrome, keep the article body)
    executeTransformers('afterTransform', main, payload);

    // 4. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 5. Generate sanitized path
    const path = WebImporter.FileUtils.sanitizePath(
      new URL(params.originalURL).pathname.replace(/\/$/, '').replace(/\.html$/, ''),
    );

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: [],
      },
    }];
  },
};
