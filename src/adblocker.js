/* eslint-env browser, es2021 */
/** @typedef {{selector: string[]; func: ((elem: HTMLElement) => boolean?)[];}} IgnoreFiltersT */
/** @typedef {{selector: string | null; func: (elem: Element) => any}} FuncFilterT */
/** @typedef {{cls?: string[], selector?: string[], func?: FuncFilterT[], ignore?: IgnoreFiltersT}} FiltersT */

function blockInDocumentWithFilters(
  /** @type {Document} */ document,
  /**@type {IgnoreFiltersT}*/ what,
) {
  function isContainerElem(
    /** @type {HTMLElement} */ elem,
  ) /** @type {boolean} */ {
    // .tagName returns UPPERCASE for some reason
    return ['DIV', 'SPAN'].includes(elem.tagName);
  }

  function shouldIgnore(elem) {
    for (let s of what.ignore?.selector ?? []) {
      if (elem.matches(s)) {
        return true;
      }
    }
    for (let f of what.ignore?.func ?? []) {
      if (f(elem)) {
        return true;
      }
    }
    return false;
  }

  var rm = {
    elem(/** @type {HTMLElement} */ elem) {
      if (!shouldIgnore(elem)) {
        removedElems.add([elem, elem.parentElement]);
        // Anti-adblock stuff might overwrite their own prototype
        // This isn't perfect by any means but it's good enough.
        HTMLElement.prototype.remove.call(elem);
      }
    },
    list(/** @type {HTMLElement[]} */ elems) {
      Array.from(elems).forEach((v) => rm.elem(v));
    },
    cls(/**@type {string} */ name) {
      rm.list(document.getElementsByClassName(name));
    },
    selector(/** @type {string} */ selector) {
      rm.list(document.querySelectorAll(selector));
    },
    func({ func, selector = null }) {
      let elems =
        selector == null
          ? document.getElementsByClassName('*')
          : document.querySelectorAll(selector);
      for (let elem of elems) {
        if (func(elem)) {
          rm.elem(elem);
        }
      }
    },
  };
  var /** @type {Set<[HTMLElement, HTMLElement]>} */ removedElems = new Set();
  var handledElems /** @type {Set<HTMLElement>} */ = new Set();
  for (let [name, args] of Object.entries(what)) {
    // don't try to use the 'ignore' property as a thing to block
    if (name != 'ignore') {
      for (let arg of args) {
        rm[name](arg);
      }
    }
    // Now of the remaining elements, find all the no-source iframes
    for(let elem of document.querySelectorAll('iframe')) {
      if(elem.src || !elem.contentDocument) continue;
      // TODO: detect if entire iframe is an ad
      // TODO: observers for inner iframes as well
      blockInDocument(elem.contentDocument);
    }
  }
  for (let [elem, parent] of removedElems) {
    if (handledElems.has(elem)) {
      continue; // already handled
    }
    handledElems.add(elem);
    if (!parent.isConnected) {
      // (indirect) parent has been deleted so don't do anything here,
      // instead go from the parent (which will also be in the Set)
      continue;
    }
    if (!isContainerElem(parent)) {
      continue; // parent might be an image or similar so don't delete
    }
    if (parent.hasChildNodes()) {
      continue; // don't delete parent - info of other children would be lost
    }
    // no children, no info in self, so safe to delete
    // NOTE: This will add `parent` to the end of removedElems (if not ignored) so will check again from the parent
    rm.elem(parent);
  }
  // Now of the remaining elements, find all the no-source iframes
  for(let elem of document.querySelectorAll('iframe')) {
    if(elem.src || !elem.contentDocument) continue;
    // TODO: detect if entire iframe is an ad
    // TODO: observers for inner iframes as well
    blockInDocument(elem.contentDocument);
  }
}
function blockInDocument(/**@type {Document}*/ document) {
  let filters = {
    cls: [
      'adsbygoogle',
      'mod_ad_container',
      'brn-ads-box',
      'gpt-ad',
      'ad-box',
      'top-ads-container',
      'adthrive-ad',
    ],
    selector: [
      '[aria-label="advertisement"]',
      '[class*="-ad "],[class*="-ad-"],[class$="-ad"],[class^="ad-"],[class^="adthrive"]',
      ':is(div,iframe)[id^="google_ads_iframe_"]',
      '#aipPrerollContainer',
      // This should really select the top one but we let the 'only contains ads' functionality handle it.
      // Yes I know its lazy, but it is more elegant than writing a whole new func filter (and more performant)
      'span[data-ez-ph-id] span[data-ez-ph-owner-id] span.ezoicwhat',
      // Malfunctioning overambitious adblocker-wall on Cite This For Me
      'div#_60cc9a6b-496d-4e44-90d8-0b2947bfd3ce',
      // hopefully not too overambitious (vm-placement is quite generic but 'placement' is used so often just for ads so it's fine)
      '.vm-placement + :has(iframe):not(:has(* + *)) iframe',
      // Dumbing of Age comic thing (error-prone, may need to change for later website versions)
      'iframe#p_AIW8hnK, iframe#p_AIW8hnK, iframe#p_Xdy8q6J',
    ],
    /** @type {{selector: string?, func: (elem: Element) => any}[]} */
    func: [
      {
        selector: '[class*="ad" i],[id*="ad" i]',
        /** This is the one that gets most of them, rest is just special cases */
        func(elem) {
          for (const name of [
            elem.id,
            ...elem.classList,
            elem.tagName.toLowerCase(),
          ]) {
            // TODO also check lowercase followed by uppercase at end e.g. adBox
            if (
              /(?<!lo|re|he)(ad|Ad|AD)(vert(isement)?)?s?[xX]?([tT]hrive)?([cC]ontent)?([eE]ngine|[nN]gin)?([cC]ontainer)?s?($|[-_,\s])/.test(
                name,
              )
            ) {
              return true;
            }
          }
        },
      },
      {
        selector: 'div#preroll',
        func(elem) {
          // match div#preroll that has child div#aipBranding
          for (let c of elem.children) {
            if (c.matches('div#aipBranding')) {
              return true;
            }
          }
        },
      },
      {
        selector: 'html > iframe',
        func(/** @type {HTMLIFrameElement} */ elem) {
          // Some sanity checks not to accidenally break websites
          if (
            !(
              elem.sandbox.contains('allow-scripts') &&
              elem.sandbox.contains('allow-same-origin') &&
              elem.sandbox.length == 2
            )
          ) {
            return false;
          }
          if (!elem.src.toLowerCase().includes('gdpr')) {
            // Ad iframes very often include a `?gdpr=...` in the URL
            return false;
          }
          return true;
        },
      },
      {
        selector:
          ':is(iframe[name="__tcfapiLocator"], iframe[name="__pb_locator__"]) ~ :is(span, div):has(iframe):not(:has(* + *))',
        func(el) {
          if (!el.src) return true; // exterminate  (usually ad)
        },
      },
    ],
    ignore: {
      selector: [
        'body',
        '.ad-layout',
        '#game-holder.game-holder-with-ad',
        '.no-interstitial-ads',
      ],
      func: [
        (elem) => {
          let articles = document.getElementsByTagName('article');
          for (let a of articles) {
            if (elem.contains(a)) {
              return true; // ignore if an article descends from it
            }
          }
        },
      ],
    },
  };
  return blockInDocumentWithFilters(document, filters);
}

var lastRun = -1e9;
function block() {
  // run every 100ms at most, but clamp other side to prevent timezone weirdness
  // TODO: what if new mutation while still this period but not caused by use?!
  if (lastRun < Date.now() && Date.now() < lastRun + 100) return;
  lastRun = Date.now();
  blockInDocument(/*global*/document);
}
// TODO: smarter logic would be good here to only check elements modified. But that would require
//  a complete re-architecture of the code so may be undesirable
new MutationObserver(block).observe(document.body, {
  attributes: true,
  childList: true,
  subtree: true,
});
block();
