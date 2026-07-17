/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-techdocs-release-notes.js
  var import_techdocs_release_notes_exports = {};
  __export(import_techdocs_release_notes_exports, {
    default: () => import_techdocs_release_notes_default
  });

  // tools/importer/transformers/techdocs-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, ["#onetrust-consent-sdk"]);
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        // Top navigation / header
        "nav.cmp-header",
        ".navbar",
        ".header-gradient",
        ".footer-gradient",
        // Breadcrumbs
        "nav.cmp-breadcrumbs",
        // Left sidebar: TOC, version dropdown, language select
        "div.main-left",
        // Right sidebar: in-page navigation + feedback widget
        "div.main-right",
        "div.main-right-mobile",
        // Search / PDF widget (child of main-mid — remove selectively, keep the rest of main-mid)
        "div.main-mid-top-search-pdf",
        // Previous / next article navigation
        "div.previous-next-navigation",
        // Support resources block
        "div.cmp-support-resources",
        // Footer
        "footer.cmp-footer",
        // Leftover non-content elements
        "script",
        "style",
        "noscript",
        "iframe",
        "link"
      ]);
    }
  }

  // tools/importer/import-techdocs-release-notes.js
  var PAGE_TEMPLATE = {
    name: "techdocs-release-notes",
    description: "Broadcom TechDocs documentation article (Tanzu Hub release notes): article title + markdown body, all default content",
    urls: [
      "https://techdocs.broadcom.com/us/en/vmware-tanzu/platform/tanzu-hub/10-4/tnz-hub/release-notes.html"
    ],
    blocks: [],
    sections: [
      {
        id: "article-title",
        name: "Article Title",
        selector: ["div.main-mid .main-mid-top"],
        style: null,
        blocks: [],
        defaultContent: ["div.main-mid .main-mid-top"]
      },
      {
        id: "article-body",
        name: "Article Body",
        selector: ["div.main-mid .main-content .markdown"],
        style: null,
        blocks: [],
        defaultContent: ["div.main-mid .main-content .markdown"]
      }
    ]
  };
  var transformers = [
    transform
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  var import_techdocs_release_notes_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "")
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: []
        }
      }];
    }
  };
  return __toCommonJS(import_techdocs_release_notes_exports);
})();
