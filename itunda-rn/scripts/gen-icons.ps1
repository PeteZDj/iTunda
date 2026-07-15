Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\assets\images'
New-Item -ItemType Directory -Force -Path $dir | Out-Null

function P([double]$x, [double]$y) { New-Object System.Drawing.PointF([single]$x, [single]$y) }

function New-LeafIcon($path, $size, $bgHex, [bool]$transparent, $leafHex, $veinHex, [double]$scale) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    if ($transparent) {
        $g.Clear([System.Drawing.Color]::Transparent)
    } else {
        $g.Clear([System.Drawing.ColorTranslator]::FromHtml($bgHex))
    }

    $cx = $size / 2.0
    $cy = $size / 2.0
    $half = ($size * $scale) / 2.0
    $wide = $half * 0.72

    # Leaf silhouette: two mirrored bezier curves, tilted slightly.
    $top = P $cx ($cy - $half)
    $bot = P $cx ($cy + $half)
    $leaf = New-Object System.Drawing.Drawing2D.GraphicsPath
    $leaf.AddBezier($top, (P ($cx + $wide) ($cy - $half * 0.35)), (P ($cx + $wide) ($cy + $half * 0.55)), $bot)
    $leaf.AddBezier($bot, (P ($cx - $wide) ($cy + $half * 0.55)), (P ($cx - $wide) ($cy - $half * 0.35)), $top)

    $leafBrush = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml($leafHex))
    $g.FillPath($leafBrush, $leaf)

    # Central vein
    $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml($veinHex), [single]($size * 0.018))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($pen, [single]$cx, [single]($cy - $half * 0.78), [single]$cx, [single]($cy + $half * 0.82))
    # Two side veins
    $g.DrawLine($pen, [single]$cx, [single]($cy - $half * 0.15), [single]($cx + $wide * 0.5), [single]($cy - $half * 0.45))
    $g.DrawLine($pen, [single]$cx, [single]($cy + $half * 0.2), [single]($cx - $wide * 0.5), [single]($cy - $half * 0.05))

    $g.Dispose()
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "wrote $path"
}

# Launcher icon: deep green field, fresh-green leaf, light vein
New-LeafIcon (Join-Path $dir 'icon.png') 1024 '#0A4A26' $false '#22B15A' '#DCFCE7' 0.62
# Adaptive foreground: transparent, white leaf inside safe zone
New-LeafIcon (Join-Path $dir 'adaptive-foreground.png') 1024 '#000000' $true '#FFFFFF' '#0A4A26' 0.42
# Splash: transparent bg (splash color is deep green), gold leaf
New-LeafIcon (Join-Path $dir 'splash-icon.png') 512 '#000000' $true '#F4A621' '#0A4A26' 0.6
# Favicon
New-LeafIcon (Join-Path $dir 'favicon.png') 64 '#0A4A26' $false '#22B15A' '#DCFCE7' 0.62
