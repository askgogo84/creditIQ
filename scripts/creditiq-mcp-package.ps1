
param([Parameter(Mandatory = $true)][string]$OutputPath)

$repo = Split-Path -Parent $PSScriptRoot
$package = Join-Path ([IO.Path]::GetTempPath()) ('creditiq-plugin-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path (Join-Path $package 'assets') -Force | Out-Null
try {
  Copy-Item -LiteralPath (Join-Path $repo 'docs/mcp/chatgpt-plugin/plugin.json') -Destination $package
  Copy-Item -LiteralPath (Join-Path $repo 'docs/mcp/chatgpt-plugin/mcp.json') -Destination $package
  Copy-Item -LiteralPath (Join-Path $repo 'public/creditiq_logo_512.png') -Destination (Join-Path $package 'assets/icon.png')
  Compress-Archive -Path (Join-Path $package '*') -DestinationPath $OutputPath -ErrorAction Stop
} finally {
  $root = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
  $resolved = (Resolve-Path -LiteralPath $package).Path
  if ($resolved.StartsWith($root, [StringComparison]::OrdinalIgnoreCase) -and (Split-Path -Leaf $resolved) -like 'creditiq-plugin-*') {
    Remove-Item -LiteralPath $resolved -Recurse
  }
}
