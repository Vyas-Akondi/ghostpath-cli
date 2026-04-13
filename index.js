const fs = require('fs');
const path = require('path');

const TMP_FILE = process.platform === 'win32'
  ? path.join(process.env.TEMP || 'C:\\Temp', '_ghostpath_active_file')
  : '/tmp/_ghostpath_active_file';

/**
 * Get the current VS Code active file path
 * @returns {string|null} relative file path or null if not available
 */
function getCurrentFilePath() {
  if (!fs.existsSync(TMP_FILE)) return null;
  const content = fs.readFileSync(TMP_FILE, 'utf8').trim();
  return content || null;
}

/**
 * Watch for active file changes
 * @param {function} callback - called with new path when it changes
 * @returns {fs.FSWatcher} watcher instance
 */
function watchCurrentFile(callback) {
  if (!fs.existsSync(TMP_FILE)) {
    fs.writeFileSync(TMP_FILE, '', 'utf8');
  }
  return fs.watch(TMP_FILE, () => {
    callback(getCurrentFilePath());
  });
}

module.exports = { getCurrentFilePath, watchCurrentFile, TMP_FILE };
