import os
import fitz
from PIL import Image, ImageDraw

def create_aadhaar_card():
    print("Starting Aadhaar Card Generation for Raisabi Mahabub Sayyad...")

    # Load templates
    front_tmpl = Image.open(os.path.join(ASSETS_DIR, "front_template_raw.png")).convert("RGB")
    back_tmpl = Image.open(os.path.join(ASSETS_DIR, "back_template_raw.png")).convert("RGB")

    card_w, card_h = front_tmpl.size # 2484 x 1509

    # ==========================================
    # 1. FRONT CARD PREPARATION
    # ==========================================
    draw_f = ImageDraw.Draw(front_tmpl)

    # A. Clear old text area (x: 680 to 1870, y: 430 to 1115)
    draw_f.rectangle([680, 430, 1870, 1115], fill=(255, 255, 255))

    # B. Clear old QR area (x: 1860 to 2390, y: 680 to 1238)
    draw_f.rectangle([1860, 680, 2390, 1238], fill=(255, 255, 255))

    # C. Clear old UID area (x: 650 to 1850, y: 1120 to 1238)
    draw_f.rectangle([650, 1120, 1850, 1238], fill=(255, 255, 255))

    # D. Paste User Photo (560 x 580)
    photo = Image.open(os.path.join(ASSETS_DIR, "raisabi_photo_card.png"))
    # Draw clean 1px card photo outline
    draw_f.rectangle([129, 434, 691, 1016], outline=(205, 210, 208), width=2)
    front_tmpl.paste(photo, (130, 435))

    # E. Paste Clean User QR (size: 490 x 490)
    user_qr = Image.open(os.path.join(ASSETS_DIR, "user_qr_clean_final.png"))
    user_qr_resized = user_qr.resize((490, 490), Image.Resampling.LANCZOS)
    front_tmpl.paste(user_qr_resized, (1885, 715))

    # Save intermediate front image to draw text onto with PyMuPDF
    front_tmpl.save(os.path.join(TEMP_DIR, "temp_front_base.png"))

    # ==========================================
    # 2. BACK CARD PREPARATION
    # ==========================================
    draw_b = ImageDraw.Draw(back_tmpl)

    # A. Clear Address area (x: 120 to 2400, y: 430 to 1115)
    draw_b.rectangle([120, 430, 2400, 1115], fill=(255, 255, 255))

    # B. Clear old UID area (x: 650 to 1850, y: 1120 to 1238)
    draw_b.rectangle([650, 1120, 1850, 1238], fill=(255, 255, 255))

    # C. Clear old contact text (y: 1420 to 1495)
    draw_b.rectangle([80, 1420, 680, 1495], fill=(255, 255, 255))    # Phone
    draw_b.rectangle([780, 1420, 1680, 1495], fill=(255, 255, 255))  # Email
    draw_b.rectangle([1680, 1420, 2440, 1495], fill=(255, 255, 255)) # Website

    back_tmpl.save(os.path.join(TEMP_DIR, "temp_back_base.png"))

    # ==========================================
    # 3. PYMUPDF HIGH DEFINITION TEXT RENDERING
    # ==========================================

    # --- Render FRONT Card ---
    doc_f = fitz.open()
    page_f = doc_f.new_page(width=card_w, height=card_h)
    page_f.insert_image(fitz.Rect(0, 0, card_w, card_h), filename=os.path.join(TEMP_DIR, "temp_front_base.png"))

    # Front Details HTML Box
    front_details_html = """
    <div style="font-family: 'Nirmala UI', sans-serif; color: #222222; line-height: 1.38;">
      <div style="font-size: 58px; font-weight: bold; margin-bottom: 14px; color: #181a19;">रईसाबी महबूब सय्यद</div>
      <div style="font-size: 52px; font-weight: bold; margin-bottom: 16px; color: #222222;">Raisabi Mahabub Sayyad</div>
      <div style="font-size: 46px; font-weight: bold; margin-bottom: 14px; color: #222222;">जन्म तारीख / DOB: 06/06/1986</div>
      <div style="font-size: 46px; font-weight: bold; color: #222222;">महिला / Female</div>
    </div>
    """
    page_f.insert_htmlbox(fitz.Rect(735, 445, 1860, 1100), front_details_html)

    # Front UID Number HTML Box
    uid_html = """
    <div style="font-family: 'Arial', sans-serif; font-size: 96px; font-weight: bold; color: #111111; text-align: center; letter-spacing: 5px;">
      9710 &nbsp;9512 &nbsp;7245
    </div>
    """
    page_f.insert_htmlbox(fitz.Rect(500, 1130, 2000, 1238), uid_html)

    # Render Front to ultra high-res Pixmap (1:1 pixel exact 2484 x 1509)
    pix_f = page_f.get_pixmap(dpi=72)
    pix_f.save(os.path.join(ASSETS_DIR, "aadhaar_front_raisabi_hd.png"))
    print("Saved: aadhaar_front_raisabi_hd.png")

    # --- Render BACK Card ---
    doc_b = fitz.open()
    page_b = doc_b.new_page(width=card_w, height=card_h)
    page_b.insert_image(fitz.Rect(0, 0, card_w, card_h), filename=os.path.join(TEMP_DIR, "temp_back_base.png"))

    # Back Address Left Column (Marathi)
    back_marathi_addr_html = """
    <div style="font-family: 'Nirmala UI', sans-serif; color: #222222; line-height: 1.48;">
      <div style="font-size: 52px; font-weight: bold; margin-bottom: 14px; color: #111111;">पत्ता:</div>
      <div style="font-size: 46px; font-weight: bold; color: #262626;">विहामांडवा, बिहामांडवा,</div>
      <div style="font-size: 46px; font-weight: bold; color: #262626;">पैठण, औरंगाबाद,</div>
      <div style="font-size: 46px; font-weight: bold; color: #262626;">महाराष्ट्र, 431137</div>
    </div>
    """
    page_b.insert_htmlbox(fitz.Rect(165, 445, 1200, 1100), back_marathi_addr_html)

    # Back Address Right Column (English)
    back_eng_addr_html = """
    <div style="font-family: 'Nirmala UI', sans-serif; color: #222222; line-height: 1.48;">
      <div style="font-size: 52px; font-weight: bold; margin-bottom: 14px; color: #111111;">Address:</div>
      <div style="font-size: 46px; font-weight: bold; color: #262626;">Vihamandwa, Bihamandwa,</div>
      <div style="font-size: 46px; font-weight: bold; color: #262626;">Paithan, Aurangabad,</div>
      <div style="font-size: 46px; font-weight: bold; color: #262626;">Maharashtra, 431137</div>
    </div>
    """
    page_b.insert_htmlbox(fitz.Rect(1310, 445, 2380, 1100), back_eng_addr_html)

    # Back UID Number HTML Box
    page_b.insert_htmlbox(fitz.Rect(500, 1130, 2000, 1238), uid_html)

    # Footer Contacts HTML Box
    phone_html = """<div style="font-family: 'Arial', sans-serif; font-size: 38px; font-weight: bold; color: #222222; text-align: center;">1947</div>"""
    email_html = """<div style="font-family: 'Arial', sans-serif; font-size: 38px; font-weight: bold; color: #222222; text-align: center;">help@uidai.gov.in</div>"""
    web_html = """<div style="font-family: 'Arial', sans-serif; font-size: 38px; font-weight: bold; color: #222222; text-align: center;">www.uidai.gov.in</div>"""

    page_b.insert_htmlbox(fitz.Rect(100, 1435, 630, 1495), phone_html)
    page_b.insert_htmlbox(fitz.Rect(800, 1435, 1620, 1495), email_html)
    page_b.insert_htmlbox(fitz.Rect(1690, 1435, 2450, 1495), web_html)

    pix_b = page_b.get_pixmap(dpi=72)
    pix_b.save(os.path.join(ASSETS_DIR, "aadhaar_back_raisabi_hd.png"))
    print("Saved: aadhaar_back_raisabi_hd.png")

    # ==========================================
    # 4. GENERATE PRINT-READY PDF (CR80 PVC standard 85.6 x 53.98 mm)
    # ==========================================
    # 85.60 mm = 242.64 pt, 53.98 mm = 153.02 pt
    pt_w = 85.60 * 72 / 25.4
    pt_h = 53.98 * 72 / 25.4

    pdf_doc = fitz.open()

    # Page 1: Front
    pdf_page1 = pdf_doc.new_page(width=pt_w, height=pt_h)
    pdf_page1.insert_image(fitz.Rect(0, 0, pt_w, pt_h), filename=os.path.join(ASSETS_DIR, "aadhaar_front_raisabi_hd.png"))

    # Page 2: Back
    pdf_page2 = pdf_doc.new_page(width=pt_w, height=pt_h)
    pdf_page2.insert_image(fitz.Rect(0, 0, pt_w, pt_h), filename=os.path.join(ASSETS_DIR, "aadhaar_back_raisabi_hd.png"))

    pdf_path = os.path.join(SAMPLES_DIR, "aadhaar_raisabi_pvc_card.pdf")
    pdf_doc.save(pdf_path)
    print(f"Saved printable PDF: {pdf_path}")

    # Clean up temp base images
    try:
        os.remove(os.path.join(TEMP_DIR, "temp_front_base.png"))
        os.remove(os.path.join(TEMP_DIR, "temp_back_base.png"))
    except Exception:
        pass

    print("ALL AADHAAR ASSETS GENERATED SUCCESSFULLY!")

if __name__ == "__main__":
    create_aadhaar_card()
