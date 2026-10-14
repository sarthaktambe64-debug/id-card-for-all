import fitz
from PIL import Image

doc = fitz.open()
page = doc.new_page(width=1000, height=500)

phone_1 = '''<svg width="60" height="60" viewBox="0 0 24 24" fill="#111111" style="vertical-align: -8px;"><path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 00-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 2 3 2.24 3 2.99A17.97 17.97 0 0021 21c.76 0 1-.65 1-1.19v-3.44c0-.54-.45-.99-.99-.99z"/></svg>'''

phone_2 = '''<svg width="60" height="60" viewBox="0 0 24 24" fill="#111111" style="vertical-align: -8px;"><path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z"/></svg>'''

email_svg = '''<svg width="60" height="48" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -6px;"><rect width="20" height="15" x="2" y="4.5" rx="2"></rect><path d="m22 7.5-10 6-10-6"></path></svg>'''

globe_svg = '''<svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -8px;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>'''

html = f'''
<div style="font-family: Arial, sans-serif; font-size: 58px; font-weight: bold; color: #111111; line-height: 1.6;">
  <div>{phone_1} <span style="margin-left: 20px;">1947 (Phone 1)</span></div>
  <div>{phone_2} <span style="margin-left: 20px;">1947 (Phone 2)</span></div>
  <div>{email_svg} <span style="margin-left: 20px;">help@uidai.gov.in</span></div>
  <div>{globe_svg} <span style="margin-left: 20px;">www.uidai.gov.in</span></div>
</div>
'''

page.insert_htmlbox(fitz.Rect(30, 30, 970, 470), html)
pix = page.get_pixmap(dpi=100)
pix.save('test_icons_render.png')
print("Successfully generated test_icons_render.png")
