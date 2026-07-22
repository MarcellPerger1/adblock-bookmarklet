/** @typedef {{selector: string[]; func: ((elem: HTMLElement) => boolean?)[];}} IgnoreFiltersT */
/** @typedef {{selector: string | null; func: (elem: Element) => any}} FuncFilterT */
/** @typedef {{cls?: string[], selector?: string[], func?: FuncFilterT[], ignore?: IgnoreFiltersT}} FiltersT */

export default function getBlocklist(/**@type {Document}*/document) /** @type {FiltersT} */ {
  let MAIN_AD_RE = /(?<!lo|re|he)(ad|Ad|AD)(vert(isement)?)?s?[xX]?([tT]hrive)?([cC]ontent)?([cC]lick)([eE]ngine|[nN]gin)?([cC]ontainer)?s?($|[-_,\s])/g;
  function getKarma(/**@type {string}*/uri) {
    /** @type {{regex: RegExp, value?: number, max?: number}[]} */
    let badRegexes = [
      {regex: /((\b|[0-9_])[pP]|[a-z]P)rebid/g},
      {regex: /(?<!lo|re|he)ad[_-]?[Ll]ocation/g},
      {regex: /(?<!lo|re|he)ad[-_]?[uU]nit/g},
      {regex: /(^|[a-z](?=[A-Z])|[0-9_]|\b)([gG]dpr|GDPR)/},
      {regex: MAIN_AD_RE, value: 0.1},
      {regex: /api\.taboola\.com\//, value: 10},  // dead
      {regex: /doubleclick\.net\//, value: 10},  /// yet another google ads thing
      {regex: /\badclick(\b|[-_])/},
    ];
    let karma = 0;
    for(let {regex, value=1, max=Number.MAX_VALUE} of badRegexes) {
      // clamp to 0..=max
      karma -= Math.min(max, (uri.match(regex) || []).length * value);
    }
    return karma;
  }
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
        selector: '[class*="ad" i],[id*="ad" i],[alt*="ad" i]',
        /** This is the one that gets most of them, rest is just special cases */
        func(elem) {
          for (const name of [
            elem.id,
            ...elem.classList,
            elem.tagName.toLowerCase(),
            /**@type {HTMLImageElement | {alt: undefined}}*/(elem).alt ?? ""
          ]) {
            // TODO also check lowercase followed by uppercase at end e.g. adBox
            if (MAIN_AD_RE.test(name)) {
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
        selector: 'iframe',
        func(/** @type {HTMLIFrameElement} */ elem) {
          // Some sanity checks not to accidentally break websites
          if (!elem.sandbox.contains('allow-scripts')) return;
          if(!elem.src) return;  // cannot do anything
          if(getKarma(elem.src) <= -1.2) return true;  // begone foul ad
          return;
        },
      },
      {
        selector: 'a[href]:has(img)',
        func(/** @type {HTMLIFrameElement} */ elem) {
          if(getKarma(elem.href) <= -2.5) return true;  // higher threshold
          return;
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
