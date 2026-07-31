$root = $PSScriptRoot
$port = 8792
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

$mime = @{
    ".html" = "text/html"; ".js" = "application/javascript"; ".css" = "text/css";
    ".json" = "application/json"; ".png" = "image/png"; ".jpg" = "image/jpeg";
    ".jpeg" = "image/jpeg"; ".svg" = "image/svg+xml"; ".ico" = "image/x-icon";
    ".webmanifest" = "application/manifest+json"; ".gif" = "image/gif";
    ".woff" = "font/woff"; ".woff2" = "font/woff2"; ".ttf" = "font/ttf"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response
    $path = $req.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    if ($path -notmatch "\.") { $path = "$path.html" }
    $filePath = Join-Path $root ($path.TrimStart("/"))
    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $contentType = $mime[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.ContentType = $contentType
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $res.StatusCode = 404
    }
    $res.OutputStream.Close()
}
