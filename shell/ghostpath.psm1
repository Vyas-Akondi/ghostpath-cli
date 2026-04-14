# =============================================================================
# ghostpath.psm1 — PowerShell module for ghostpath
# Tab completion + inline suggestion for VS Code active file path
# =============================================================================

$isWindowsOS = if ($null -ne $IsWindows) { $IsWindows } else { ([System.Environment]::OSVersion.Platform.ToString() -match "Win32") }

$GHOSTPATH_TMP_FILE = if ($isWindowsOS) {
  $tempDir = if ($env:TEMP) { $env:TEMP } else { "C:\Temp" }
  Join-Path $tempDir "_ghostpath_active_file"
} else {
  "/tmp/_ghostpath_active_file"
}

# ─── Get current active file path ────────────────────────────────────────────
function Get-GhostpathFile {
  if (Test-Path $GHOSTPATH_TMP_FILE) {
    $content = Get-Content $GHOSTPATH_TMP_FILE -Raw -ErrorAction SilentlyContinue
    if (![string]::IsNullOrWhiteSpace($content)) {
      return $content.Trim()
    }
  }
  return $null
}

# ─── Show ghostpath status ────────────────────────────────────────────────────────
function Show-GhostpathStatus {
  $path = Get-GhostpathFile
  if ($path) {
    Write-Host ""
    Write-Host "  Ghostpath Active File: $path" -ForegroundColor Cyan
    Write-Host ""
  } else {
    Write-Host ""
    Write-Host "  Ghostpath: No active file detected. Open a file in VS Code." -ForegroundColor Yellow
    Write-Host ""
  }
}

# ─── Insert ghostpath path at current prompt ──────────────────────────────────────
function Invoke-GhostpathInsert {
  $filePath = Get-GhostpathFile
  if ($filePath) {
    # Insert the file path into the current readline buffer
    [Microsoft.PowerShell.PSConsoleReadLine]::Insert($filePath)
  }
}

# ─── Tab completion using PSReadLine ─────────────────────────────────────────
# Override Tab key: if ghostpath has an active file, show it as first suggestion
Set-PSReadLineKeyHandler -Key Tab -ScriptBlock {
  param($key, $arg)

  $filePath = Get-GhostpathFile

  if ($filePath) {
    $line = $null
    $cursor = $null
    [Microsoft.PowerShell.PSConsoleReadLine]::GetBufferState([ref]$line, [ref]$cursor)

    $insertDirectly = $false
    if ([string]::IsNullOrWhiteSpace($line)) {
      # If line is empty, directly insert the ghostpath file
      $insertDirectly = $true
    } else {
      try {
        $completions = [System.Management.Automation.CommandCompletion]::CompleteInput($line, $cursor, $null)
        if ($null -eq $completions -or $completions.CompletionMatches.Count -eq 0) {
          $insertDirectly = $true
        }
      } catch {
        # Fallback if internal parser throws "Sequence contains no elements" or other errors in PS 5.1
        $insertDirectly = $true
      }
    }

    if ($insertDirectly) {
      [Microsoft.PowerShell.PSConsoleReadLine]::Insert($filePath)
    } else {
      [Microsoft.PowerShell.PSConsoleReadLine]::TabCompleteNext()
    }
  } else {
    # Normal tab completion
    [Microsoft.PowerShell.PSConsoleReadLine]::TabCompleteNext()
  }
}

# ─── Ghost suggestion via PSReadLine prompt ──────────────────────────────────
# Show the active file path dimmed in the prompt as a hint
$Global:GhostpathLastFile = $null

function prompt {
  $filePath = Get-GhostpathFile

  # Store for use in tab handler
  $Global:GhostpathLastFile = $filePath

  # Build the normal prompt
  $location = (Get-Location).Path | Split-Path -Leaf
  $promptText = "PS $location> "

  Write-Host $promptText -NoNewline -ForegroundColor Green

  # Show ghost suggestion (dimmed) if a file is active
  if ($filePath) {
    Write-Host " [$filePath]" -NoNewline -ForegroundColor DarkGray
    # Move cursor back to after the prompt text (ghost is visual only)
    $moveBack = $filePath.Length + 3  # " [" + "]"
    Write-Host ("`b" * $moveBack) -NoNewline
  }

  return " "
}

# ─── Argument completer for common commands ──────────────────────────────────
# When you type: node <Tab>  or  python <Tab>  — ghostpath path is suggested
$ghostpathCommands = @('node', 'python', 'python3', 'ts-node', 'deno', 'bun',
                  'cat', 'code', 'vim', 'nvim', 'nano', 'cp', 'mv', 'rm')

foreach ($cmd in $ghostpathCommands) {
  Register-ArgumentCompleter -Native -CommandName $cmd -ScriptBlock {
    param($wordToComplete, $commandAst, $cursorPosition)

    $filePath = Get-GhostpathFile
    if ($filePath) {
      [System.Management.Automation.CompletionResult]::new(
        $filePath,
        "[ghostpath] $filePath",
        [System.Management.Automation.CompletionResultType]::ParameterValue,
        "Current VS Code active file"
      )
    }
  }
}

# ─── Export ──────────────────────────────────────────────────────────────────
Export-ModuleMember -Function Get-GhostpathFile, Show-GhostpathStatus, Invoke-GhostpathInsert

Write-Host "  [ghostpath] loaded - active file path available via Tab" -ForegroundColor DarkGray
