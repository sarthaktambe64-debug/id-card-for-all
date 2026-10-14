import fitz

def inspect_pdf(path):
    print('=== Inspecting', path, '===')
    doc = fitz.open(path)
    print('Page count:', len(doc))
    for i, page in enumerate(doc):
        rect = page.rect
        mediabox = page.mediabox
        cropbox = page.cropbox
        print(f'Page {i+1}: rect={rect}, mediabox={mediabox}, cropbox={cropbox}')
        print(f'Width (pt): {rect.width:.2f}, Height (pt): {rect.height:.2f}, Aspect: {rect.width/rect.height:.4f}')
        print(f'Width (mm): {rect.width * 25.4 / 72:.2f}, Height (mm): {rect.height * 25.4 / 72:.2f}')
        images = page.get_images()
        for img in images:
            xref = img[0]
            base_img = doc.extract_image(xref)
            w = base_img["width"]
            h = base_img["height"]
            print(f'  Embedded image: {w}x{h}, aspect: {w/h:.4f}')

inspect_pdf('public/aadhaar_raisabi_pvc_card.pdf')
inspect_pdf('public/aadhaar_raisabi_final_pvc.pdf')
