Add-Type -AssemblyName System.Drawing
$src = "C:\Users\sarth\Documents\Codex\2026-10-08\referenced-chatgpt-conversation-this-is-an\public\scanned_page_0.jpg"
$img = [System.Drawing.Bitmap]::FromFile($src)
$w = $img.Width
$h = $img.Height

# The "Farmer Photograph" header is at top right.
# Let's locate the photo box:
# In 3242 x 2020 image:
# Header "Farmer Photograph" is around x=2640, y=170
# Photo itself is right under it:
$px = 2640
$py = 220
$pw = 160
$ph = 205

$photo = New-Object System.Drawing.Bitmap $pw, $ph
$g = [System.Drawing.Graphics]::FromImage($photo)
$srcRect = New-Object System.Drawing.Rectangle $px, $py, $pw, $ph
$destRect = New-Object System.Drawing.Rectangle 0, 0, $pw, $ph
$g.DrawImage($img, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$destPath = "C:\Users\sarth\Documents\Codex\2026-10-08\referenced-chatgpt-conversation-this-is-an\public\sample_farmer_photo.jpg"
$photo.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)
$photo.Dispose()
$img.Dispose()
Write-Host "Extracted correct farmer photo from PDF!"
