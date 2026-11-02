# Builds dist/nanay-shopify-theme.zip from theme/ with forward-slash paths (Shopify's uploader needs them).
# usage: powershell -ExecutionPolicy Bypass -File tools/zip-theme.ps1
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$root = Resolve-Path (Join-Path $PSScriptRoot '..')
$src = Join-Path $root 'theme'
$out = Join-Path $root 'dist\nanay-shopify-theme.zip'
New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
if (Test-Path $out) { Remove-Item $out -Force }
$zip = [IO.Compression.ZipFile]::Open($out, 'Create')
try {
  Get-ChildItem $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length + 1).Replace('\', '/')
    [IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, 'Optimal') | Out-Null
  }
} finally { $zip.Dispose() }
$z = Get-Item $out
"Built $out ($([math]::Round($z.Length / 1MB, 1)) MB)"
