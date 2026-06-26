/** @typedef {{selector: string[]; func: ((elem: HTMLElement) => boolean?)[];}} IgnoreFiltersT */
/** @typedef {{selector: string | null; func: (elem: Element) => any}} FuncFilterT */
/** @typedef {{cls?: string[], selector?: string[], func?: FuncFilterT[], ignore?: IgnoreFiltersT}} FiltersT */

export default function getBlocklist(/**@type {Document}*/document) /** @type {FiltersT} */ {
  return {
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
          // Some sanity checks not to accidentally break websites
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
}
