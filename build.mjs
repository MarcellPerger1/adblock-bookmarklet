import { minify } from "terser";
import { readFile, writeFile } from "fs/promises";

var code = (await readFile("./adblocker.js")).toString();
var options = {
  mangle: false
};
var result = await minify(code, options);
var minified = result.code;
await writeFile("./adblocker.min.js", minified);
if(minified.includes("\n")) {
  throw new Error("Minified file conatins newlines so cannot be put into a bookmark");
} else {
  await writeFile("./bookmarklet.min.txt", "javascript:" + minified)
}
