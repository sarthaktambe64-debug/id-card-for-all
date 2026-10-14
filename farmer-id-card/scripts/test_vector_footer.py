import fitz

doc = fitz.open()
page = doc.new_page(width=2560, height=200)

phone_svg = '''<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -6px; margin-right: 14px;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>'''

email_svg = '''<svg width="50" height="46" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -6px; margin-right: 14px;"><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>'''

globe_svg = '''<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="#111111" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -6px; margin-right: 14px;"><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>'''

footer_table_html = f"""
<table style="width: 2400px; margin: 0 auto; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 46px; font-weight: bold; color: #111111;">
  <tr>
    <td style="width: 28%; text-align: center; vertical-align: middle; white-space: nowrap;">
      {phone_svg}<span>1947</span>
    </td>
    <td style="width: 4%; text-align: center; vertical-align: middle; color: #aaaaaa; font-weight: normal; font-size: 46px;">
      |
    </td>
    <td style="width: 36%; text-align: center; vertical-align: middle; white-space: nowrap;">
      {email_svg}<span>help@uidai.gov.in</span>
    </td>
    <td style="width: 4%; text-align: center; vertical-align: middle; color: #aaaaaa; font-weight: normal; font-size: 46px;">
      |
    </td>
    <td style="width: 28%; text-align: center; vertical-align: middle; white-space: nowrap;">
      {globe_svg}<span>www.uidai.gov.in</span>
    </td>
  </tr>
</table>
"""

page.insert_htmlbox(fitz.Rect(80, 40, 2480, 160), footer_table_html)
page.get_pixmap(dpi=150).save("test_vector_footer.png")
print("Saved test_vector_footer.png with table")
