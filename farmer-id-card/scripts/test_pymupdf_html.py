import fitz

doc = fitz.open()
page = doc.new_page(width=1000, height=500)

# Test 1: inline svg with vertical-align: -10px
h1 = '''<div style="font-family: Arial; font-size: 60px; line-height: 1.0;">
<svg width="60" height="60" viewBox="0 0 24 24" style="vertical-align: -10px;"><circle cx="12" cy="12" r="10" stroke="black" stroke-width="2" fill="none"/></svg>
<span>1947</span>
</div>'''

# Test 2: table with vertical-align: middle
h2 = '''<table style="border-collapse: collapse; font-family: Arial; font-size: 60px; line-height: 1.0;">
<tr>
<td style="vertical-align: middle;"><svg width="60" height="60" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="black" stroke-width="2" fill="none"/></svg></td>
<td style="vertical-align: middle; padding-left: 20px;"><span>1947</span></td>
</tr>
</table>'''

page.insert_htmlbox(fitz.Rect(50, 50, 450, 150), h1)
page.insert_htmlbox(fitz.Rect(50, 200, 450, 300), h2)

pix = page.get_pixmap(dpi=72)
pix.save('public/test_pymupdf_html.png')
print('Rendered test_pymupdf_html.png')
