/* eslint-env node, es2021 */
import { minify } from "terser";
import { readFile, writeFile } from "fs/promises";


async function writeResult(file, code) {
  console.log("Writing", file);
  return writeFile(file, code);
}


async function minifyToText(options, strict=false) {
  var result = await minify(orig, {...options});
  var minified = result.code;
  if (strict && minified.includes("\n")) {
    throw new Error("Minified file contains newlines so cannot be put into a bookmark");
  }
  return minified;
}
async function minifyToFile(file, options, strict=false, writeText=false) {
  console.log("Minifying", file);
  var code = await minifyToText(options, strict);
  var ps = [writeResult(file, code)];
  if(writeText) {
    let textFile = file.replaceAll(
      /adblocker\.([^./]+)\.js/g, "bookmarklet.$1.txt")
    let text = "javascript:" + code;
    ps.push(writeResult(textFile, text));
  }
  await Promise.all(ps);
}

console.log("Reading input");
var orig = (await readFile("./src/adblocker.js")).toString();
await Promise.all([
  minifyToFile("./dist/debug/adblocker.debug.js", {
    ecma: 2021, mangle: false, compress: false
    }, false, true),
  minifyToFile("./dist/release/adblocker.min.js", {
    ecma: 2021, compress: {passes: 3, expression: false, negate_iife: false}, mangle: {toplevel: true}
    }, true, true),
])
