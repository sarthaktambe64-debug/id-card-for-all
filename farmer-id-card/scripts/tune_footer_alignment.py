import fitz
from PIL import Image

ref = Image.open('public/check_top.png')

def measure_bounds(im):
    gray = im.convert('L')
    w, h = gray.size
    
    def get_bounds(x1, x2):
        dark = []
        for x in range(x1, x2 + 1):
            for y in range(8, 38):
                if gray.getpixel((x, y)) < 180:
                    dark.append((x, y))
        if not dark:
            return None
        min_x = min(p[0] for p in dark)
        max_x = max(p[0] for p in dark)
        min_y = min(p[1] for p in dark)
        max_y = max(p[1] for p in dark)
        return min_x, max_x, min_y, max_y, max_x - min_x + 1, max_y - min_y + 1

    return {
        'phone_icon': get_bounds(110, 145),
        'phone_text': get_bounds(146, 205),
        'email_icon': get_bounds(320, 360),
        'email_text': get_bounds(361, 555),
        'globe_icon': get_bounds(600, 645),
        'globe_text': get_bounds(646, 830),
    }

print("=== Reference Bounds ===")
ref_b = measure_bounds(ref)
for k, v in ref_b.items():
    if v:
        center_y = (v[2] + v[3]) / 2.0
        print(f"  {k:12s}: X=[{v[0]:3d}, {v[1]:3d}] W={v[4]:2d}, Y=[{v[2]:2d}, {v[3]:2d}] H={v[5]:2d}, CenterY={center_y:.1f}")

def render_footer_test(rect_y1, phone_shift, email_shift, globe_shift, stroke_w=3.2, phone_scale=1.05, vb_w=36, vb_h=28, svg_scale=1.0):
    W, H = 2560, 1634
    doc = fitz.open()
    page = doc.new_page(width=W, height=H)
    
    # Base image
    page.insert_image(fitz.Rect(0, 0, W, H), filename='public/aadhaar_back_raisabi_final.png')
    
    # Clear footer area between red divider and bottom border
    page.draw_rect(fitz.Rect(40, 1480, 2520, 1590), color=(1, 1, 1), fill=(1, 1, 1))
    
    # Separators
    sep_color = (0.5, 0.5, 0.5)
    page.draw_line(fitz.Point(872, 1495), fitz.Point(872, 1572), color=sep_color, width=2.5)
    page.draw_line(fitz.Point(1694, 1495), fitz.Point(1694, 1572), color=sep_color, width=2.5)
    
    svg_w = int(98 * svg_scale)
    svg_h = int(76 * svg_scale)
    
    # Phone SVG with slight scale if requested
    if phone_scale != 1.0:
        phone_transform = f'translate(0, {phone_shift}) scale({phone_scale}) translate({(1-phone_scale)*12:.1f}, {(1-phone_scale)*12:.1f})'
    else:
        phone_transform = f'translate(0, {phone_shift})'
        
    phone_svg = f'''<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {vb_w} {vb_h}" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="{phone_transform}"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></g></svg>'''
    email_svg = f'''<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {vb_w} {vb_h}" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {email_shift})"><rect width="22" height="17" x="1" y="2" rx="1.5"></rect><path d="m23 5-11 7.5-11-7.5"></path></g></svg>'''
    globe_svg = f'''<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {vb_w} {vb_h}" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {globe_shift})"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></g></svg>'''

    row_style = f'font-family: Arial, sans-serif; font-size: 60px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1.0;'
    phone_html = f'<div style="{row_style}">{phone_svg}<span>1947</span></div>'
    email_html = f'<div style="{row_style}">{email_svg}<span>help@uidai.gov.in</span></div>'
    globe_html = f'<div style="{row_style}">{globe_svg}<span>www.uidai.gov.in</span></div>'

    rect_y2 = rect_y1 + 98
    page.insert_htmlbox(fitz.Rect(345, rect_y1, 845, rect_y2), phone_html)
    page.insert_htmlbox(fitz.Rect(976, rect_y1, 1676, rect_y2), email_html)
    page.insert_htmlbox(fitz.Rect(1805, rect_y1, 2505, rect_y2), globe_html)

    pix = page.get_pixmap(dpi=72)
    tmp_path = 'public/test_tune_render.png'
    pix.save(tmp_path)
    
    im = Image.open(tmp_path)
    curr = im.crop((40, 1474, 2520, 1595)).resize((853, 44), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (882, 45), (255, 255, 255))
    canvas.paste(curr, (11, 0))
    return canvas

# Test baseline preservation with adjusted rect_y1
# When svg_h changes, baseline = rect_y1 + svg_h.
# If target baseline is B = 1561 canvas px (which gives text Y=[14, 29] in 882x45):
# Then rect_y1 = B - svg_h = 1561 - svg_h!

def test_fixed_baseline(svg_h, vb_h, p_shift, e_shift, g_shift, stroke_w=3.2, p_scale=1.08, e_scale=1.0, g_scale=1.0, vb_w=36):
    W, H = 2560, 1634
    doc = fitz.open()
    page = doc.new_page(width=W, height=H)
    
    page.insert_image(fitz.Rect(0, 0, W, H), filename='public/aadhaar_back_raisabi_final.png')
    page.draw_rect(fitz.Rect(40, 1480, 2520, 1590), color=(1, 1, 1), fill=(1, 1, 1))
    
    sep_color = (0.5, 0.5, 0.5)
    page.draw_line(fitz.Point(872, 1495), fitz.Point(872, 1572), color=sep_color, width=2.5)
    page.draw_line(fitz.Point(1694, 1495), fitz.Point(1694, 1572), color=sep_color, width=2.5)
    
    # Target baseline in canvas coords
    target_baseline = 1560
    rect_y1 = target_baseline - svg_h
    rect_y2 = target_baseline + 35
    
    scale = svg_h / vb_h
    svg_w = int(vb_w * scale)
    
    # Phone transform
    p_tf = f'translate(0, {p_shift})'
    if p_scale != 1.0:
        p_tf += f' scale({p_scale}) translate({(1-p_scale)*12:.1f}, {(1-p_scale)*12:.1f})'
        
    e_tf = f'translate(0, {e_shift})'
    if e_scale != 1.0:
        e_tf += f' scale({e_scale}) translate({(1-e_scale)*12:.1f}, {(1-e_scale)*12:.1f})'

    g_tf = f'translate(0, {g_shift})'
    if g_scale != 1.0:
        g_tf += f' scale({g_scale}) translate({(1-g_scale)*12:.1f}, {(1-g_scale)*12:.1f})'

    phone_svg = f'''<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {vb_w} {vb_h}" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="{p_tf}"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></g></svg>'''
    email_svg = f'''<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {vb_w} {vb_h}" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="{e_tf}"><rect width="22" height="17" x="1" y="2" rx="1.5"></rect><path d="m23 5-11 7.5-11-7.5"></path></g></svg>'''
    globe_svg = f'''<svg width="{svg_w}" height="{svg_h}" viewBox="0 0 {vb_w} {vb_h}" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="{g_tf}"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></g></svg>'''

    row_style = f'font-family: Arial, sans-serif; font-size: 60px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1.0;'
    phone_html = f'<div style="{row_style}">{phone_svg}<span>1947</span></div>'
    email_html = f'<div style="{row_style}">{email_svg}<span>help@uidai.gov.in</span></div>'
    globe_html = f'<div style="{row_style}">{globe_svg}<span>www.uidai.gov.in</span></div>'

    page.insert_htmlbox(fitz.Rect(345, rect_y1, 845, rect_y2), phone_html)
    page.insert_htmlbox(fitz.Rect(976, rect_y1, 1676, rect_y2), email_html)
    page.insert_htmlbox(fitz.Rect(1805, rect_y1, 2505, rect_y2), globe_html)

    pix = page.get_pixmap(dpi=72)
    tmp_path = 'public/test_tune_render.png'
    pix.save(tmp_path)
    
    im = Image.open(tmp_path)
    curr = im.crop((40, 1474, 2520, 1595)).resize((853, 44), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (882, 45), (255, 255, 255))
    canvas.paste(curr, (11, 0))
    return canvas

# Test with table-based optical centering!
def test_table_footer(phone_size, email_w, email_h, globe_size, stroke_w=3.2, phone_shift_y=0, email_shift_y=0, globe_shift_y=0, rect_y1=1490, pad_phone=28, pad_email=28, pad_globe=28):
    W, H = 2560, 1634
    doc = fitz.open()
    page = doc.new_page(width=W, height=H)
    
    page.insert_image(fitz.Rect(0, 0, W, H), filename='public/aadhaar_back_raisabi_final.png')
    page.draw_rect(fitz.Rect(40, 1480, 2520, 1590), color=(1, 1, 1), fill=(1, 1, 1))
    
    sep_color = (0.5, 0.5, 0.5)
    page.draw_line(fitz.Point(872, 1495), fitz.Point(872, 1572), color=sep_color, width=2.5)
    page.draw_line(fitz.Point(1694, 1495), fitz.Point(1694, 1572), color=sep_color, width=2.5)
    
    phone_svg = f'''<svg width="{phone_size}" height="{phone_size}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {phone_shift_y})"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></g></svg>'''
    email_svg = f'''<svg width="{email_w}" height="{email_h}" viewBox="0 0 24 19" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {email_shift_y})"><rect width="22" height="17" x="1" y="1" rx="1.5"></rect><path d="m23 4-11 7.5-11-7.5"></path></g></svg>'''
    globe_svg = f'''<svg width="{globe_size}" height="{globe_size}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {globe_shift_y})"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></g></svg>'''

    td_text = 'vertical-align: middle; font-family: Arial, sans-serif; font-size: 60px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1.0;'
    td_icon = 'vertical-align: middle; line-height: 1.0;'
    tbl_style = 'border-collapse: collapse; margin: 0; padding: 0;'

    phone_html = f'''<table style="{tbl_style}"><tr>
    <td style="{td_icon}">{phone_svg}</td>
    <td style="{td_text} padding-left: {pad_phone}px;">1947</td>
    </tr></table>'''

    email_html = f'''<table style="{tbl_style}"><tr>
    <td style="{td_icon}">{email_svg}</td>
    <td style="{td_text} padding-left: {pad_email}px;">help@uidai.gov.in</td>
    </tr></table>'''

    globe_html = f'''<table style="{tbl_style}"><tr>
    <td style="{td_icon}">{globe_svg}</td>
    <td style="{td_text} padding-left: {pad_globe}px;">www.uidai.gov.in</td>
    </tr></table>'''

    rect_y2 = rect_y1 + 95
    page.insert_htmlbox(fitz.Rect(345, rect_y1, 845, rect_y2), phone_html)
    page.insert_htmlbox(fitz.Rect(976, rect_y1, 1676, rect_y2), email_html)
    page.insert_htmlbox(fitz.Rect(1805, rect_y1, 2505, rect_y2), globe_html)

    pix = page.get_pixmap(dpi=72)
    tmp_path = 'public/test_table_render.png'
    pix.save(tmp_path)
    
    im = Image.open(tmp_path)
    curr = im.crop((40, 1474, 2520, 1595)).resize((853, 44), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (882, 45), (255, 255, 255))
    canvas.paste(curr, (11, 0))
    return canvas

print("\n=== Testing Table Optical Centering ===")
table_tests = [
    # (name, phone_size, email_w, email_h, globe_size, stroke_w, p_shift, e_shift, g_shift, rect_y1, pad_p, pad_e, pad_g)
    ("tbl1_s62_y1486", 64, 64, 50, 64, 3.2, 0, 0, 0, 1486, 30, 30, 30),
    ("tbl2_s64_y1487", 65, 65, 51, 65, 3.2, 0, 0, 0, 1487, 30, 30, 30),
    ("tbl3_s64_y1488", 66, 66, 52, 66, 3.2, 0, 0, 0, 1488, 30, 30, 30),
]

for name, ps, ew, eh, gs, sw, py, ey, gy, ry, pp, pe, pg in table_tests:
    im_c = test_table_footer(phone_size=ps, email_w=ew, email_h=eh, globe_size=gs, stroke_w=sw, phone_shift_y=py, email_shift_y=ey, globe_shift_y=gy, rect_y1=ry, pad_phone=pp, pad_email=pe, pad_globe=pg)
    b = measure_bounds(im_c)
    print(f"\n--- {name} ---")
    for k, v in b.items():
        if v:
            cy = (v[2] + v[3]) / 2.0
            ref_v = ref_b[k]
            ref_cy = (ref_v[2] + ref_v[3]) / 2.0
            print(f"  {k:12s}: Y=[{v[2]:2d}, {v[3]:2d}] H={v[5]:2d} W={v[4]:2d} Cy={cy:.1f} (Ref: Y=[{ref_v[2]:2d}, {ref_v[3]:2d}] H={ref_v[5]:2d} W={ref_v[4]:2d} Cy={ref_cy:.1f})")

    comp = Image.new('RGB', (882, 100), (230, 230, 230))
    comp.paste(ref, (0, 0))
    comp.paste(im_c, (0, 52))
    comp.save(f'public/comp_{name}.png')







