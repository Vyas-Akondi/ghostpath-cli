# =============================================================================
# ghostpath.zsh — Zsh shell integration for ghostpath
# Ghost suggestion + Tab completion for VS Code active file path
# =============================================================================

# Path to the temp file written by the VS Code extension
GHOSTPATH_TMP_FILE="/tmp/_ghostpath_active_file"

# ─── Get current active file path ────────────────────────────────────────────
_ghostpath_get_path() {
  if [[ -f "$GHOSTPATH_TMP_FILE" ]]; then
    cat "$GHOSTPATH_TMP_FILE" 2>/dev/null
  fi
}

# ─── ZLE Widget: append file path at cursor ──────────────────────────────────
_ghostpath_insert_path() {
  local file_path
  file_path=$(_ghostpath_get_path)

  if [[ -n "$file_path" ]]; then
    # Append file path to whatever is already typed
    LBUFFER="${LBUFFER}${file_path}"
  else
    # Fallback: normal tab completion if no ghostpath path
    zle expand-or-complete
  fi
}

zle -N _ghostpath_insert_path

# ─── Tab key binding ─────────────────────────────────────────────────────────
# Override Tab to use ghostpath insert if a file path is available,
# otherwise fall back to normal completion
_ghostpath_smart_tab() {
  local file_path
  file_path=$(_ghostpath_get_path)

  if [[ -n "$file_path" ]]; then
    # Show ghost suggestion first, then on second tab insert it
    if [[ "$GHOSTPATH_GHOST_SHOWN" == "1" ]]; then
      LBUFFER="${LBUFFER}${file_path}"
      GHOSTPATH_GHOST_SHOWN="0"
      zle reset-prompt
    else
      GHOSTPATH_GHOST_SHOWN="1"
      zle reset-prompt
    fi
  else
    GHOSTPATH_GHOST_SHOWN="0"
    zle expand-or-complete
  fi
}

zle -N _ghostpath_smart_tab
bindkey '^I' _ghostpath_smart_tab   # Tab key

# Reset ghost state when user types anything
_ghostpath_reset_ghost() {
  GHOSTPATH_GHOST_SHOWN="0"
}
zle -N _ghostpath_reset_ghost

# Hook into keymap to reset ghost on any character typed
autoload -Uz add-zle-hook-widget 2>/dev/null
add-zle-hook-widget zle-line-pre-redraw _ghostpath_noop 2>/dev/null

_ghostpath_noop() { : }

# ─── Ghost suggestion in RPROMPT ─────────────────────────────────────────────
# Shows the file path as a dimmed ghost on the right side of the prompt
_ghostpath_precmd() {
  local file_path
  file_path=$(_ghostpath_get_path)

  if [[ -n "$file_path" ]]; then
    # Show ghost suggestion in right prompt (dimmed gray)
    export RPROMPT="%F{240}↹ ${file_path}%f"
  else
    export RPROMPT=""
  fi
}

# Register precmd hook
autoload -Uz add-zsh-hook
add-zsh-hook precmd _ghostpath_precmd

# ─── Completion function ──────────────────────────────────────────────────────
# Allows `ghostpath<Tab>` to complete to the active file path
_ghostpath_completion() {
  local file_path
  file_path=$(_ghostpath_get_path)

  if [[ -n "$file_path" ]]; then
    compadd -Q -- "$file_path"
  fi
}

if type compdef > /dev/null 2>&1; then
  compdef _ghostpath_completion ghostpath
fi

# ─── Zsh autosuggestion style (if zsh-autosuggestions is installed) ───────────
# Integrates with zsh-autosuggestions to show ghostpath path as a suggestion
if (( ${+functions[_zsh_autosuggest_strategy_history]} )); then
  _zsh_autosuggest_strategy_ghostpath() {
    local file_path
    file_path=$(_ghostpath_get_path)
    if [[ -n "$file_path" && -z "$1" ]]; then
      suggestion="$file_path"
    fi
  }

  # Prepend ghostpath to suggestion strategies
  ZSH_AUTOSUGGEST_STRATEGY=(ghostpath history completion)
fi

# ─── Done ─────────────────────────────────────────────────────────────────────
# Usage:
#   - The active file path is shown as a ghost in the right prompt
#   - Press Tab once to highlight/preview, Tab again to insert
#   - Works even after typing a command (appends path after cursor)
#   - Run `ghostpath status` to debug active file detection
