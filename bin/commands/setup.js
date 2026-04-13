const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const ZSH_MARKER = '# >>> ghostpath shell integration >>>';
const ZSH_MARKER_END = '# <<< ghostpath shell integration <<<';

const PWSH_MARKER = '# >>> ghostpath shell integration >>>';
const PWSH_MARKER_END = '# <<< ghostpath shell integration <<<';

function getZshrcPath() {
  return path.join(os.homedir(), '.zshrc');
}

function getPowerShellProfilePaths() {
  if (process.platform === 'win32') {
    return [
      path.join(process.env.USERPROFILE || os.homedir(), 'Documents', 'PowerShell', 'Microsoft.PowerShell_profile.ps1'),
      path.join(process.env.USERPROFILE || os.homedir(), 'Documents', 'WindowsPowerShell', 'Microsoft.PowerShell_profile.ps1')
    ];
  }
  return [path.join(os.homedir(), '.config', 'powershell', 'Microsoft.PowerShell_profile.ps1')];
}

function getShellPluginPath() {
  return path.resolve(__dirname, '../../shell/ghostpath.zsh');
}

function getPwshPluginPath() {
  return path.resolve(__dirname, '../../shell/ghostpath.psm1');
}

function injectZsh() {
  const zshrcPath = getZshrcPath();
  const pluginPath = getShellPluginPath();

  let content = fs.existsSync(zshrcPath) ? fs.readFileSync(zshrcPath, 'utf8') : '';

  if (content.includes(ZSH_MARKER)) {
    console.log('  [ghostpath] Zsh integration already installed, skipping.');
    return;
  }

  const injection = `
${ZSH_MARKER}
# Ghostpath: auto-fill VS Code active file path via ghost suggestion + tab
source "${pluginPath}"
${ZSH_MARKER_END}
`;

  fs.appendFileSync(zshrcPath, injection);
  console.log(`  [ghostpath] ✅ Zsh integration added to ${zshrcPath}`);
  console.log('  [ghostpath] Run: source ~/.zshrc  (or restart terminal)');
}

function injectPowerShell() {
  const profilePaths = getPowerShellProfilePaths();
  const pluginPath = getPwshPluginPath();

  profilePaths.forEach(profilePath => {
    // Ensure profile directory exists
    const profileDir = path.dirname(profilePath);
    if (!fs.existsSync(profileDir)) {
      fs.mkdirSync(profileDir, { recursive: true });
    }

    let content = fs.existsSync(profilePath) ? fs.readFileSync(profilePath, 'utf8') : '';

    if (content.includes(PWSH_MARKER)) {
      console.log(`  [ghostpath] PowerShell integration already installed in ${path.basename(path.dirname(profilePath))}, skipping.`);
      return;
    }

    const injection = `
${PWSH_MARKER}
# Ghostpath: auto-fill VS Code active file path via tab completion
Import-Module "${pluginPath}"
${PWSH_MARKER_END}
`;

    fs.appendFileSync(profilePath, injection);
    console.log(`  [ghostpath] ✅ PowerShell integration added to ${profilePath}`);
  });
  console.log('  [ghostpath] Restart PowerShell terminal to activate.');
}

function printVSCodeInstructions() {
  console.log('');
  console.log('  [ghostpath] 📦 VS Code Extension Setup:');
  console.log('  Add this to your VS Code settings.json:');
  console.log('');
  console.log('  {');
  console.log('    "ghostpath.enable": true');
  console.log('  }');
  console.log('');
  console.log('  Or run the bundled VSIX manually:');
  const vsixPath = path.resolve(__dirname, '../../vscode-extension/ghostpath-vscode.vsix');
  if (fs.existsSync(vsixPath)) {
    console.log(`  code --install-extension "${vsixPath}"`);
  } else {
    console.log('  npx ghostpath install-extension');
  }
  console.log('');
}

function installAutoVscodeExtension() {
  const vsixPath = path.resolve(__dirname, '../../vscode-extension/ghostpath-vscode.vsix');
  if (fs.existsSync(vsixPath)) {
    try {
      console.log('  [ghostpath] Attempting to install VS Code extension automatically...');
      execSync(`code --install-extension "${vsixPath}"`, { stdio: 'ignore' });
      console.log('  [ghostpath] ✅ VS Code extension installed successfully.');
    } catch (e) {
      console.log('  [ghostpath] ⚠️ Could not auto-install VS Code extension. You will need to do it manually.');
    }
  }
}

module.exports = function setup(options) {
  console.log('');
  console.log('👻  Ghostpath - Setting up shell integration...');
  console.log('');

  const doZsh = options.zsh || (!options.zsh && !options.pwsh);
  const doPwsh = options.pwsh || (!options.zsh && !options.pwsh);

  if (doZsh) {
    try {
      injectZsh();
    } catch (e) {
      console.error('  [ghostpath] ❌ Zsh setup failed:', e.message);
    }
  }

  if (doPwsh) {
    try {
      injectPowerShell();
    } catch (e) {
      console.error('  [ghostpath] ❌ PowerShell setup failed:', e.message);
    }
  }

  if (!options.silent) {
    printVSCodeInstructions();
  }

  installAutoVscodeExtension();

  console.log('  [ghostpath] Done! Open a file in VS Code and press Tab in the terminal.');
  console.log('');
};
