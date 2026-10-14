import os
import fitz  # PyMuPDF
from PIL import Image, ImageDraw, ImageFont

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS_DIR = os.path.join(BASE_DIR, "assets")
SAMPLES_DIR = os.path.join(BASE_DIR, "samples")
TEMP_DIR = os.path.join(BASE_DIR, "temp")
os.makedirs(TEMP_DIR, exist_ok=True)
os.makedirs(SAMPLES_DIR, exist_ok=True)

def make_rotated_text_img(text, font_size=36):
    fnt = ImageFont.truetype("arialbd.ttf", font_size)
    bbox = fnt.getbbox(text)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    im = Image.new("RGBA", (tw + 24, th + 24), (255, 255, 255, 0))
    d = ImageDraw.Draw(im)
    d.text((12, 12 - bbox[1]), text, font=fnt, fill=(20, 20, 20, 255))
    return im.rotate(90, expand=True)

def generate_improved_aadhaar():
    print("=== Generating Authoritative Reference-Matched Aadhaar PDF (Vector Polish) ===")

    # Master Dimensions: 2560 x 1632 px (Aspect ratio 1.5686:1 ~ 1.57:1)
    W, H = 2560, 1632
    card_x1, card_y1 = 40, 115
    card_x2, card_y2 = 2520, 1595
    border_w = 5
    cut_y = 55
    dash_len = 36
    gap_len = 22

    qr_img_path = os.path.join(ASSETS_DIR, "qr_aadhaar_dense.png")
    if not os.path.exists(qr_img_path):
        qr_img_path = os.path.join(ASSETS_DIR, "qr_aadhaar_xml.png")

    # Red divider line position (Reference calibrated: 91.5% of card height)
    red_line_y = 1474
    red_line_h = 6

    # ========================================================
    # 1. FRONT CARD BASE
    # ========================================================
    front_base = Image.new("RGB", (W, H), (255, 255, 255))
    draw_f = ImageDraw.Draw(front_base)

    # Dashed line (Print / cut guide)
    cx = 40
    while cx < 2330:
        draw_f.line([(cx, cut_y), (min(cx + dash_len, 2330), cut_y)], fill=(20, 20, 20), width=4)
        cx += dash_len + gap_len

    # Scissor Icon (Centered on cut line, fully inside canvas bounds)
    scissor = Image.open(os.path.join(ASSETS_DIR, "scissor_icon.png")).convert("RGBA")
    sw, sh = scissor.size
    scissor_res = scissor.resize((int(sw * 1.5), int(sh * 1.5)), Image.Resampling.LANCZOS)
    front_base.paste(scissor_res, (2350, cut_y - int(scissor_res.size[1] / 2)), scissor_res)

    # Outer solid black border
    draw_f.rectangle([card_x1, card_y1, card_x2, card_y2], outline=(20, 20, 20), width=border_w)

    # Ashoka Emblem (Left)
    emblem = Image.open(os.path.join(ASSETS_DIR, "emblem_cropped.png"))
    emblem_res = emblem.resize((150, 210), Image.Resampling.LANCZOS)
    front_base.paste(emblem_res, (card_x1 + 125, card_y1 + 25))

    # Center Tricolor Banner (भारत सरकार / Government of India)
    banner_f = Image.open(os.path.join(ASSETS_DIR, "banner_front_cropped.png"))
    banner_f_res = banner_f.resize((1380, 195), Image.Resampling.LANCZOS)
    front_base.paste(banner_f_res, (card_x1 + 550, card_y1 + 35))

    # Right Sun Logo (आधार)
    sun_hindi = Image.open(os.path.join(ASSETS_DIR, "sun_logo_hindi.png"))
    sun_hindi_res = sun_hindi.resize((270, 210), Image.Resampling.LANCZOS)
    front_base.paste(sun_hindi_res, (card_x2 - 350, card_y1 + 25))

    # Left vertical text (Aadhaar no. issued: 10/08/2013)
    vert_front = make_rotated_text_img("Aadhaar no. issued: 10/08/2013", font_size=36)
    front_base.paste(vert_front, (card_x1 + 70, card_y1 + 325), vert_front)

    # Photograph - Calibrated to match Reference 1 dimensions & aspect ratio
    photo = Image.open(os.path.join(ASSETS_DIR, "raisabi_photo_card.png"))
    photo_w, photo_h = 595, 735
    photo_res = photo.resize((photo_w, photo_h), Image.Resampling.LANCZOS)
    photo_x = card_x1 + 230
    photo_y = card_y1 + 315
    draw_f.rectangle([photo_x - 2, photo_y - 2, photo_x + photo_w + 1, photo_y + photo_h + 1], outline=(200, 200, 200), width=2)
    front_base.paste(photo_res, (photo_x, photo_y))

    # Red Disclaimer Box Border (Height refined to match text bounds with balanced padding)
    box_x1 = photo_x + photo_w + 65
    box_y1 = photo_y + 375
    box_x2 = card_x2 - 60
    box_y2 = 1152
    draw_f.rectangle([box_x1, box_y1, box_x2, box_y2], outline=(201, 42, 42), width=5)

    # Full-width Red Divider Line
    draw_f.rectangle([card_x1, red_line_y, card_x2, red_line_y + red_line_h], fill=(215, 38, 56))

    front_base_path = os.path.join(TEMP_DIR, "temp_front_v6.png")
    front_base.save(front_base_path)

    # ========================================================
    # 2. BACK CARD BASE
    # ========================================================
    back_base = Image.new("RGB", (W, H), (255, 255, 255))
    draw_b = ImageDraw.Draw(back_base)

    # Dashed line
    cx = 40
    while cx < 2330:
        draw_b.line([(cx, cut_y), (min(cx + dash_len, 2330), cut_y)], fill=(20, 20, 20), width=4)
        cx += dash_len + gap_len

    # Scissor Icon
    back_base.paste(scissor_res, (2350, cut_y - int(scissor_res.size[1] / 2)), scissor_res)

    # Outer solid border
    draw_b.rectangle([card_x1, card_y1, card_x2, card_y2], outline=(20, 20, 20), width=border_w)

    # Ashoka Emblem
    back_base.paste(emblem_res, (card_x1 + 125, card_y1 + 25))

    # Center Tricolor Banner for Back - Authentic organic watercolor brush artwork
    back_banner_img = Image.open(os.path.join(ASSETS_DIR, "banner_marathi_upscaled.png"))
    back_banner_res = back_banner_img.resize((1380, 195), Image.Resampling.LANCZOS)
    back_base.paste(back_banner_res, (card_x1 + 550, card_y1 + 35))

    # Right Sun Logo (English: AADHAAR)
    sun_eng = Image.open(os.path.join(ASSETS_DIR, "sun_logo_cropped.png"))
    sun_eng_res = sun_eng.resize((270, 210), Image.Resampling.LANCZOS)
    back_base.paste(sun_eng_res, (card_x2 - 350, card_y1 + 25))

    # Left vertical text (Details as on: 03/10/2026)
    vert_back = make_rotated_text_img("Details as on: 03/10/2026", font_size=36)
    back_base.paste(vert_back, (card_x1 + 70, card_y1 + 325), vert_back)

    # Regenerated crisp QR code
    qr_img = Image.open(qr_img_path)
    qr_res = qr_img.resize((820, 820), Image.Resampling.LANCZOS)
    qr_x = card_x2 - 890
    qr_y = card_y1 + 265
    back_base.paste(qr_res, (qr_x, qr_y))

    # Dotted line between UID and VID (Reference: centered across x in [680, 1840], y = 1362)
    dot_y = 1362
    dot_x = 680
    while dot_x < 1840:
        draw_b.line([(dot_x, dot_y), (dot_x + 6, dot_y)], fill=(150, 150, 150), width=3)
        dot_x += 12

    # Red Divider Line (Reference: thickness 6px, y = 1474)
    draw_b.rectangle([card_x1, red_line_y, card_x2, red_line_y + red_line_h], fill=(215, 38, 56))

    # Vertical separators in footer band (Calibrated Reference: x=872 and x=1694, y in [1515, 1555])
    draw_b.line([(872, 1515), (872, 1555)], fill=(125, 125, 125), width=3)
    draw_b.line([(1694, 1515), (1694, 1555)], fill=(125, 125, 125), width=3)

    back_base_path = os.path.join(TEMP_DIR, "temp_back_v6.png")
    back_base.save(back_base_path)

    # ========================================================
    # 3. HIGH-DEFINITION TEXT RENDERING (PyMuPDF / HarfBuzz)
    # ========================================================

    # --- FRONT CARD ---
    doc_f = fitz.open()
    page_f = doc_f.new_page(width=W, height=H)
    page_f.insert_image(fitz.Rect(0, 0, W, H), filename=front_base_path)

    # Personal Information Block (Calibrated size & spacing beside photo)
    demographics_html = """
    <div style="font-family: 'Nirmala UI', sans-serif; color: #111111; line-height: 1.30;">
      <div style="font-size: 70px; font-weight: bold; margin-bottom: 12px; color: #000000;">रईसाबी महबूब सय्यद</div>
      <div style="font-size: 62px; font-weight: bold; margin-bottom: 14px; color: #111111;">Raisabi Mahabub Sayyad</div>
      <div style="font-size: 54px; font-weight: bold; margin-bottom: 12px; color: #111111;">जन्म तारीख/DOB: 06/06/1986</div>
      <div style="font-size: 54px; font-weight: bold; color: #111111;">महिला/ FEMALE</div>
    </div>
    """
    page_f.insert_htmlbox(fitz.Rect(photo_x + photo_w + 65, photo_y, card_x2 - 60, photo_y + 360), demographics_html)

    # Red Disclaimer Box Text (Inside the refined border, properly spaced and sized)
    disclaimer_html = """
    <div style="font-family: 'Nirmala UI', sans-serif; padding: 22px 26px; line-height: 1.30;">
      <div style="font-size: 45px; font-weight: bold; color: #000000; margin-bottom: 8px;">
        आधार हा ओळखीचा पुरावा आहे, नागरिकत्व किंवा जन्मतारखेचा नाही.
      </div>
      <div style="font-size: 39px; color: #1a1a1a; margin-bottom: 16px; line-height: 1.30;">
        हे फक्त पडताळणीसाठी वापरले जावे (ऑनलाइन प्रमाणीकरण किंवा Qr कोडचे स्कॅनिंग/ ऑफलाइन XML)
      </div>
      <div style="font-size: 43px; font-weight: bold; color: #000000; margin-bottom: 8px;">
        Aadhaar is proof of identity, not of citizenship
      </div>
      <div style="font-size: 39px; color: #1a1a1a; line-height: 1.30;">
        <span style="font-weight: bold;">or date of birth.</span> It should be used with verification (online authentication, or scanning of QR code / offline XML).
      </div>
    </div>
    """
    page_f.insert_htmlbox(fitz.Rect(box_x1, box_y1, box_x2, box_y2 + 2), disclaimer_html)

    # Front UID Number - Balanced between info box bottom (1152) and red line (1474)
    uid_front_html = """
    <div style="font-family: 'Arial', sans-serif; font-size: 130px; font-weight: bold; color: #000000; text-align: center; letter-spacing: 8px;">
      9710 &nbsp;9512 &nbsp;7245
    </div>
    """
    page_f.insert_htmlbox(fitz.Rect(card_x1, 1265, card_x2, 1425), uid_front_html)

    # Bottom Slogan (माझे आधार, माझी ओळख)
    slogan_html = """
    <div style="font-family: 'Nirmala UI', sans-serif; font-size: 86px; font-weight: bold; text-align: center; letter-spacing: 4px;">
      <span style="color: #000000;">माझे</span> &nbsp;<span style="color: #c92a2a;">आधार</span><span style="color: #000000;">, माझी ओळख</span>
    </div>
    """
    page_f.insert_htmlbox(fitz.Rect(card_x1, red_line_y + 18, card_x2, card_y2 - 6), slogan_html)

    pix_f = page_f.get_pixmap(dpi=72)
    front_final = os.path.join(ASSETS_DIR, "aadhaar_front_raisabi_final.png")
    pix_f.save(front_final)
    print(f"Saved Improved Front PNG: {front_final}")

    # --- BACK CARD ---
    doc_b = fitz.open()
    page_b = doc_b.new_page(width=W, height=H)
    page_b.insert_image(fitz.Rect(0, 0, W, H), filename=back_base_path)

    # Address Column - Preserved exact typography and positioning
    addr_html = """
    <div style="font-family: 'Nirmala UI', sans-serif; color: #111111; line-height: 1.36;">
      <div style="font-size: 58px; font-weight: bold; margin-bottom: 10px; color: #000000;">पत्ता:</div>
      <div style="font-size: 52px; font-weight: bold; color: #111111; margin-bottom: 34px;">
        विहामांडवा, बिहामांडवा,<br>
        पैठण, औरंगाबाद,<br>
        महाराष्ट्र - 431137
      </div>

      <div style="font-size: 58px; font-weight: bold; margin-bottom: 10px; color: #000000;">Address:</div>
      <div style="font-size: 52px; font-weight: bold; color: #111111;">
        Vihamandwa, Bihamandwa,<br>
        Paithan, Aurangabad,<br>
        Maharashtra - 431137
      </div>
    </div>
    """
    page_b.insert_htmlbox(fitz.Rect(card_x1 + 175, card_y1 + 265, qr_x - 30, red_line_y - 170), addr_html)

    # Back Aadhaar UID Number - Enlarged to 128px bold, centered above dotted line
    uid_back_html = """
    <div style="font-family: 'Arial', sans-serif; font-size: 128px; font-weight: bold; color: #000000; text-align: center; letter-spacing: 8px;">
      9710 &nbsp;9512 &nbsp;7245
    </div>
    """
    page_b.insert_htmlbox(fitz.Rect(card_x1, 1215, card_x2, 1350), uid_back_html)

    # Back VID Text - Sized at 60px bold, centered below dotted line
    vid_back_html = """
    <div style="font-family: 'Arial', sans-serif; font-size: 60px; font-weight: bold; color: #111111; text-align: center; letter-spacing: 2px;">
      VID : 9147 2921 5957 4916
    </div>
    """
    page_b.insert_htmlbox(fitz.Rect(card_x1, 1374, card_x2, 1460), vid_back_html)

    # Back Footer - Precision optical alignment with table centering and clipping-free vector SVGs
    phone_size = 68
    email_w = 66
    email_h = 52
    globe_size = 67
    stroke_w = 3.2
    phone_shift_y = -2
    email_shift_y = 2
    globe_shift_y = -2
    rect_y1 = 1504
    rect_y2 = 1600

    phone_svg = f'''<svg width="{phone_size}" height="{phone_size}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {phone_shift_y})"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></g></svg>'''
    email_svg = f'''<svg width="{email_w}" height="{email_h}" viewBox="0 0 24 19" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {email_shift_y})"><rect width="22" height="17" x="1" y="1" rx="1.5"></rect><path d="m23 4-11 7.5-11-7.5"></path></g></svg>'''
    globe_svg = f'''<svg width="{globe_size}" height="{globe_size}" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="{stroke_w}" stroke-linecap="round" stroke-linejoin="round"><g transform="translate(0, {globe_shift_y})"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></g></svg>'''

    td_text = 'vertical-align: middle; font-family: Arial, sans-serif; font-size: 60px; font-weight: bold; color: #111111; white-space: nowrap; line-height: 1.0;'
    td_icon = 'vertical-align: middle; line-height: 1.0;'
    tbl_style = 'border-collapse: collapse; margin: 0; padding: 0;'

    phone_html = f'''<table style="{tbl_style}"><tr>
    <td style="{td_icon}">{phone_svg}</td>
    <td style="{td_text} padding-left: 29px;">1947</td>
    </tr></table>'''

    email_html = f'''<table style="{tbl_style}"><tr>
    <td style="{td_icon}">{email_svg}</td>
    <td style="{td_text} padding-left: 30px;">help@uidai.gov.in</td>
    </tr></table>'''

    globe_html = f'''<table style="{tbl_style}"><tr>
    <td style="{td_icon}">{globe_svg}</td>
    <td style="{td_text} padding-left: 29px;">www.uidai.gov.in</td>
    </tr></table>'''

    # Horizontal group placement with verified optical baseline alignment
    page_b.insert_htmlbox(fitz.Rect(345, rect_y1, 845, rect_y2), phone_html)
    page_b.insert_htmlbox(fitz.Rect(976, rect_y1, 1676, rect_y2), email_html)
    page_b.insert_htmlbox(fitz.Rect(1805, rect_y1, 2505, rect_y2), globe_html)

    pix_b = page_b.get_pixmap(dpi=72)
    back_final = os.path.join(ASSETS_DIR, "aadhaar_back_raisabi_final.png")
    pix_b.save(back_final)
    print(f"Saved Improved Back PNG: {back_final}")

    # ========================================================
    # 4. PRINTABLE CR80 PDF (1.57:1 Aspect Ratio)
    # ========================================================
    pt_w = 242.65
    pt_h = 242.65 / (W / H) # 154.69 pt

    pdf_doc = fitz.open()

    p1 = pdf_doc.new_page(width=pt_w, height=pt_h)
    p1.insert_image(fitz.Rect(0, 0, pt_w, pt_h), filename=front_final)

    p2 = pdf_doc.new_page(width=pt_w, height=pt_h)
    p2.insert_image(fitz.Rect(0, 0, pt_w, pt_h), filename=back_final)

    pdf_final = os.path.join(SAMPLES_DIR, "aadhaar_raisabi_final_pvc.pdf")
    pdf_doc.save(pdf_final)
    print(f"Saved Verified PDF: {pdf_final}")

    try:
        os.remove(front_base_path)
        os.remove(back_base_path)
    except Exception:
        pass

    print("=== Generation Completed Successfully ===")

if __name__ == "__main__":
    generate_improved_aadhaar()
