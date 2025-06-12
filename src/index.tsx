#!/usr/bin/env node
import React from 'react';
import { render } from 'ink';
import { App } from './components/App.js';

// Check if raw mode is supported before rendering
// This prevents the error when running in environments that don't support raw mode
const isRawModeSupported = process.stdin.isTTY && process.stdin.setRawMode;

if (!isRawModeSupported) {
  console.error('⚠️  This tool requires an interactive terminal environment.');
  console.error('   If using pipes or redirects, please run directly.');
  process.exit(1);
}

render(<App />);