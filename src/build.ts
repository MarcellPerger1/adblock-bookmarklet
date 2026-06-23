/* eslint-env node, es2021 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { rollup, type RollupBuild } from 'rollup';
import rollupPluginTerser, {
  type Options as TerserOptions,
} from '@rollup/plugin-terser';

const LICENSE = '@copyright (c) 2022-2026 Marcell Perger @license MIT';

async function writeResult(file: string, code: string) {
  console.log('Writing', file);
  return writeFile(file, code);
}

function getTxtPath(jsPath: string) {
  let { dir, base } = path.parse(jsPath);
  // rename, replace .js extension with (or add new extension if not js) .txt extension
  base = base
    .replace(/adblocker\b/, 'bookmarklet')
    .replace(/(\.m?[jt]s|)$/, '.txt');
  return path.format({ dir, base }).replace('\\', '/'); // Posix separators plz
}

async function generateWithConfig(
  bundle: RollupBuild,
  outfile: string,
  options: TerserOptions,
) {
  let { output } = await bundle.generate({
    format: 'es', // TODO es or iife?
    file: outfile,
    strict: false,
    plugins: [rollupPluginTerser(options)],
  });
  if (output.length != 1) {
    console.error('rollup is trying to generate multiple chunks', output);
    throw new Error('rollup is trying to generate multiple chunks, not good');
  }
  // .trim() is important to remove trailing newline
  return `/**${LICENSE}*/{${output[0].code.trim()}}`;
}

async function writeWithConfig(
  bundle: RollupBuild,
  outfile: string,
  options: TerserOptions,
  { strict = false, writeText = false } = {},
) {
  let code = await generateWithConfig(bundle, outfile, options);
  if (strict && code.includes('\n')) {
    throw new Error(
      'Minified file contains newlines so cannot be put into a bookmark',
    );
  }
  await Promise.all([
    writeResult(outfile, code),
    writeText ? writeResult(getTxtPath(outfile), 'javascript:' + code) : null,
  ]);
}

async function build() {
  let bundle;
  try {
    bundle = await rollup({
      input: './src/adblocker.js',
    });

    let results = await Promise.allSettled([
      writeWithConfig(
        bundle,
        './dist/debug/adblocker.debug.js',
        { ecma: 2021, compress: false, mangle: false },
        { strict: false, writeText: true },
      ),
      writeWithConfig(
        bundle,
        './dist/release/adblocker.min.js',
        {
          ecma: 2021,
          compress: {
            passes: 3,
            expression: false,
            negate_iife: false,
            unsafe: true,
            unsafe_arrows: true,
          },
          mangle: { toplevel: true },
        },
        { strict: true, writeText: true },
      ),
    ]);

    let rejects = results.filter((v) => v.status == 'rejected');
    if (rejects.length) {
      throw new Error('Failed to bookmark-ify Javascript', {
        cause: rejects.map(({ reason }) => reason),
      });
    }
  } finally {
    if (bundle) await bundle.close();
  }
}

await build();
