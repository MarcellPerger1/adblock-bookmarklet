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
  var rm = {
    elem(elem) {
      if(!shouldIgnore(elem)) {
        elem.remove()
      }
    },
    list(elems) {
      Array.from(elems).forEach(v => rm.elem(v))
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
          rm.elem(elem);
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
  selector: ['[aria-label="advertisement"]', '[class*="-ad "], [class*="-ad-"], [class$="-ad"], [class^="ad-"]', ':is(div,iframe)[id^="google_ads_iframe_"]'],
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
  ignore: {
    selector: ["body", ".ad-layout"],
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
