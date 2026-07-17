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

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-banner.js
  function parse(element, { document }) {
    const bgImage = element.querySelector("picture img.banner-image, img.banner-image, picture img, img");
    const heading = element.querySelector("h1.featurette-heading, .teaser h1, h1, h2");
    const description = element.querySelector(".teaser-description .rte p, .teaser-description p, .teaser p");
    const ctaLinks = Array.from(element.querySelectorAll(".banner-cta-links a, .banner-cta a, a.lnk"));
    if (!bgImage && !heading && !description && ctaLinks.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (bgImage) {
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      imageCell.appendChild(bgImage);
      cells.push([imageCell]);
    } else {
      cells.push([""]);
    }
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(" field:text "));
    if (heading) textCell.appendChild(heading);
    if (description) textCell.appendChild(description);
    ctaLinks.forEach((a) => {
      const p = document.createElement("p");
      p.appendChild(a);
      textCell.appendChild(p);
    });
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-banner", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-solutions.js
  function parse2(element, { document }) {
    const items = Array.from(element.querySelectorAll(":scope > .solution-item, .solution-item"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const link = item.querySelector("a.lnk, a");
      const href = link ? link.getAttribute("href") : null;
      const icon = item.querySelector(".solution-icon img.solution-icon-default, .solution-icon img.image-source, .solution-icon img, img");
      const title = item.querySelector(".solution-item-title, h4, h3, h2");
      const description = item.querySelector(".solution-item-description .rte p, .solution-item-description p, .solution-item-description");
      const imageCell = document.createDocumentFragment();
      if (icon) {
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(icon);
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      if (title) {
        if (href) {
          const a = document.createElement("a");
          a.setAttribute("href", href);
          const heading = document.createElement("h3");
          heading.textContent = title.textContent.trim();
          a.appendChild(heading);
          textCell.appendChild(a);
        } else {
          const heading = document.createElement("h3");
          heading.textContent = title.textContent.trim();
          textCell.appendChild(heading);
        }
      }
      if (description) {
        const p = document.createElement("p");
        p.textContent = description.textContent.trim();
        textCell.appendChild(p);
      }
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-solutions", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-links.js
  function parse3(element, { document }) {
    const items = Array.from(element.querySelectorAll(":scope > .popular-link-wrapper, .popular-link-wrapper"));
    if (items.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    items.forEach((item) => {
      const link = item.querySelector("a.popular-link, a.lnk, a");
      if (!link) return;
      const imageCell = "";
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      textCell.appendChild(link);
      cells.push([imageCell, textCell]);
    });
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-links", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-feeds.js
  function parse4(element, { document }) {
    const columns = Array.from(element.querySelectorAll(":scope > .content-block, .content-block"));
    if (columns.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = columns.map((column) => {
      const cell = [];
      const heading = column.querySelector("h2, h3");
      if (heading) cell.push(heading);
      const listItems = Array.from(column.querySelectorAll("ul > li"));
      if (listItems.length > 0) {
        const ul = document.createElement("ul");
        listItems.forEach((li) => {
          const newLi = document.createElement("li");
          const date = li.querySelector(".date");
          const link = li.querySelector("a.lnk, a");
          const description = li.querySelector(".product-description");
          if (date && date.textContent.trim()) {
            const dateEl = document.createElement("p");
            dateEl.textContent = date.textContent.trim();
            newLi.appendChild(dateEl);
          }
          if (link) {
            const a = document.createElement("a");
            a.setAttribute("href", link.getAttribute("href"));
            a.textContent = link.textContent.trim();
            newLi.appendChild(a);
          }
          if (description && description.textContent.trim()) {
            const descEl = document.createElement("p");
            descEl.textContent = description.textContent.trim();
            newLi.appendChild(descEl);
          }
          ul.appendChild(newLi);
        });
        cell.push(ul);
      }
      const footerLink = column.querySelector(".feed-footer a[href], .show-more-footer a[href]");
      if (footerLink) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", footerLink.getAttribute("href"));
        a.textContent = footerLink.textContent.trim();
        p.appendChild(a);
        cell.push(p);
      }
      return cell;
    });
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-feeds", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-media.js
  function parse5(element, { document }) {
    const cols = Array.from(element.querySelectorAll(':scope .row > [class*="col-"], .row > [class*="col-"]'));
    const leftCol = cols.find((c) => c.querySelector(".rte, .card-text")) || element.querySelector(".col-lg-7, .col-12.col-lg-7");
    const leftCell = [];
    if (leftCol) {
      const paragraphs = Array.from(leftCol.querySelectorAll(".rte p, .card-text p"));
      paragraphs.forEach((p) => {
        const np = document.createElement("p");
        np.textContent = p.textContent.trim();
        leftCell.push(np);
      });
      const cta = leftCol.querySelector(".cb-cta-link a, .card-footer a, a.card-link");
      if (cta) {
        const p = document.createElement("p");
        const a = document.createElement("a");
        a.setAttribute("href", cta.getAttribute("href"));
        a.textContent = cta.textContent.trim();
        p.appendChild(a);
        leftCell.push(p);
      }
    }
    const rightCol = cols.find((c) => c.querySelector(".video-wrapper, .brightcove-wrapper, video-js, .vjs-poster")) || element.querySelector(".col-lg-5, .col-12.col-lg-5");
    const rightCell = [];
    if (rightCol) {
      const playBtn = rightCol.querySelector('.vjs-big-play-button, [title*="Play Video"]');
      const rawTitle = (playBtn && (playBtn.getAttribute("title") || playBtn.textContent) || "").trim();
      const videoTitle = rawTitle.replace(/^Play Video\s*/i, "").trim();
      const poster = rightCol.querySelector(".vjs-poster picture img, .vjs-poster img, .video-wrapper picture img, .video-wrapper img");
      if (poster) {
        const img = document.createElement("img");
        img.setAttribute("src", poster.getAttribute("src"));
        img.setAttribute("alt", poster.getAttribute("alt") || videoTitle || "");
        rightCell.push(img);
      }
      if (videoTitle) {
        const h = document.createElement("h3");
        h.textContent = videoTitle;
        rightCell.push(h);
      }
    }
    if (leftCell.length === 0 && rightCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[leftCell, rightCell]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-media", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/broadcom-cleanup.js
  function transform(hookName, element, payload) {
    if (hookName === "beforeTransform") {
      WebImporter.DOMUtils.remove(element, [
        "#onetrust-consent-sdk"
      ]);
    }
    if (hookName === "afterTransform") {
      WebImporter.DOMUtils.remove(element, [
        "#header",
        "#footer",
        ".scrollto-top-container",
        "a.scrollto-top",
        "iframe",
        "noscript",
        "script",
        "style",
        "link"
      ]);
    }
  }

  // tools/importer/transformers/broadcom-sections.js
  function findSectionElement(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const selector of list) {
      if (!selector) continue;
      const el = root.querySelector(selector);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    if (hookName === "afterTransform") {
      const sections = payload && payload.template && payload.template.sections;
      if (!Array.isArray(sections) || sections.length < 2) return;
      const doc = payload && payload.document || element.ownerDocument;
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        const sectionEl = findSectionElement(element, section && section.selector);
        if (!sectionEl) continue;
        if (section.style) {
          const metadataBlock = WebImporter.Blocks.createBlock(doc, {
            name: "Section Metadata",
            cells: { style: section.style }
          });
          if (sectionEl.parentNode) {
            sectionEl.parentNode.insertBefore(metadataBlock, sectionEl.nextSibling);
          }
        }
        if (i > 0 && sectionEl.parentNode) {
          const hr = doc.createElement("hr");
          sectionEl.parentNode.insertBefore(hr, sectionEl);
        }
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-banner": parse,
    "cards-solutions": parse2,
    "cards-links": parse3,
    "columns-feeds": parse4,
    "columns-media": parse5
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Broadcom corporate homepage with hero banner, promo pencil bar, solutions grid, popular links, news/blogs/products feeds, and about-us section",
    urls: [
      "https://www.broadcom.com/"
    ],
    blocks: [
      {
        name: "hero-banner",
        instances: ["#content > div.Home_V2 > div.top-banner", ".top-banner"]
      },
      {
        name: "cards-solutions",
        instances: [".solutions-list"]
      },
      {
        name: "cards-links",
        instances: [".popular-link-list"]
      },
      {
        name: "columns-feeds",
        instances: [".feeds-content"]
      },
      {
        name: "columns-media",
        instances: [".ContentCardTwoColumn"]
      }
    ],
    sections: [
      {
        id: "top-banner",
        name: "Hero Banner",
        selector: ["#content > div.Home_V2 > div.top-banner", ".top-banner"],
        style: null,
        blocks: ["hero-banner"],
        defaultContent: []
      },
      {
        id: "pencil-promo-section",
        name: "Promo Bar",
        selector: [".pencil-promo-section"],
        style: "promo",
        blocks: [],
        defaultContent: [".pencil-promo-section"]
      },
      {
        id: "solutions-section",
        name: "Solutions Grid",
        selector: [".solutions-section"],
        style: null,
        blocks: ["cards-solutions"],
        defaultContent: [".solutions-title"]
      },
      {
        id: "popular-links-section",
        name: "Popular Links",
        selector: [".popular-links-section"],
        style: "dark",
        blocks: ["cards-links"],
        defaultContent: []
      },
      {
        id: "feeds-section",
        name: "Feeds",
        selector: [".feeds-section"],
        style: null,
        blocks: ["columns-feeds"],
        defaultContent: []
      },
      {
        id: "about-us-section",
        name: "About Us",
        selector: [".ContentCardTwoColumn-section", "#content > div.Home_V2 > div.main-body > div.section-container > div.section"],
        style: null,
        blocks: ["columns-media"],
        defaultContent: [".section-title"]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
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
  function findBlocksOnPage(document, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode) return;
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const path = WebImporter.FileUtils.sanitizePath(
        new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html$/, "") || "/index"
      );
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
