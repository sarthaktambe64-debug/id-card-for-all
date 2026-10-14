import fitz
from PIL import Image, ImageDraw

def render_calibrated_footer(
    font_size=60,
    phone_icon_w=68, phone_icon_h=68, phone_gap=36, phone_box_x=345,
    email_icon_w=68, email_icon_h=54, email_gap=36, email_box_x=976,
    globe_icon_w=68, globe_icon_h=68, globe_gap=36, globe_box_x=1805,
    y_top=1502, y_h=72
):
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

    # SVG Icons
    # Phone: matching reference handset
    phone_svg = f'''<svg width="{phone_icon_w}" height="{phone_icon_h}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -12px; margin-right: {phone_gap}px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'''

    # Email: Rect with V fold
    email_svg = f'''<svg width="{email_icon_w}" height="{email_icon_h}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -7px; margin-right: {email_gap}px;"><rect width="20" height="15" x="2" y="4.5" rx="1.5"></rect><path d="m22 7.5-10 6-10-6"></path></svg>'''

    # Globe: Circle with equator and meridians
    globe_svg = f'''<svg width="{globe_icon_w}" height="{globe_icon_h}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.7" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -12px; margin-right: {globe_gap}px;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>'''

    p_html = f'<div style="font-family: Arial, sans-serif; font-size: {font_size}px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1;">{phone_svg}<span>1947</span></div>'
    e_html = f'<div style="font-family: Arial, sans-serif; font-size: {font_size}px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1;">{email_svg}<span>help@uidai.gov.in</span></div>'
    g_html = f'<div style="font-family: Arial, sans-serif; font-size: {font_size}px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1;">{globe_svg}<span>www.uidai.gov.in</span></div>'

    # Insert groups with ample width to avoid wrapping
    page.insert_htmlbox(fitz.Rect(phone_box_x, y_top, phone_box_x + 500, y_top + y_h), p_html)
    page.insert_htmlbox(fitz.Rect(email_box_x, y_top, email_box_x + 700, y_top + y_h), e_html)
    page.insert_htmlbox(fitz.Rect(globe_box_x, y_top, globe_box_x + 700, y_top + y_h), g_html)

    pix = page.get_pixmap(dpi=72)
    pix.save("test_calibrated_footer.png")
    
    # Measure against ref
    ref = Image.open(r'C:\Users\sarth\.gemini\antigravity-ide\brain\22cb536e-df15-431e-aaf0-9412db7633be\.tempmediaStorage\media_1791873522571.png')
    out = Image.open('test_calibrated_footer.png')
    out_row = out.crop((40, 1474, 2520, 1595)).resize((853, 43), Image.Resampling.LANCZOS)
    out_canvas = Image.new('RGB', (882, 80), (255, 255, 255))
    out_canvas.paste(out_row, (11, 22))

    comp = Image.new('RGB', (882, 170), (240, 240, 240))
    comp.paste(ref, (0, 0))
    comp.paste(out_canvas, (0, 90))
    comp.save('footer_calibrated_comp.png')
    print("Saved footer_calibrated_comp.png")

if __name__ == "__main__":
    render_calibrated_footer()
