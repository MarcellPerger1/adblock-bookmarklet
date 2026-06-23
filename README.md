# adblock-bookmarklet
A bookmarklet to remove ads.
Because I don't like ads and you shouldn't need an extension to block ads.

- :rocket: Works on all modren web browsers, including on your phone
- :zap: Free, fast, and open-source
- :no_entry_sign: Blocks ads without the need for extensions

## How to use
If you are familiar with how to use bookmarklets, all you need to know is that the bookmarklet is here: [`dist/release/bookmarklet.min.txt`](dist/release/bookmarklet.min.txt).

If not, no worries, here's some basic instructions for desktop browsers:

- Copy text from [`dist/release/bookmarklet.min.txt`](dist/release/bookmarklet.min.txt)
- Set as bookmark and click on the bookmark to remove ads
- Or paste text into URL bar (but make sure it starts with `javascript:`)

For mobile browsers, it is a little more complicated due to the lack of bookmarks bar:
- Copy text from [`dist/release/bookmarklet.min.txt`](dist/release/bookmarklet.min.txt)
- Save it as a new bookmark
  - If your browser doesn't have a 'new bookmark' button, just bookmark the current page and then edit the URL to be the copied text
  - Also edit the name so you actually recognise it
- When you want to block ads, start typing into the address bar: `javascript:` and then it should show up as one of the suggestions (with the name that you've given it)
- Alternatively, if you don't want to save it as a bookmark, paste the text into the URL bar
- But before pressing enter or submit, make sure that it starts with `javascript:` as chrome mobile and some other browsers like removing that bit


## Reporting bugs
- If it doesn't block some ads, or removes legitimate content, please [open an issue](https://github.com/MarcellPerger1/adblock-bookmarklet/issues/new)
- In the issue, please include a URL of the website where it doesn't work (otherwise I won't be able to fix it)
- Ideally, also include a screenshot with the ads circled or similar - sometimes, ads take while to load in so this way when testing I know where the ads are going to appear when they finally decide to load 
- Also, please check if it's a duplicate of an open issue (if it is, just give that issue a +1/thumbs up/similar if you are also experiencing it)
