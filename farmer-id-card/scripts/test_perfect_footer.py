import fitz
from PIL import Image, ImageDraw

def test_full_footer_fit(font_size=60, phone_x=345, email_x=976, globe_x=1805):
    doc = fitz.open()
    page = doc.new_page(width=2560, height=1632)

    # Base card outline and lines
    pix_bg = Image.new("RGB", (2560, 1632), (255, 255, 255))
    d = ImageDraw.Draw(pix_bg)
    # Card outer border
    d.rectangle([40, 115, 2520, 1595], outline=(20, 20, 20), width=5)
    # Red divider line
    d.rectangle([40, 1474, 2520, 1480], fill=(215, 38, 56))
    # Separators: exactly matching ref
    d.line([(872, 1515), (872, 1555)], fill=(125, 125, 125), width=3)
    d.line([(1694, 1515), (1694, 1555)], fill=(125, 125, 125), width=3)
    pix_bg.save("temp_test_bg.png")

    page.insert_image(fitz.Rect(0, 0, 2560, 1632), filename="temp_test_bg.png")

    # SVG Icons with built-in right gap (viewBox width 36 vs icon width 24)
    # Total SVG width = 100, icon is ~67px, gap is ~33px
    phone_svg = '''<svg width="102" height="68" viewBox="0 0 36 24" fill="none" stroke="#111111" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -12px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'''

    email_svg = '''<svg width="102" height="54" viewBox="0 0 36 24" fill="none" stroke="#111111" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -7px;"><rect width="20" height="15" x="2" y="4.5" rx="1.5"></rect><path d="m22 7.5-10 6-10-6"></path></svg>'''

    globe_svg = '''<svg width="102" height="68" viewBox="0 0 36 24" fill="none" stroke="#111111" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -12px;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>'''

    y_top = 1502
    y_h = 72

    p_html = f'<div style="font-family: Arial, sans-serif; font-size: {font_size}px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1;">{phone_svg}<span>1947</span></div>'
    e_html = f'<div style="font-family: Arial, sans-serif; font-size: {font_size}px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1;">{email_svg}<span>help@uidai.gov.in</span></div>'
    g_html = f'<div style="font-family: Arial, sans-serif; font-size: {font_size}px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1;">{globe_svg}<span>www.uidai.gov.in</span></div>'

    # Insert groups
    page.insert_htmlbox(fitz.Rect(phone_x, y_top, phone_x + 500, y_top + y_h), p_html)
    page.insert_htmlbox(fitz.Rect(email_x, y_top, email_x + 700, y_top + y_h), e_html)
    page.insert_htmlbox(fitz.Rect(globe_x, y_top, globe_x + 700, y_top + y_h), g_html)

    pix = page.get_pixmap(dpi=72)
    pix.save("test_perfect_footer.png")
    
    # Measure against ref
    ref = Image.open(r'C:\Users\sarth\.gemini\antigravity-ide\brain\22cb536e-df15-431e-aaf0-9412db7633be\.tempmediaStorage\media_1791873522571.png')
    out = Image.open('test_perfect_footer.png')
    out_row = out.crop((40, 1474, 2520, 1595)).resize((853, 43), Image.Resampling.LANCZOS)
    out_canvas = Image.new('RGB', (882, 80), (255, 255, 255))
    out_canvas.paste(out_row, (11, 22))

    comp = Image.new('RGB', (882, 170), (240, 240, 240))
    comp.paste(ref, (0, 0))
    comp.paste(out_canvas, (0, 90))
    comp.save('footer_perfect_comp.png')
    print("Saved footer_perfect_comp.png")

if __name__ == "__main__":
    test_full_footer_fit(font_size=60)
