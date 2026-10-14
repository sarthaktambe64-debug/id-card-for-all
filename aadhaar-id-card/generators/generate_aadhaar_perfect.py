import fitz

doc = fitz.open()
page = doc.new_page(width=800, height=350)

html = """
<div style="font-family: sans-serif; font-size: 26px; color: #222; line-height: 1.5;">
  <p style="font-size: 32px; font-weight: bold; margin: 0;">रईसाबी महबूब सय्यद</p>
  <p style="font-size: 28px; font-weight: bold; margin: 0;">Raisabi Mahabub Sayyad</p>
  <p style="font-size: 24px; margin: 0;">पत्ता: विहामांडवा, बिहामांडवा, औरंगाबाद, पैठण, महाराष्ट्र, 431137</p>
</div>
"""

page.insert_htmlbox(page.rect, html)
pix = page.get_pixmap(dpi=150)
import os`nout_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "samples")`npix.save(os.path.join(out_dir, "test_htmlbox.png"))
print("Saved test_htmlbox.png successfully")

