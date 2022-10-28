import { minify } from "terser";
import { readFile, writeFile } from "fs/promises";


var orig = (await readFile("./adblocker.js")).toString();

async function minifyToText(options, strict=false) {
  var result = await minify(orig, {...options});
  var minified = result.code;
  if (strict && minified.includes("\n")) {
    throw new Error("Minified file contains newlines so cannot be put into a bookmark");
  }
  return minified;
}
async function minifyToFile(file, options, strict=false, writeText=false) {
  var code = await minifyToText(options, strict);
  await writeFile(file, code);
  if(writeText) {
    let textFile = file.replaceAll(
      /adblocker\.([^\.\/]+)\.js/g, "bookmarklet.$1.txt")
    let text = "javascript:" + code;
    await writeFile(textFile, text);
  }
}

await minifyToFile("./adblocker.compressed.js", {
  ecma: 2021, mangle: false, compress: {defaults: false}
}, false, true);
await minifyToFile("./adblocker.min.js", {
  ecma: 2021, compress: {passes: 3}
}, true, true);
