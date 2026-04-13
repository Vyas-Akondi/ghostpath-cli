#!/usr/bin/env node
/**
 * build-extension.js
 * Copies the extension source to the output folder.
 * Run: node build-extension.js
 * Then: vsce package  (to create .vsix)
 */

const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src', 'extension.js');
const out = path.join(__dirname, 'out');

if (!fs.existsSync(out)) {
  fs.mkdirSync(out, { recursive: true });
}

fs.copyFileSync(src, path.join(out, 'extension.js'));
console.log('Extension built → out/extension.js');
console.log('Run `vsce package` in vscode-extension/ to create .vsix');
