const fs = require('fs');
const path = require('path');
const os = require('os');

module.exports = function status() {
  const tmpFile = process.platform === 'win32'
    ? path.join(process.env.TEMP || 'C:\\Temp', '_ghostpath_active_file')
    : '/tmp/_ghostpath_active_file';

  console.log('');
  console.log('👻  Ghostpath Status');
  console.log('');

  if (!fs.existsSync(tmpFile)) {
    console.log('  ❌ No active file detected.');
    console.log('  Make sure:');
    console.log('    1. The VS Code extension is installed and active');
    console.log('    2. A file is open and focused in VS Code');
    console.log('');
    return;
  }

  const filePath = fs.readFileSync(tmpFile, 'utf8').trim();

  if (!filePath) {
    console.log('  ⚠️  Temp file exists but is empty.');
    console.log('  Open a file in VS Code to activate ghostpath.');
  } else {
    console.log(`  ✅ Active file: ${filePath}`);
    console.log(`  📄 Temp file:   ${tmpFile}`);
  }

  console.log('');
};
