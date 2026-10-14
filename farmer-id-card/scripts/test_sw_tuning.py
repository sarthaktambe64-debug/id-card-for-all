import fitz
from PIL import Image, ImageDraw

def test_stroke_weight_and_gap(stroke_w=3.2, vb_w=36):
    doc = fitz.open()
    page = doc.new_page(width=2560, height=1632)

    pix_bg = Image.new("RGB", (2560, 1632), (255, 255, 255))
    d = ImageDraw.Draw(pix_bg)
    d.rectangle([40, 115, 2520, 1595], outline=(20, 20, 20), width=5)
    d.rectangle([40, 1474, 2520, 1480], fill=(215, 38, 56))
    d.line([(872, 1515), (872, 1555)], fill=(125, 125, 125), width=3)
    d.line([(1694, 1515), (1694, 1555)], fill=(125, 125, 125), width=3)
    pix_bg.save("temp_sw_bg.png")

    page.insert_image(fitz.Rect(0, 0, 2560, 1632), filename="temp_sw_bg.png")

    svg_w = int(104 * (vb_w / 38))
    svg_h = 76
    vb_h = 28
    phone_shift = 7
    email_shift = 8
    globe_shift = 7
    rect_y1 = 1490
    rect_y2 = 1588

    phone_svg = f'''<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {vb_w} {vb_h}" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {phone_shift})"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></g></svg>'''
    email_svg = f'''<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {vb_w} {vb_h}" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {email_shift})"><rect width="22" height="17" x="1" y="2" rx="1.5"></rect><path d="m23 5-11 7.5-11-7.5"></path></g></svg>'''
    globe_svg = f'''<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {vb_w} {vb_h}" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {globe_shift})"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></g></svg>'''

    row_style = f'font-family: Arial, sans-serif; font-size: 60px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1.0;'

    p_html = f'<div style="{row_style}">{phone_svg}<span>1947</span></div>'
    e_html = f'<div style="{row_style}">{email_svg}<span>help@uidai.gov.in</span></div>'
    g_html = f'<div style="{row_style}">{globe_svg}<span>www.uidai.gov.in</span></div>'

    page.insert_htmlbox(fitz.Rect(345, rect_y1, 845, rect_y2), p_html)
    page.insert_htmlbox(fitz.Rect(976, rect_y1, 1676, rect_y2), e_html)
    page.insert_htmlbox(fitz.Rect(1805, rect_y1, 2505, rect_y2), g_html)

    pix = page.get_pixmap(dpi=72)
    pix.save("temp_sw_out.png")

    out = Image.open('temp_sw_out.png')
    curr_footer = out.crop((40, 1474, 2520, 1595)).resize((853, 44), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (882, 45), (255, 255, 255))
    canvas.paste(curr_footer, (11, 0))

    ref = Image.open(r'C:\Users\sarth\.gemini\antigravity-ide\brain\22cb536e-df15-431e-aaf0-9412db7633be\.tempmediaStorage\media_1791880248680.png').crop((0, 0, 882, 45))
    comp = Image.new('RGB', (882, 100), (230, 230, 230))
    comp.paste(ref, (0, 0))
    comp.paste(canvas, (0, 52))
    comp.save(f'sw_comp_{stroke_w}_{vb_w}.png')
    print(f'Saved sw_comp_{stroke_w}_{vb_w}.png')

for sw in [3.0, 3.2]:
    for vw in [36, 37]:
        test_stroke_weight_and_gap(sw, vw)
