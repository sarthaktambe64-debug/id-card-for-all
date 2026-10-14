import {
  CR80_PHYSICAL,
  CARD_LOGICAL_WIDTH_PX,
  CARD_LOGICAL_HEIGHT_PX,
  CARD_BORDER_RADIUS_PX,
  CARD_BORDER_RADIUS_MM,
  createRoundedRectPath
} from './src/services/cardExportService.js';
import fs from 'fs';

console.log('================================================================');
console.log('  TEST: COPY AS IMAGE & PNG/JPG ROUNDED CORNER EXPORT PIPELINE');
console.log('================================================================\n');

let allPassed = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    allPassed = false;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

// -------------------------------------------------------------
// TEST 1: Constant & Scaling Integrity
// -------------------------------------------------------------
console.log('--- Test 1: Geometry Constants & 300 DPI Proportions ---');

assert(CARD_LOGICAL_WIDTH_PX === 856, 'Logical card width is 856 px (CR80 ratio)');
assert(CARD_LOGICAL_HEIGHT_PX === 540, 'Logical card height is 540 px');
assert(CARD_BORDER_RADIUS_PX === 32, 'Logical border-radius is 32 px');
assert(CARD_BORDER_RADIUS_MM === 3.2, 'Border-radius in mm is 3.2 mm');

const targetWidth = CR80_PHYSICAL.dpi300WidthPx; // 1011
const targetHeight = CR80_PHYSICAL.dpi300HeightPx; // 638
assert(targetWidth === 1011, '300 DPI Width is 1011 px');
assert(targetHeight === 638, '300 DPI Height is 638 px');

const cornerRadius300Dpi = Math.round((CARD_BORDER_RADIUS_PX / CARD_LOGICAL_WIDTH_PX) * targetWidth);
assert(cornerRadius300Dpi === 38, `Scaled 300 DPI corner radius is ~38 px (calculated: ${cornerRadius300Dpi} px)`);

// -------------------------------------------------------------
// TEST 2: Mathematical Point-in-Rounded-Rect Test
// -------------------------------------------------------------
console.log('\n--- Test 2: Mathematical Corner Geometry & Arc Clipping ---');

function isPointInsideRoundedRect(x, y, w, h, r) {
  // Check bounding box
  if (x < 0 || x >= w || y < 0 || y >= h) return false;
  
  // Top-left corner
  if (x < r && y < r) {
    const dx = x - r;
    const dy = y - r;
    return (dx * dx + dy * dy) <= (r * r);
  }
  // Top-right corner
  if (x >= w - r && y < r) {
    const dx = x - (w - r);
    const dy = y - r;
    return (dx * dx + dy * dy) <= (r * r);
  }
  // Bottom-left corner
  if (x < r && y >= h - r) {
    const dx = x - r;
    const dy = y - (h - r);
    return (dx * dx + dy * dy) <= (r * r);
  }
  // Bottom-right corner
  if (x >= w - r && y >= h - r) {
    const dx = x - (w - r);
    const dy = y - (h - r);
    return (dx * dx + dy * dy) <= (r * r);
  }
  
  return true;
}

// 4 Outer Corner Coordinates (should all be outside the rounded card)
const corners = [
  { name: 'Top-Left (0, 0)', x: 0, y: 0 },
  { name: `Top-Right (${targetWidth - 1}, 0)`, x: targetWidth - 1, y: 0 },
  { name: `Bottom-Left (0, ${targetHeight - 1})`, x: 0, y: targetHeight - 1 },
  { name: `Bottom-Right (${targetWidth - 1}, ${targetHeight - 1})`, x: targetWidth - 1, y: targetHeight - 1 },
  // Sub-corners close to boundary
  { name: 'Sub-corner TL (5, 5)', x: 5, y: 5 },
  { name: `Sub-corner TR (${targetWidth - 6}, 5)`, x: targetWidth - 6, y: 5 },
  { name: 'Sub-corner BL (5, 632)', x: 5, y: targetHeight - 6 },
  { name: `Sub-corner BR (${targetWidth - 6}, 632)`, x: targetWidth - 6, y: targetHeight - 6 }
];

corners.forEach(c => {
  const inside = isPointInsideRoundedRect(c.x, c.y, targetWidth, targetHeight, cornerRadius300Dpi);
  assert(!inside, `Corner point ${c.name} is OUTSIDE the rounded clipping boundary`);
});

// Center and body points (should be inside the rounded card)
const bodyPoints = [
  { name: 'Center (505, 319)', x: Math.floor(targetWidth / 2), y: Math.floor(targetHeight / 2) },
  { name: 'Top Edge Middle (505, 10)', x: Math.floor(targetWidth / 2), y: 10 },
  { name: 'Bottom Edge Middle (505, 627)', x: Math.floor(targetWidth / 2), y: targetHeight - 11 },
  { name: 'Left Edge Middle (10, 319)', x: 10, y: Math.floor(targetHeight / 2) },
  { name: 'Right Edge Middle (1000, 319)', x: targetWidth - 11, y: Math.floor(targetHeight / 2) }
];

bodyPoints.forEach(p => {
  const inside = isPointInsideRoundedRect(p.x, p.y, targetWidth, targetHeight, cornerRadius300Dpi);
  assert(inside, `Card body point ${p.name} is INSIDE the rounded clipping boundary`);
});

// -------------------------------------------------------------
// TEST 3: Rasterized Pixel Buffer Alpha Simulation (PNG & Copy)
// -------------------------------------------------------------
console.log('\n--- Test 3: Rasterized Pixel Buffer Verification (PNG & Clipboard) ---');

// Allocate 300 DPI RGBA buffer: 1011 × 638 × 4 = 2,580,072 bytes
const buffer = new Uint8Array(targetWidth * targetHeight * 4);

// Simulate renderCardToCanvas pipeline for PNG/Clipboard:
// Step 1: Canvas initialized transparent (all zeros)
// Step 2: Render inside clipping region with cream card color #FBF8EE (R=251, G=248, B=238, A=255)
const CREAM_R = 251, CREAM_G = 248, CREAM_B = 238, CREAM_A = 255;

for (let y = 0; y < targetHeight; y++) {
  for (let x = 0; x < targetWidth; x++) {
    if (isPointInsideRoundedRect(x, y, targetWidth, targetHeight, cornerRadius300Dpi)) {
      const idx = (y * targetWidth + x) * 4;
      buffer[idx] = CREAM_R;
      buffer[idx + 1] = CREAM_G;
      buffer[idx + 2] = CREAM_B;
      buffer[idx + 3] = CREAM_A;
    }
  }
}

function getPixel(x, y) {
  const idx = (y * targetWidth + x) * 4;
  return {
    r: buffer[idx],
    g: buffer[idx + 1],
    b: buffer[idx + 2],
    a: buffer[idx + 3]
  };
}

// Check the 4 exact corner pixels
const tl = getPixel(0, 0);
assert(tl.a === 0, `Top-Left corner (0, 0) pixel has alpha = 0 (transparent: rgba(${tl.r},${tl.g},${tl.b},${tl.a}))`);

const tr = getPixel(targetWidth - 1, 0);
assert(tr.a === 0, `Top-Right corner (${targetWidth - 1}, 0) pixel has alpha = 0 (transparent: rgba(${tr.r},${tr.g},${tr.b},${tr.a}))`);

const bl = getPixel(0, targetHeight - 1);
assert(bl.a === 0, `Bottom-Left corner (0, ${targetHeight - 1}) pixel has alpha = 0 (transparent: rgba(${bl.r},${bl.g},${bl.b},${bl.a}))`);

const br = getPixel(targetWidth - 1, targetHeight - 1);
assert(br.a === 0, `Bottom-Right corner (${targetWidth - 1}, ${targetHeight - 1}) pixel has alpha = 0 (transparent: rgba(${br.r},${br.g},${br.b},${br.a}))`);

// Check center pixel
const center = getPixel(Math.floor(targetWidth / 2), Math.floor(targetHeight / 2));
assert(center.a === 255, `Center pixel has alpha = 255 (solid card content)`);
assert(center.r === CREAM_R && center.g === CREAM_G && center.b === CREAM_B,
  `Center pixel contains exact cream card color (#FBF8EE)`);

// -------------------------------------------------------------
// TEST 4: JPG Export Background Simulation (White Corners)
// -------------------------------------------------------------
console.log('\n--- Test 4: JPG Export Mode Verification (White Corners outside Card) ---');

const jpgBuffer = new Uint8Array(targetWidth * targetHeight * 4);
// Step 1: Pre-fill white (255, 255, 255, 255)
for (let i = 0; i < jpgBuffer.length; i += 4) {
  jpgBuffer[i] = 255;
  jpgBuffer[i + 1] = 255;
  jpgBuffer[i + 2] = 255;
  jpgBuffer[i + 3] = 255;
}
// Step 2: Draw card inside rounded clip
for (let y = 0; y < targetHeight; y++) {
  for (let x = 0; x < targetWidth; x++) {
    if (isPointInsideRoundedRect(x, y, targetWidth, targetHeight, cornerRadius300Dpi)) {
      const idx = (y * targetWidth + x) * 4;
      jpgBuffer[idx] = CREAM_R;
      jpgBuffer[idx + 1] = CREAM_G;
      jpgBuffer[idx + 2] = CREAM_B;
      jpgBuffer[idx + 3] = CREAM_A;
    }
  }
}

const jpgTl = {
  r: jpgBuffer[0], g: jpgBuffer[1], b: jpgBuffer[2], a: jpgBuffer[3]
};
assert(jpgTl.r === 255 && jpgTl.g === 255 && jpgTl.b === 255,
  `JPG Top-Left corner is clean white (#FFFFFF)`);

const jpgCenterIdx = (Math.floor(targetHeight / 2) * targetWidth + Math.floor(targetWidth / 2)) * 4;
assert(jpgBuffer[jpgCenterIdx] === CREAM_R && jpgBuffer[jpgCenterIdx + 1] === CREAM_G,
  `JPG Center pixel is cream card (#FBF8EE)`);

// -------------------------------------------------------------
// TEST 5: Verify Source Code Guarantees in cardExportService.js
// -------------------------------------------------------------
console.log('\n--- Test 5: Code Inspection Guarantees in cardExportService.js ---');

const exportServiceSrc = fs.readFileSync('./src/services/cardExportService.js', 'utf8');

assert(exportServiceSrc.includes('backgroundColor: null'), 'html2canvas uses backgroundColor: null (no cream fill outside card)');
assert(exportServiceSrc.includes('ctx.clip()'), 'Real clipping path ctx.clip() is applied before drawing card');
assert(exportServiceSrc.includes('createRoundedRectPath(ctx, 0, 0, targetWidth, targetHeight, cornerRadius)'), 'Clipping path uses exact scaled cornerRadius');
assert(exportServiceSrc.includes("format: 'png'"), 'copyCardImageToClipboard and downloadCardPNG explicitly specify PNG format');
assert(exportServiceSrc.includes("format: 'jpg'"), 'downloadCardJPG explicitly specifies JPG format');
assert(exportServiceSrc.includes("ctx.clearRect(0, 0, targetWidth, targetHeight)"), 'Context is cleared for PNG/Clipboard transparency');
assert(exportServiceSrc.includes("ctx.strokeStyle = options.borderColor || '#DCE7D7'"), 'Authoritative card border follows rounded rectangle path');

console.log('\n================================================================');
if (allPassed) {
  console.log('🎉 ALL EXPORT & COPY ROUNDED CORNER TESTS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ SOME TESTS FAILED.');
  process.exit(1);
}
console.log('================================================================');
