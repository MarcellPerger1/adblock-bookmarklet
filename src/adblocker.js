import getBlocklist from "./blocklist.js";
/** @typedef {import('./blocklist.js').FiltersT} FiltersT */

/** @type {Map<Document, {observer: MutationObserver, lastRun: number}>} */
var documentRegistry = new Map;

function blockInDocumentWithFilters(
  /** @type {Document} */ document,
  /**@type {FiltersT}*/ what,
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
    list(/** @type {Iterable<HTMLElement>} */ elems) {
      Array.from(elems).forEach((v) => rm.elem(v));
    },
    cls(/**@type {string} */ name) {
      rm.list(document.getElementsByClassName(name));
    },
    selector(/** @type {string} */ selector) {
      rm.list(document.querySelectorAll(selector));
    },
    func({ func, selector = null }) {
      for (let elem of document.querySelectorAll(selector ?? "*")) {
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
    blockInDocument(elem.contentDocument);  // Also, registers it
    // TODO: detect if entire iframe is an ad
  }
}
function initObserver(/**@type {Document}*/ document) {
  return new MutationObserver((ms, o) => observerCallback(document, ms, o)).observe(document, {
    attributes: true,
    childList: true,
    subtree: true,
    attributeOldValue: true
  });
}

/** @returns {n is HTMLIFrameElement} */
function is_iframe(/**@type {Node}*/n) {
  return n.nodeName == "IFRAME";
}

/** @returns {n is HTMLIFrameElement & {contentDocument: Document}} */
function is_transparent_iframe(/**@type {Node}*/n) {
  return is_iframe(n) && n.contentDocument;
}

function observerCallback(/**@type {Document}*/document, /**@type {MutationRecord[]}*/mutations, /**@type {MutationObserver}*/_observer) {
  for(let m of mutations) {
    for(let n of m.removedNodes) {
      if(is_transparent_iframe(n)) {
        deregisterDocument(n.contentDocument)
      }
    }
    for(let n of m.addedNodes) {
      if(is_transparent_iframe(n)) {
        let subdoc = n.contentDocument;
        if(registerNewDocument(subdoc) && subdoc.hasChildNodes()) 
          blockInDocument(subdoc);
      }
    }
    if(m.type == 'attributes' && is_iframe(m.target) && !m.target.contentDocument) {
      deregisterDocument(m.target.contentDocument);
    }
  }
  blockInDocument(document);
}

function deregisterDocument(/**@type {Document}*/ document) {
  documentRegistry.get(document)?.observer?.disconnect?.();
  documentRegistry.delete(document);
}

const MIN_INTERVAL = 100;  // milliseconds

function registerNewDocument(/**@type {Document}*/ document) {
  if(!documentRegistry.has(document)) {
    documentRegistry.set(document, {
      observer: initObserver(document),
      lastRun: 0
    });
    return true;
  }
  return false;
}

function blockInDocument(/**@type {Document}*/ document) {
  registerNewDocument(document);
  let lastRun = documentRegistry.get(document).lastRun;
  // (if lastRun is not in past, we run it so we don't get stuck after time zone changes?)
  if(lastRun && lastRun < Date.now() && Date.now() < lastRun + MIN_INTERVAL) return;
  documentRegistry.get(document).lastRun = Date.now();
  return blockInDocumentWithFilters(document, getBlocklist(document));
}

blockInDocument(/*global*/document);

// TODO: occasionally loop over all documents and reblock all
