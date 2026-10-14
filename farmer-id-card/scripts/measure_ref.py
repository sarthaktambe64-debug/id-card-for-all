from PIL import Image

def measure_sections():
    r1 = Image.open('C:/Users/sarth/.gemini/antigravity-ide/brain/22cb536e-df15-431e-aaf0-9412db7633be/.user_uploaded/media_1791866119457.png')
    # Let's crop and inspect photo bounds in r1:
    # Photo is roughly x: 110-310, y: 150-400
    # Red line in r1: search for red pixels (high R, low G, low B)
    w, h = r1.size
    red_line_y = None
    for y in range(400, h):
        p = r1.getpixel((500, y))
        if p[0] > 180 and p[1] < 50 and p[2] < 50:
            red_line_y = y
            break
    print("Front red divider y in r1:", red_line_y)

    r2 = Image.open('C:/Users/sarth/.gemini/antigravity-ide/brain/22cb536e-df15-431e-aaf0-9412db7633be/.user_uploaded/media_1791866133067.png')
    red_line_y2 = None
    for y in range(400, r2.size[1]):
        p = r2.getpixel((500, y))
        if p[0] > 180 and p[1] < 50 and p[2] < 50:
            red_line_y2 = y
            break
    print("Back red divider y in r2:", red_line_y2)

measure_sections()
