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

```bash
npm install -g ghostpath-cli
```

This will automatically run a post-install script that:
1. **Injects shell integration** into your `~/.zshrc` and PowerShell profile.
2. **Automatically attempts to install** the companion VS Code Extension if you have the `code` CLI available.

---

## VS Code Extension Setup

If the automatic installation doesn't work, you can easily install the bundled VS Code extension manually:

```bash
# Install the bundled VSIX manually
code --install-extension $(npm root -g)/ghostpath-cli/vscode-extension/ghostpath-vscode.vsix
```

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

If `postinstall` didn't run, add to your `~/.zshrc` manually:

```zsh
source "$(npm root -g)/ghostpath-cli/shell/ghostpath.zsh"
```

For PowerShell, add to your `$PROFILE`:

```powershell
Import-Module "$(npm root -g)/ghostpath-cli/shell/ghostpath.psm1"
```

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
