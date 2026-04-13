#!/usr/bin/env node

const { program } = require('commander');
const setup = require('./commands/setup');
const status = require('./commands/status');
const path = require('path');
const fs = require('fs');

program
  .name('ghostpath')
  .description('Auto-fill current VS Code active file path in your terminal')
  .version('1.0.0');

program
  .command('setup')
  .description('Install shell integration for Zsh and/or PowerShell')
  .option('--silent', 'Run without prompts (used during npm install)')
  .option('--zsh', 'Setup Zsh only')
  .option('--pwsh', 'Setup PowerShell only')
  .action(setup);

program
  .command('status')
  .description('Show current active file path written by VS Code extension')
  .action(status);

program
  .command('current')
  .description('Print the current active file path (used internally by shell)')
  .action(() => {
    const tmpFile = process.platform === 'win32'
      ? path.join(process.env.TEMP || 'C:\\Temp', '_ghostpath_active_file')
      : '/tmp/_ghostpath_active_file';

    if (fs.existsSync(tmpFile)) {
      const filePath = fs.readFileSync(tmpFile, 'utf8').trim();
      process.stdout.write(filePath);
    } else {
      process.stdout.write('');
    }
  });

program.parse(process.argv);
