from PIL import Image

# Reference
ref = Image.open(r'C:\Users\sarth\.gemini\antigravity-ide\brain\22cb536e-df15-431e-aaf0-9412db7633be\.tempmediaStorage\media_1791873522571.png')

# Our newly rendered back page (at 300 DPI or direct PNG)
back = Image.open('public/aadhaar_back_raisabi_final.png')

# Bottom section from y=1200 to 1610 (including UID, VID, dotted line, red divider, and footer)
# Canvas width is 2560
bottom_crop = back.crop((0, 1180, 2560, 1610))
bottom_scaled = bottom_crop.resize((882, int(bottom_crop.height * (882.0 / 2560.0))), Image.Resampling.LANCZOS)

# Create comparison image
comp = Image.new('RGB', (882, ref.height + bottom_scaled.height + 20), (245, 245, 245))
comp.paste(ref, (0, 0))
comp.paste(bottom_scaled, (0, ref.height + 20))
comp.save('public/final_footer_verification_comp.png')
print('Saved public/final_footer_verification_comp.png')

# Also crop just the footer row for 1:1 overlay comparison
ref_footer = ref.crop((0, 22, 882, 66))
back_footer = back.crop((40, 1474, 2520, 1595)).resize((853, 44), Image.Resampling.LANCZOS)
canvas_back = Image.new('RGB', (882, 44), (255, 255, 255))
canvas_back.paste(back_footer, (11, 0))

comp_row = Image.new('RGB', (882, 100), (230, 230, 230))
comp_row.paste(ref_footer, (0, 0))
comp_row.paste(canvas_back, (0, 52))
comp_row.save('public/final_footer_row_comparison.png')
print('Saved public/final_footer_row_comparison.png')
