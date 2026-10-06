#!/usr/bin/env node

/**
 * Root entrypoint for design tokens to CSS converter.
 * Usage:
 *   node convert-tokens-to-css.js [inputPath] [outputPath]
 */

const { buildCss } = require('./scripts/convert-tokens-to-css.js');

const args = process.argv.slice(2);
const isWatch = args.includes('--watch') || args.includes('-w');
const cleanArgs = args.filter(a => a !== '--watch' && a !== '-w');

const inputPath = cleanArgs[0] || 'tokens.json';
const outputPath = cleanArgs[1] || 'tokens.css';

buildCss(inputPath, outputPath);

if (isWatch) {
  const fs = require('fs');
  const path = require('path');
  const resolvedInput = path.resolve(process.cwd(), inputPath);
  console.log(`[Tokens->CSS] Watching for changes in ${resolvedInput}...`);
  fs.watchFile(resolvedInput, { interval: 500 }, () => {
    console.log(`[Tokens->CSS] Detected change in ${inputPath}, recompiling...`);
    buildCss(inputPath, outputPath);
  });
}
