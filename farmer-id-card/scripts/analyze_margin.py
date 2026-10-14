from PIL import Image

im = Image.open('test_margin_vis.png')

# Line 1: y around 35
# Line 2: y around 105
# Line 3: y around 175

for y_val, name in [(35, 'padding-left: 50px'), (105, 'margin-right: 50px'), (175, '&nbsp;&nbsp;&nbsp;')]:
    # find where red/blue/green box is
    box_x = [x for x in range(10, 100) if im.getpixel((x, y_val)) != (255, 255, 255)]
    text_x = [x for x in range(60, 300) if im.getpixel((x, y_val)) != (255, 255, 255)]
    print(f'{name}: box end={max(box_x)}, text start={min(text_x)}, gap={min(text_x) - max(box_x)}')
