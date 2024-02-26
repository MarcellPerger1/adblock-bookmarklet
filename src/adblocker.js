/* eslint-env browser, es2021 */
(function(what) {
  function shouldIgnore(elem) {
    for(let s of what.ignore?.selector ?? []) {
      if(elem.matches(s)) { return true; }
    }
    for(let f of what.ignore?.func ?? []) {
      if(f(elem)) { return true; }
    }
    return false;
  }
  function isContainerElem(/** @type {HTMLElement} */elem) /** @type {boolean} */ {
    // .tagName returns UPPERCASE for some reason
    return ["DIV", "SPAN"].includes(elem.tagName);
  }
  var rm = {
    elem(/** @type {HTMLElement} */elem) {
      if(!shouldIgnore(elem)) {
        elem.remove()
        removedElems.add(elem);
      }
    },
    list(/** @type {HTMLElement[]} */elems) {
      Array.from(elems).forEach(v => rm.elem(v))
    },
    cls(/**@type {string} */name) {
      rm.list(document.getElementsByClassName(name))
    },
    selector(/** @type {string} */selector) {
      rm.list(document.querySelectorAll(selector))
    },
    func({func, selector=null}) {
      let elems = selector == null 
        ? document.getElementsByClassName("*") 
        : document.querySelectorAll(selector);
      for (let elem of elems) {
        if (func(elem)) {
          rm.elem(elem);
        }
      }
    }
  };
  var /** @type {Set<HTMLElement>} */ removedElems  = new Set;
  var handledElems /** @type {Set<HTMLElement>} */ = new Set;
  for (let [name, args] of Object.entries(what)) {
    // don't try to use the 'ignore' property as a thing to block
    if(name != 'ignore') {
      for (let arg of args) {
        rm[name](arg);
      }
    }
  }
  for(let elem of removedElems) {
    if(handledElems.has(elem)) {
      continue;  // already handled
    }
    handledElems.add(elem);
    let parent = elem.parentElement;
    if(!parent.isConnected) {
      // (indirect) parent has been deleted so don't do anything here, 
      // instead go from the parent (which will also be in the Set)
      continue;
    }
    if(!isContainerElem(parent)) {
      continue;  // parent might be an image or similar so don't delete
    }
    if(parent.hasChildNodes()) {
      continue;  // don't delete parent - info of other children would be lost
    }
    // no children, no info in self, so safe to delete
    // NOTE: This will add `parent` to the end of removedElems (if not ignored) so will check again from the parent
    rm.elem(parent);
  }
})({
  cls: ['adsbygoogle', 'mod_ad_container', 'brn-ads-box','gpt-ad','ad-box','top-ads-container', 'adthrive-ad'],
  selector: ['[aria-label="advertisement"]', '[class*="-ad "], [class*="-ad-"], [class$="-ad"], [class^="ad-"], [class^="adthrive"]', ':is(div,iframe)[id^="google_ads_iframe_"]', '#aipPrerollContainer'],
  /** @type {{selector: string?, func: (elem: Element) => any}[]} */
  func: [
    {
      selector: '[class*="ad"],[id*="ad"]', 
      func(elem) {
        for (const name of [elem.id, ...elem.classList]) {
          // TODO also check lowercase followed by uppercase at end e.g. adBox
          if(/(?<!lo|re|he)ad(vertisement)?s?(thrive)?(content)?(engine|ngin)?(container)?s?($|[-_,\s])/.test(name)) {
            return true;
          }
        }
      }
    },
    {
      selector: 'div#preroll',
      func(elem) {
        // match div#preroll that has child div#aipBranding
        for (let c of elem.children) {
          if(c.matches("div#aipBranding")) {
            return true;
          }
        }
      }
    },
  ],
  ignore: {
    selector: ["body", ".ad-layout", "#game-holder.game-holder-with-ad"],
    func: [(elem) => {
      let articles = document.getElementsByTagName('article');
      for(let a of articles) {
        if(elem.contains(a)) {
          return true;  // ignore if an article descends from it
        }
      }
    }]
  }
})
