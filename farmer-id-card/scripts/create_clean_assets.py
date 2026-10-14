import fitz
from PIL import Image, ImageDraw

def create_back_banner():
    # Crop the brush area from back_template_raw.png
    b = Image.open('public/back_template_raw.png').convert('RGB')
    # Brush banner is at x: 620 to 2260, y: 90 to 360
    brush = b.crop((600, 90, 2260, 360))
    w, h = brush.size
    
    # We want Marathi text: "भारतीय विशिष्ट ओळख प्राधिकरण" and "Unique Identification Authority of India"
    # To replace the text cleanly without losing the brush strokes texture:
    # Let's inspect or let's create a clean high-res brush banner or render text
    brush.save('public/back_brush_raw.png')

    # Also let's check scissor icon from Reference 1
    ref1 = Image.open('C:/Users/sarth/.gemini/antigravity-ide/brain/22cb536e-df15-431e-aaf0-9412db7633be/.user_uploaded/media_1791866119457.png')
    # Scissor is at top right: x: 970 to 1020, y: 0 to 35
    scissor = ref1.crop((970, 0, 1020, 35))
    scissor.save('public/scissor_icon.png')

    print("Cropped scissor icon")

if __name__ == '__main__':
    create_back_banner()
