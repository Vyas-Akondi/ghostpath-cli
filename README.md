# 👻 ghostpath

> Auto-fill your VS Code active file's relative path in the terminal — via ghost suggestion and Tab completion.

![npm](https://img.shields.io/npm/v/ghostpath-cli) ![license](https://img.shields.io/npm/l/ghostpath-cli)

---

## How it works

```
┌─────────────────────────────────────────┐
│  VS Code Editor                         │
│  (ghostpath extension active)                │
│  Opens: src/components/Button.tsx  ───────────┐
└─────────────────────────────────────────┘     │
                                                 ▼
                                    /tmp/_ghostpath_active_file
                                    "src/components/Button.tsx"
                                                 │
┌─────────────────────────────────────────┐     │
│  Terminal (Zsh / PowerShell)            │◄────┘
│                                         │
│  $ node [Tab]                           │
│  $ node src/components/Button.tsx  ✅   │
│                                         │
│  RPROMPT: ↹ src/components/Button.tsx  │  ← ghost suggestion
└─────────────────────────────────────────┘
```

---

## Installation

You can install `ghostpath-cli` either globally (recommended) or locally in a specific project workspace.

**Global Installation:**
```bash
npm install -g ghostpath-cli
```

**Local Installation:**
```bash
npm install ghostpath-cli
```

Whether installed globally or locally, it will automatically run a post-install script that:
1. **Injects shell integration** into your `~/.zshrc` (macOS/Linux) and `$PROFILE` (Windows) securely using the exact absolute path of the installation.
2. **Automatically attempts to install** the companion VS Code Extension if you have the `code` CLI available.

---

## VS Code Extension Setup

If the automatic installation doesn't work, the most reliable way to install the VS Code extension across all Operating Systems is manually via the VS Code interface.

1. Open **Visual Studio Code**.
2. Go to the **Extensions** panel (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3. Click the `...` menu at the top right and select **Install from VSIX...**
4. Navigate to your installed `node_modules` folder (either local or global) and locate `node_modules/ghostpath-cli/vscode-extension/ghostpath-vscode.vsix`.
5. Select the file to install it instantly.

Or manually copy `vscode-extension/src/extension.js` into your own extension.

Add to your VS Code `settings.json`:
```json
{
  "ghostpath.enable": true,
  "ghostpath.useRelativePath": true
}
```

---

## Usage

### Zsh

Once set up, open any file in VS Code. In your terminal:

| Action | Result |
|--------|--------|
| Look at right prompt | See ghost: `↹ src/foo/bar.ts` |
| Press `Tab` (nothing typed) | Inserts `src/foo/bar.ts` |
| Type `node ` then press `Tab` | Inserts `node src/foo/bar.ts` |
| Type anything + `Tab` again | Appends file path |

If you have **zsh-autosuggestions** installed, ghostpath also feeds into it as a suggestion strategy.

### PowerShell

| Action | Result |
|--------|--------|
| Prompt shows `[src/foo/bar.ts]` dimmed | Ghost hint |
| Type `node` then press `Tab` | Shows ghostpath path as first completion |
| `node`, `python`, `cat`, `code` etc. | All support ghostpath tab completion |

---

## CLI Commands

```bash
ghostpath setup          # Re-run shell integration setup
ghostpath status         # Show what file path ghostpath currently sees
ghostpath current        # Print the raw current file path (used by shell internally)
ghostpath setup --zsh    # Setup Zsh only
ghostpath setup --pwsh   # Setup PowerShell only
```

---

## Manual Shell Setup

If the `postinstall` script didn't run automatically, or if you moved your installation path, you can use the built-in CLI to safely configure your shell integration correctly.

Simply run the built-in setup script:

```bash
npx ghostpath setup
```

This acts as a universal command that safely determines if you are running globally or locally, computes the exact directory, and gracefully sets up your shell scripts (`.zshrc` or `$PROFILE`) without you needing to do any copy-pasting.

---

## Programmatic API

**CommonJS:**
```js
const ghostpath = require('ghostpath-cli');
```

**ES Modules (ESM):**
```js
import ghostpath from 'ghostpath-cli';
```

```js
// Get current active file
const filePath = ghostpath.getCurrentFilePath();
console.log(filePath); // "src/components/Button.tsx"

// Watch for changes
const watcher = ghostpath.watchCurrentFile((newPath) => {
  console.log('Active file changed to:', newPath);
});
```

---

## How the temp file works

The VS Code extension writes the active file's **relative path** (from workspace root) to:

- **macOS/Linux:** `/tmp/_ghostpath_active_file`
- **Windows:** `%TEMP%\_ghostpath_active_file`

The shell plugin reads this file on every prompt render and on Tab press. Zero dependencies, zero overhead.

---

## Troubleshooting

**Tab isn't working:**
```bash
ghostpath status         # Check if ghostpath sees the active file
source ~/.zshrc     # Reload shell integration
```

**Wrong path shown:**
- Make sure the file is saved and in an open VS Code workspace
- Check `ghostpath.useRelativePath` is `true` in VS Code settings

**PowerShell: module not loading:**
```powershell
Get-ExecutionPolicy    # Should be RemoteSigned or Unrestricted
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```
