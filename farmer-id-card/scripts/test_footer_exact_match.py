import fitz
from PIL import Image, ImageDraw

def test_footer_layout(font_size=58, icon_scale=62, icon_gap=28,
                       phone_x=345, email_x=976, globe_x=1805,
                       y_top=1506, y_h=66):
    doc = fitz.open()
    page = doc.new_page(width=2560, height=1632)

    # Base card outline and lines
    pix_bg = Image.new("RGB", (2560, 1632), (255, 255, 255))
    d = ImageDraw.Draw(pix_bg)
    # Card outer border
    d.rectangle([40, 115, 2520, 1595], outline=(20, 20, 20), width=5)
    # Red divider line
    d.rectangle([40, 1474, 2520, 1480], fill=(215, 38, 56))
    # Separators
    d.line([(872, 1515), (872, 1555)], fill=(125, 125, 125), width=3)
    d.line([(1694, 1515), (1694, 1555)], fill=(125, 125, 125), width=3)
    pix_bg.save("temp_test_bg.png")

    page.insert_image(fitz.Rect(0, 0, 2560, 1632), filename="temp_test_bg.png")

    # SVG Icons
    # Phone
    phone_svg = f'''<svg width="{icon_scale}" height="{icon_scale}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -10px; margin-right: {icon_gap}px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'''

    # Email
    email_h = int(icon_scale * 0.82)
    email_svg = f'''<svg width="{icon_scale}" height="{email_h}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -6px; margin-right: {icon_gap}px;"><rect width="20" height="15" x="2" y="4.5" rx="1.5"></rect><path d="m22 7.5-10 6-10-6"></path></svg>'''

    # Globe
    globe_svg = f'''<svg width="{icon_scale}" height="{icon_scale}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -10px; margin-right: {icon_gap}px;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>'''

    p_html = f'<div style="font-family: Arial, sans-serif; font-size: {font_size}px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1;">{phone_svg}<span>1947</span></div>'
    e_html = f'<div style="font-family: Arial, sans-serif; font-size: {font_size}px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1;">{email_svg}<span>help@uidai.gov.in</span></div>'
    g_html = f'<div style="font-family: Arial, sans-serif; font-size: {font_size}px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1;">{globe_svg}<span>www.uidai.gov.in</span></div>'

    # Insert groups
    page.insert_htmlbox(fitz.Rect(phone_x, y_top, 860, y_top + y_h), p_html)
    page.insert_htmlbox(fitz.Rect(email_x, y_top, 1680, y_top + y_h), e_html)
    page.insert_htmlbox(fitz.Rect(globe_x, y_top, 2500, y_top + y_h), g_html)

    pix = page.get_pixmap(dpi=72)
    pix.save("test_out_footer.png")
    print("Saved test_out_footer.png")

if __name__ == "__main__":
    test_footer_layout()
