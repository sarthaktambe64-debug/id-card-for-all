import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { addPrintRecord } from './db.js';

/**
 * cardExportService.js
 *
 * Dedicated Export & Printing Engine for Farmer ID Card:
 * - Direct isolated browser printing via dedicated iframe (85.6 mm × 54.0 mm)
 * - 100% immune to Chrome "Background graphics" checkbox (renders card background as foreground image)
 * - Zero application UI, dark background, or dashboard artifacts printed
 * - 300 DPI equivalent PNG raster export (~1011 × 638 px)
 * - High-quality 0.95 JPEG export (~1011 × 638 px)
 * - System Clipboard image copying via navigator.clipboard.write
 * - CR80 exact physical PDF export (85.6 mm × 54.0 mm landscape)
 * - Front, Back, and Dual-Sided (Page 1 Front, Page 2 Back) support
 */

/**
 * Standard Physical CR80 Dimensions & Logical Rendering Constants
 */
export const CR80_PHYSICAL = {
  widthMm: 85.6,
  heightMm: 54.0,
  ratio: 85.6 / 54.0, // ~1.585185
  dpi300WidthPx: 1011, // Math.round(85.6 / 25.4 * 300) = 1011
  dpi300HeightPx: 638  // Math.round(54.0 / 25.4 * 300) = 638
};

export const CARD_LOGICAL_WIDTH_PX = 856;
export const CARD_LOGICAL_HEIGHT_PX = 540;
export const CARD_BORDER_RADIUS_PX = 32; // 3.2 mm at 10:1 physical scale
export const CARD_BORDER_RADIUS_MM = 3.2;

/**
 * Mathematical Rounded Rectangle Path Generator
 * Strictly creates corner arcs matching the physical card geometry.
 */
export function createRoundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, width, height, radius);
  } else {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + r, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x + r, y);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
}

/**
 * Find the card DOM element for a given side ('front' | 'back')
 */
export function getCardDOMElement(side = 'front') {
  if (typeof document === 'undefined') return null;
  // Look for card-inner with data-card-side attribute or within container
  const el = document.querySelector(`.card-inner[data-card-side="${side}"]`) ||
             document.querySelector(`[data-card-side="${side}"] .card-inner`) ||
             document.querySelector(`#card-render-${side} .card-inner`);
  return el;
}

/**
 * Render a card side directly to a high-resolution canvas with REAL ROUNDED CLIPPING.
 * - Guaranteed to capture background, fonts, photos, QR, land table, and text
 * - Clips all content to the exact 3.2mm (32px proportional) rounded rectangle
 * - Corners outside the card are 100% transparent for PNG & Clipboard
 * - Corners outside the card are clean white (#FFFFFF) for JPG
 */
export async function renderCardToCanvas(side = 'front', options = {}) {
  if (typeof document === 'undefined') {
    throw new Error('renderCardToCanvas can only run in a browser environment');
  }

  // Ensure all web fonts (Mukta, Noto Sans Devanagari, Outfit, etc.) are fully loaded
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const cardElement = options.element || getCardDOMElement(side);
  if (!cardElement) {
    throw new Error(`Could not find card DOM element for side "${side}". Make sure the card is rendered.`);
  }

  const targetWidth = options.targetWidth || CR80_PHYSICAL.dpi300WidthPx; // 1011 px
  const targetHeight = options.targetHeight || CR80_PHYSICAL.dpi300HeightPx; // 638 px

  // Scale corner radius proportionally to target dimensions
  // Standard card is 856 x 540 with 32px radius (3.2 mm)
  const cornerRadius = options.borderRadius ?? Math.round((CARD_BORDER_RADIUS_PX / CARD_LOGICAL_WIDTH_PX) * targetWidth);

  // Supersampling factor for extreme vector-like clarity
  const supersampleScale = options.scale || 2.5;

  const rawCanvas = await html2canvas(cardElement, {
    scale: supersampleScale,
    useCORS: true,
    logging: false,
    backgroundColor: null, // CRITICAL: Transparent background, NEVER rectangular cream!
    onclone: (clonedDoc, clonedElement) => {
      // Find card-inner in cloned document
      const inner = clonedElement.classList.contains('card-inner')
        ? clonedElement
        : clonedElement.querySelector('.card-inner');

      if (inner) {
        // Reset CSS transform and shadow so it renders flat and true
        inner.style.transform = 'none';
        inner.style.boxShadow = 'none';
        inner.style.margin = '0';
      }
    }
  });

  const finalCanvas = document.createElement('canvas');
  finalCanvas.width = targetWidth;
  finalCanvas.height = targetHeight;
  const ctx = finalCanvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const isJpg = options.format === 'jpg' || options.format === 'jpeg' || options.mimeType === 'image/jpeg';

  if (isJpg) {
    // For JPG, background outside the rounded card is pure white
    ctx.fillStyle = options.outsideBackground || '#FFFFFF';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
  } else {
    // For PNG and System Clipboard, ensure crystal-clear transparency (alpha = 0)
    ctx.clearRect(0, 0, targetWidth, targetHeight);
  }

  // 1. Clip canvas context to the exact card rounded-rectangle path
  ctx.save();
  createRoundedRectPath(ctx, 0, 0, targetWidth, targetHeight, cornerRadius);
  ctx.clip();

  // 2. Render the entire card inside the clipped region
  ctx.drawImage(rawCanvas, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  // 3. Render the authoritative outer card border along the exact rounded geometry
  ctx.save();
  const borderWidth = options.borderWidth ?? Math.max(1, (targetWidth / CARD_LOGICAL_WIDTH_PX) * 1.0);
  const halfBorder = borderWidth / 2;
  createRoundedRectPath(
    ctx,
    halfBorder,
    halfBorder,
    targetWidth - borderWidth,
    targetHeight - borderWidth,
    Math.max(0, cornerRadius - halfBorder)
  );
  ctx.strokeStyle = options.borderColor || '#DCE7D7';
  ctx.lineWidth = borderWidth;
  ctx.stroke();
  ctx.restore();

  return finalCanvas;
}

/**
 * Trigger browser file download from Canvas
 */
export function downloadCanvas(canvas, filename, mimeType = 'image/png', quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create image blob from canvas'));
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          resolve({ filename, sizeBytes: blob.size });
        }, 100);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Download High-Resolution 300-DPI PNG (1011 × 638 px)
 * Preserves 100% transparent corners outside the rounded card.
 */
export async function downloadCardPNG(side = 'front', farmer = null, customFilename = '') {
  const canvas = await renderCardToCanvas(side, { exact300Dpi: true, format: 'png' });
  const fId = farmer?.farmer_id || 'card';
  const name = farmer?.name_english?.replace(/[^a-zA-Z0-9]/g, '_') || 'farmer';
  const filename = customFilename || `Farmer_ID_${fId}_${side.toUpperCase()}_300DPI.png`;

  return await downloadCanvas(canvas, filename, 'image/png');
}

/**
 * Download High-Quality JPEG (0.95 Quality, 1011 × 638 px)
 * Renders white outside the rounded card, preserving the rounded card shape.
 */
export async function downloadCardJPG(side = 'front', farmer = null, customFilename = '') {
  const canvas = await renderCardToCanvas(side, { exact300Dpi: true, format: 'jpg' });
  const fId = farmer?.farmer_id || 'card';
  const filename = customFilename || `Farmer_ID_${fId}_${side.toUpperCase()}_300DPI.jpg`;

  return await downloadCanvas(canvas, filename, 'image/jpeg', 0.95);
}

/**
 * Copy Card to System Clipboard as PNG Image with TRUE ROUNDED CORNERS.
 * Outside corners are 100% transparent.
 */
export async function copyCardImageToClipboard(side = 'front', farmer = null) {
  try {
    const canvas = await renderCardToCanvas(side, { exact300Dpi: true, format: 'png' });

    if (
      typeof navigator !== 'undefined' &&
      navigator.clipboard &&
      typeof window.ClipboardItem !== 'undefined'
    ) {
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Failed to generate image blob');

      const item = new window.ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);

      return {
        success: true,
        message: `${side.toUpperCase()} card copied to clipboard as image with rounded corners! You can now paste (Ctrl+V) into Word, WhatsApp, Paint, etc.`
      };
    } else {
      // Fallback: download PNG so user still receives the image
      const filename = `Farmer_ID_${farmer?.farmer_id || 'card'}_${side}.png`;
      await downloadCanvas(canvas, filename, 'image/png');
      return {
        success: false,
        fallbackDownloaded: true,
        message: 'Direct image clipboard copy is not supported in this browser. Card was downloaded as PNG instead.'
      };
    }
  } catch (err) {
    console.warn('Clipboard write error:', err);
    // Attempt fallback download
    try {
      const canvas = await renderCardToCanvas(side, { exact300Dpi: true, format: 'png' });
      const filename = `Farmer_ID_${farmer?.farmer_id || 'card'}_${side}.png`;
      await downloadCanvas(canvas, filename, 'image/png');
      return {
        success: false,
        fallbackDownloaded: true,
        message: 'Clipboard permission blocked. Card was downloaded as PNG instead.'
      };
    } catch (e) {
      return {
        success: false,
        message: `Failed to copy card image: ${err.message}`
      };
    }
  }
}

/**
 * Export Exact CR80 Physical PDF (85.6 mm × 54.0 mm)
 * Sides: 'front' | 'back' | 'both'
 */
export async function exportCardPDF({ sides = 'both', farmer = null, template = null }) {
  const fId = farmer?.farmer_id || 'card';
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [CR80_PHYSICAL.widthMm, CR80_PHYSICAL.heightMm]
  });

  if (sides === 'front' || sides === 'both') {
    const frontCanvas = await renderCardToCanvas('front', { exact300Dpi: true });
    const frontImg = frontCanvas.toDataURL('image/png');
    pdf.addImage(frontImg, 'PNG', 0, 0, CR80_PHYSICAL.widthMm, CR80_PHYSICAL.heightMm, undefined, 'FAST');
  }

  if (sides === 'both') {
    pdf.addPage([CR80_PHYSICAL.widthMm, CR80_PHYSICAL.heightMm], 'landscape');
  }

  if (sides === 'back' || sides === 'both') {
    const backCanvas = await renderCardToCanvas('back', { exact300Dpi: true });
    const backImg = backCanvas.toDataURL('image/png');
    pdf.addImage(backImg, 'PNG', 0, 0, CR80_PHYSICAL.widthMm, CR80_PHYSICAL.heightMm, undefined, 'FAST');
  }

  const filename = `Farmer_ID_${fId}_${sides.toUpperCase()}_CR80.pdf`;
  pdf.save(filename);

  if (farmer) {
    await addPrintRecord({
      farmerId: farmer.id,
      farmerName: farmer.name_english || 'Farmer',
      farmerIdNumber: farmer.farmer_id || '',
      village: farmer.village || '',
      templateId: template?.templateId || 'farmer-id-card-v1',
      templateName: template?.name || 'Farmer ID Card',
      layout: sides
    });
  }

  return { success: true, filename };
}

/**
 * Dedicated Direct Browser Print Workflow:
 * - Renders isolated 300 DPI card images
 * - Embeds inside dedicated print document with @page { size: 85.6mm 54mm; margin: 0; }
 * - Uses <img> tags so browser NEVER strips card background
 * - Completely bypasses application UI, dark theme, and buttons
 */
export async function printDedicatedCard({ sides = 'both', farmer = null, template = null }) {
  let frontImgData = null;
  let backImgData = null;

  if (sides === 'front' || sides === 'both') {
    const frontCanvas = await renderCardToCanvas('front', { exact300Dpi: true });
    frontImgData = frontCanvas.toDataURL('image/png');
  }

  if (sides === 'back' || sides === 'both') {
    const backCanvas = await renderCardToCanvas('back', { exact300Dpi: true });
    backImgData = backCanvas.toDataURL('image/png');
  }

  const printHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Farmer ID Card - ${farmer?.name_english || 'Print'}</title>
  <style>
    @page {
      size: 85.6mm 54mm;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 85.6mm;
      height: 54mm;
      margin: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      overflow: hidden;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    .print-card-page {
      width: 85.6mm;
      height: 54mm;
      max-width: 85.6mm;
      max-height: 54mm;
      page-break-after: always;
      break-after: page;
      margin: 0;
      padding: 0;
      position: relative;
      overflow: hidden;
      display: block;
    }
    .print-card-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }
    img.card-print-image {
      width: 85.6mm;
      height: 54mm;
      max-width: 85.6mm;
      max-height: 54mm;
      display: block;
      margin: 0;
      padding: 0;
      border: none;
      object-fit: fill;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
  </style>
</head>
<body>
  ${frontImgData ? `
  <div class="print-card-page">
    <img class="card-print-image" src="${frontImgData}" alt="Farmer ID Front" />
  </div>
  ` : ''}
  ${backImgData ? `
  <div class="print-card-page">
    <img class="card-print-image" src="${backImgData}" alt="Farmer ID Back" />
  </div>
  ` : ''}
</body>
</html>`;

  // Create isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentWindow.document;
  iframeDoc.open();
  iframeDoc.write(printHtml);
  iframeDoc.close();

  if (farmer) {
    await addPrintRecord({
      farmerId: farmer.id,
      farmerName: farmer.name_english || 'Farmer',
      farmerIdNumber: farmer.farmer_id || '',
      village: farmer.village || '',
      templateId: template?.templateId || 'farmer-id-card-v1',
      templateName: template?.name || 'Farmer ID Card',
      layout: sides
    });
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        resolve({ success: true, sides });
      }, 2000);
    }, 350);
  });
}
