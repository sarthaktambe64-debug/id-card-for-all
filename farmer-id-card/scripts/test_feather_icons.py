import fitz
from PIL import Image

doc = fitz.open()
page = doc.new_page(width=1000, height=400)

# Phone: Feather/Lucide phone icon with fill="none", stroke="#111111", stroke-width="2.6"
phone_svg = '''<svg width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -10px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'''

# Email: Rect with V fold
email_svg = '''<svg width="64" height="52" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -6px;"><rect width="20" height="15" x="2" y="4.5" rx="1.5"></rect><path d="m22 7.5-10 6-10-6"></path></svg>'''

# Globe: Circle with equator and meridians
globe_svg = '''<svg width="62" height="62" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -10px;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>'''

html = f'''
<div style="font-family: Arial, sans-serif; font-size: 58px; font-weight: bold; color: #111111; line-height: 1.6;">
  <div>{phone_svg} <span style="margin-left: 20px;">1947</span></div>
  <div>{email_svg} <span style="margin-left: 20px;">help@uidai.gov.in</span></div>
  <div>{globe_svg} <span style="margin-left: 20px;">www.uidai.gov.in</span></div>
</div>
'''

page.insert_htmlbox(fitz.Rect(30, 20, 970, 380), html)
pix = page.get_pixmap(dpi=100)
pix.save('test_feather_icons.png')
print("Successfully generated test_feather_icons.png")
