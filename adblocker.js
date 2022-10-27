(function(what) {
  var rm = {
    list(elems) {
      Array.from(elems).forEach(v => v.remove())
    },
    cls(name) {
      rm.list(document.getElementsByClassName(name))
    },
    selector(selector) {
      rm.list(document.querySelectorAll(selector))
    },
    func({func, selector=null}) {
      let elems = selector == null 
        ? document.getElementsByClassName("*") 
        : document.querySelectorAll(selector);
      for (let elem of elems) {
        if (func(elem)) {
          elem.remove();
        }
      }
    }
  };

  for (let name in what) {
    let args = what[name];
    for (let i = 0; i < args.length; i++) {
      let arg = args[i];
      rm[name](arg);
    }
  }
})({
  cls: ['adsbygoogle', 'mod_ad_container', 'brn-ads-box','gpt-ad','ad-box','top-ads-container', 'adthrive-ad'],
  selector: ['[aria-label="advertisement"]', '[class*="-ad "], [class*="-ad-"], [class$="-ad"], [class^="ad-"]'],
  /** @type {{selector: string?, func: (elem: Element) => any}[]} */
  func: [
    {
      selector: '[class*="ad"]', 
      func(elem) {
        for (const clsname of elem.classList) {
          if (clsname.startsWith("ad") || /[-_\s]ad(?:vertisement)?$/.test(clsname)) {
            return true;
          }
        }
      }
    }
  ],
})
