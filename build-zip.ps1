Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$sourceDir = (Resolve-Path ".\public_html").Path
$zipPath = Join-Path (Resolve-Path ".").Path "public_html.zip"

if (Test-Path $zipPath) {
    Remove-Item $zipPath -Force
}

$zip = [System.IO.Compression.ZipFile]::Open($zipPath, [System.IO.Compression.ZipArchiveMode]::Create)

Get-ChildItem -Path $sourceDir -Recurse -File | Where-Object { $_.Name -ne ".env" } | ForEach-Object {
    $fullPath = $_.FullName
    $relPath = $fullPath.Substring($sourceDir.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $fullPath, $relPath, [System.IO.Compression.CompressionLevel]::Optimal) | Out-Null
}

$zip.Dispose()

$zipItem = Get-Item $zipPath
Write-Host ("Rebuilt public_html.zip successfully: " + $zipItem.FullName + " (" + [math]::Round($zipItem.Length / 1KB, 2) + " KB)")

