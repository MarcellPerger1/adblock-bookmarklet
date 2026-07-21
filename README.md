# adblock-bookmarklet
A bookmarklet to remove ads.
Because I don't like ads and you shouldn't need an extension to block ads.

- :rocket: Works on all modern web browsers, including on your phone
- :zap: Free, fast, and open-source
- :no_entry_sign: Blocks ads without the need for extensions

## How to use
If you are familiar with how to use bookmarklets, all you need to know is that the bookmarklet is here: [`dist/release/bookmarklet.min.txt`](dist/release/bookmarklet.min.txt).

If not, no worries, here's some basic instructions for desktop browsers:

- Copy text from [`dist/release/bookmarklet.min.txt`](dist/release/bookmarklet.min.txt)
- Set as bookmark (paste the stuff you copied into the "URL" bit) and click on the bookmark to remove ads
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

## Contributing
First of all, thanks for looking to contribute to this project, your time is much appreciated!

### Project structure
This project is split into 3 main parts:
- The build script (`tools/build.ts`) - the script to build, minify, and output the code as a bookmarklet (you probably won't need to touch this most of the time)
- The core (`src/adblocker.js`) - processes filter lists, walks into iframes, blocks elements, watches for changes
- The filter lists (`src/blocklist.js`) - describes the HTML elements to block, exceptions to allow (modifying this will most of the time be sufficient to block an ad)

### Building
Requirements:
- Node.js (v22.18 or later)
- npm

Instructions:
- Run `npm install`
- Run `node tools/build.ts`

### Writing code
- I will not descirbe in detail the standard Github process of fork, clone, commit, push, pull request (there are good resources avaiable online)
- Code style/guidelines:
  - 2 indents, single quotes, be consisntent, use your common sense
  - If possible, try to avoid checking the domain name of the current website as this means that similarly implemented ads on different sites will not be blocked
  - Please do not modify any files unnecessarily (e.g. do not commit your `.idea` folder if you are working on this in one of the Jetbrains IDEs)
- Each PR should ideally link to the issue describing what needs to be fixed and the PR should be fixing that thing (you may need to create this issue *if it doesn't already exist*)
- Please ensure that you test the built code against at least one website for non-trivial changes
  - If you are fixing it not blocking ads on a website, obviously test it against that website
  - If you are making a more risky change or want to be extra cautious, you can test it against 2 websites
  - Changes that do not affect the generated bookmarklet output do not require tests (i.e. if no files change in `dist/release` after building)
- If you do not wish to commit the built bookmarklet or do not want to install nodejs to build it, the Github action will build and commit it for you
