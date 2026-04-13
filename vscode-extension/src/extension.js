const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Temp file path — shared with the shell plugin
const TMP_FILE = process.platform === 'win32'
  ? path.join(process.env.TEMP || 'C:\\Temp', '_ghostpath_active_file')
  : '/tmp/_ghostpath_active_file';

/**
 * Write the active file's relative (or absolute) path to the temp file.
 * The shell plugin reads this file to provide ghost suggestions + tab fill.
 */
function writeActivePath(document) {
  const config = vscode.workspace.getConfiguration('ghostpath');
  if (!config.get('enable', true)) return;

  if (!document || document.isUntitled || document.uri.scheme !== 'file') {
    fs.writeFileSync(TMP_FILE, '', 'utf8');
    return;
  }

  const useRelative = config.get('useRelativePath', true);
  const filePath = document.uri.fsPath;

  let outputPath = filePath;

  if (useRelative) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      // Find the workspace folder that contains this file
      const wsFolder = workspaceFolders.find(folder =>
        filePath.startsWith(folder.uri.fsPath)
      );
      if (wsFolder) {
        outputPath = path.relative(wsFolder.uri.fsPath, filePath);
        // Normalize to forward slashes on Windows for consistency
        outputPath = outputPath.replace(/\\/g, '/');
      }
    }
  }

  try {
    fs.writeFileSync(TMP_FILE, outputPath, 'utf8');
  } catch (err) {
    // Silently ignore write errors (e.g. permissions)
  }
}

function activate(context) {
  // Write path immediately for already-open file
  if (vscode.window.activeTextEditor) {
    writeActivePath(vscode.window.activeTextEditor.document);
  }

  // Update whenever active editor changes
  const onDidChangeActive = vscode.window.onDidChangeActiveTextEditor(editor => {
    writeActivePath(editor?.document);
  });

  // Update when a file is saved (in case of renames)
  const onDidSave = vscode.workspace.onDidSaveTextDocument(document => {
    if (vscode.window.activeTextEditor?.document === document) {
      writeActivePath(document);
    }
  });

  // Clear when no editor is open
  const onDidClose = vscode.workspace.onDidCloseTextDocument(() => {
    if (!vscode.window.activeTextEditor) {
      fs.writeFileSync(TMP_FILE, '', 'utf8');
    }
  });

  context.subscriptions.push(onDidChangeActive, onDidSave, onDidClose);

  // Show activation message in status bar
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = '$(file-code) ghostpath';
  statusBar.tooltip = 'Ghostpath: active file path tracking enabled';
  statusBar.show();
  context.subscriptions.push(statusBar);
}

function deactivate() {
  // Clean up temp file on deactivate
  try {
    if (fs.existsSync(TMP_FILE)) {
      fs.writeFileSync(TMP_FILE, '', 'utf8');
    }
  } catch (_) {}
}

module.exports = { activate, deactivate };
