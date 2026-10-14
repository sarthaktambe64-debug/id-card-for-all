Add-Type -AssemblyName System.Drawing
$src = "C:\Users\sarth\Documents\Codex\2026-10-08\referenced-chatgpt-conversation-this-is-an\public\farmer2_background_raw.jpg"
$img = [System.Drawing.Bitmap]::FromFile($src)
$w = $img.Width
$h = $img.Height
$halfW = [int]($w / 2)

$front = New-Object System.Drawing.Bitmap $halfW, $h
$gFront = [System.Drawing.Graphics]::FromImage($front)
$srcRectFront = New-Object System.Drawing.Rectangle 0, 0, $halfW, $h
$destRect = New-Object System.Drawing.Rectangle 0, 0, $halfW, $h
$gFront.DrawImage($img, $destRect, $srcRectFront, [System.Drawing.GraphicsUnit]::Pixel)
$gFront.Dispose()
$front.Save("C:\Users\sarth\Documents\Codex\2026-10-08\referenced-chatgpt-conversation-this-is-an\public\agristack_card_front_exact.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$front.Dispose()

$back = New-Object System.Drawing.Bitmap $halfW, $h
$gBack = [System.Drawing.Graphics]::FromImage($back)
$srcRectBack = New-Object System.Drawing.Rectangle $halfW, 0, $halfW, $h
$gBack.DrawImage($img, $destRect, $srcRectBack, [System.Drawing.GraphicsUnit]::Pixel)
$gBack.Dispose()
$back.Save("C:\Users\sarth\Documents\Codex\2026-10-08\referenced-chatgpt-conversation-this-is-an\public\agristack_card_back_exact.jpg", [System.Drawing.Imaging.ImageFormat]::Jpeg)
$back.Dispose()

$img.Dispose()
Write-Host "Done cropping background images!"
