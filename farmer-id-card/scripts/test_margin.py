import fitz

doc = fitz.open()
page = doc.new_page(width=1000, height=300)

html1 = '<div style="font-size: 40px; color: black;"><svg width="50" height="50"><rect width="50" height="50" fill="red"/></svg><span style="padding-left: 50px;">TEXT1</span></div>'
html2 = '<div style="font-size: 40px; color: black;"><svg width="50" height="50" style="margin-right: 50px;"><rect width="50" height="50" fill="blue"/></svg><span>TEXT2</span></div>'
html3 = '<div style="font-size: 40px; color: black;"><svg width="50" height="50"><rect width="50" height="50" fill="green"/></svg>&nbsp;&nbsp;&nbsp;<span>TEXT3</span></div>'

page.insert_htmlbox(fitz.Rect(10, 10, 500, 70), html1)
page.insert_htmlbox(fitz.Rect(10, 80, 500, 140), html2)
page.insert_htmlbox(fitz.Rect(10, 150, 500, 210), html3)

pix = page.get_pixmap()
pix.save('test_margin_vis.png')
print('Saved test_margin_vis.png')
