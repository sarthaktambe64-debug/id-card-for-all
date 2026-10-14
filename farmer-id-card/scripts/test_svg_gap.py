import fitz
from PIL import Image

doc = fitz.open()
page = doc.new_page(width=1000, height=200)

# SVG with built-in width: viewBox="0 0 36 24", icon is in 0..24, so right 12 units is gap
phone_svg = '''<svg width="102" height="68" viewBox="0 0 36 24" fill="none" stroke="#111111" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -12px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'''

html = f'<div style="font-family: Arial, sans-serif; font-size: 60px; font-weight: bold; color: black; line-height: 1;">{phone_svg}<span>1947</span></div>'

page.insert_htmlbox(fitz.Rect(10, 10, 500, 100), html)
pix = page.get_pixmap()
pix.save('test_svg_gap.png')

# Measure where icon ends and text begins
im = Image.open('test_svg_gap.png')
y_test = 50
dark_x = [x for x in range(10, 400) if im.getpixel((x, y_test)) != (255, 255, 255)]
print('All dark X at y=50:', dark_x)
