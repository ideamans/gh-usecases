#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { App } from './components/App.js';
import { GEMINI_MODEL } from './services/gemini.js';

const args = process.argv.slice(2);
if (args.includes('--version') || args.includes('-v')) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const pkg = fs.readJsonSync(path.resolve(__dirname, '../package.json'));
  console.log(`gh-usecases v${pkg.version}`);
  console.log(`Gemini model: ${GEMINI_MODEL}`);
  process.exit(0);
}

// Check if raw mode is supported before rendering
// This prevents the error when running in environments that don't support raw mode
const isRawModeSupported = process.stdin.isTTY && process.stdin.setRawMode;

if (!isRawModeSupported) {
  console.error('⚠️  This tool requires an interactive terminal environment.');
  console.error('   If using pipes or redirects, please run directly.');
  process.exit(1);
}

render(<App />);