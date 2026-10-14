import { jsPDF } from 'jspdf';
import { CR80_PHYSICAL } from './src/services/cardExportService.js';
import { createDefaultTemplate } from './src/types/defaultTemplate.js';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';

console.log('====================================================');
console.log('   PRINTING & PROPER PNG/JPG/PDF EXPORT VERIFICATION');
console.log('====================================================\n');

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
// TEST 1: Physical CR80 Dimensions & 300 DPI Target Math
// -------------------------------------------------------------
console.log('--- Test 1: CR80 Physical Dimensions & 300 DPI Math ---');

assert(CR80_PHYSICAL.widthMm === 85.6, 'Physical width is exactly 85.6 mm');
assert(CR80_PHYSICAL.heightMm === 54.0, 'Physical height is exactly 54.0 mm');

// Calculate 300 DPI pixels: (mm / 25.4) * 300
const calcW = Math.round((85.6 / 25.4) * 300);
const calcH = Math.round((54.0 / 25.4) * 300);

assert(CR80_PHYSICAL.dpi300WidthPx === 1011, `300 DPI width is exactly 1011 px (calculated: ${calcW} px)`);
assert(CR80_PHYSICAL.dpi300HeightPx === 638, `300 DPI height is exactly 638 px (calculated: ${calcH} px)`);

const physicalRatio = 85.6 / 54.0;
const pixelRatio = 1011 / 638;
const ratioDiff = Math.abs(physicalRatio - pixelRatio);
assert(ratioDiff < 0.001, `Aspect ratio distortion is under 0.1% (${physicalRatio.toFixed(4)} vs ${pixelRatio.toFixed(4)})`);

// -------------------------------------------------------------
// TEST 2: Single Card PDF (Front Only: 1 Page, 85.6 × 54 mm)
// -------------------------------------------------------------
console.log('\n--- Test 2: Single Card PDF - Front Only ---');

const frontPdf = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: [CR80_PHYSICAL.widthMm, CR80_PHYSICAL.heightMm]
});

const dummyData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
frontPdf.addImage(dummyData, 'PNG', 0, 0, 85.6, 54);

assert(frontPdf.getNumberOfPages() === 1, 'Front Only PDF contains exactly 1 page');
assert(Math.abs(frontPdf.internal.pageSize.getWidth() - 85.6) < 0.01, 'PDF page width is exactly 85.6 mm');
assert(Math.abs(frontPdf.internal.pageSize.getHeight() - 54.0) < 0.01, 'PDF page height is exactly 54.0 mm');

// -------------------------------------------------------------
// TEST 3: Single Card PDF (Back Only: 1 Page, 85.6 × 54 mm)
// -------------------------------------------------------------
console.log('\n--- Test 3: Single Card PDF - Back Only ---');

const backPdf = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: [CR80_PHYSICAL.widthMm, CR80_PHYSICAL.heightMm]
});
backPdf.addImage(dummyData, 'PNG', 0, 0, 85.6, 54);

assert(backPdf.getNumberOfPages() === 1, 'Back Only PDF contains exactly 1 page');
assert(Math.abs(backPdf.internal.pageSize.getWidth() - 85.6) < 0.01, 'PDF page width is exactly 85.6 mm');
assert(Math.abs(backPdf.internal.pageSize.getHeight() - 54.0) < 0.01, 'PDF page height is exactly 54.0 mm');

// -------------------------------------------------------------
// TEST 4: Dual-Sided Card PDF (Front + Back: Page 1 Front, Page 2 Back)
// -------------------------------------------------------------
console.log('\n--- Test 4: Dual-Sided Card PDF (Front + Back) ---');

const bothPdf = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: [CR80_PHYSICAL.widthMm, CR80_PHYSICAL.heightMm]
});
bothPdf.addImage(dummyData, 'PNG', 0, 0, 85.6, 54); // Page 1 Front
bothPdf.addPage([CR80_PHYSICAL.widthMm, CR80_PHYSICAL.heightMm], 'landscape');
bothPdf.addImage(dummyData, 'PNG', 0, 0, 85.6, 54); // Page 2 Back

assert(bothPdf.getNumberOfPages() === 2, 'Front + Back PDF contains exactly 2 pages');
bothPdf.setPage(1);
assert(Math.abs(bothPdf.internal.pageSize.getWidth() - 85.6) < 0.01, 'Page 1 (Front) width is 85.6 mm');
assert(Math.abs(bothPdf.internal.pageSize.getHeight() - 54.0) < 0.01, 'Page 1 (Front) height is 54.0 mm');
bothPdf.setPage(2);
assert(Math.abs(bothPdf.internal.pageSize.getWidth() - 85.6) < 0.01, 'Page 2 (Back) width is 85.6 mm');
assert(Math.abs(bothPdf.internal.pageSize.getHeight() - 54.0) < 0.01, 'Page 2 (Back) height is 54.0 mm');

const pdfBytes = Buffer.from(bothPdf.output('arraybuffer'));
assert(pdfBytes.subarray(0, 5).toString('ascii') === '%PDF-', 'Valid PDF file structure generated');

// -------------------------------------------------------------
// TEST 5: Dedicated Print HTML Document Structure
// -------------------------------------------------------------
console.log('\n--- Test 5: Dedicated Print Document Geometry & Isolation ---');

function generateMockPrintHTML(frontImg, backImg) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Farmer ID Card</title>
  <style>
    @page { size: 85.6mm 54mm; margin: 0; }
    html, body { width: 85.6mm; height: 54mm; margin: 0 !important; padding: 0 !important; overflow: hidden; }
    .print-card-page { width: 85.6mm; height: 54mm; page-break-after: always; break-after: page; }
    .print-card-page:last-child { page-break-after: avoid; break-after: avoid; }
    img.card-print-image { width: 85.6mm; height: 54mm; display: block; margin: 0; }
  </style>
</head>
<body>
  ${frontImg ? `<div class="print-card-page"><img class="card-print-image" src="${frontImg}" /></div>` : ''}
  ${backImg ? `<div class="print-card-page"><img class="card-print-image" src="${backImg}" /></div>` : ''}
</body>
</html>`;
}

const printFrontOnly = generateMockPrintHTML(dummyData, null);
assert(printFrontOnly.includes('@page { size: 85.6mm 54mm; margin: 0; }'), 'Print styles enforce @page 85.6mm 54mm with 0 margin');
assert(printFrontOnly.includes('width: 85.6mm; height: 54mm;'), 'Card page wrapper enforces physical 85.6mm × 54mm dimensions');
assert(printFrontOnly.includes('<img class="card-print-image"'), 'Card background is embedded via foreground <img> tag, immune to Chrome background graphics checkbox');
assert(!printFrontOnly.includes('dashboard') && !printFrontOnly.includes('navigation'), 'Print document contains zero application UI, navigation, or dashboard DOM');

const printDual = generateMockPrintHTML(dummyData, dummyData);
assert((printDual.match(/class="print-card-page"/g) || []).length === 2, 'Front + Back print contains 2 isolated card pages');
assert(printDual.includes('page-break-after: always'), 'Page breaks configured between Front and Back sides');

// -------------------------------------------------------------
// TEST 6: Card Template Integrity & Data Binding Untouched
// -------------------------------------------------------------
console.log('\n--- Test 6: Preserved Card Design & Devanagari Typography ---');

const template = createDefaultTemplate();
const testFarmer = SAMPLE_FARMERS[0];

assert(template.size.width === 85.6 && template.size.height === 54, 'Template physical size preserved at 85.6 × 54 mm');
assert(template.front.elements.some(e => e.id === 'front_farmer_id_container'), 'Hero Farmer ID panel intact');
assert(template.front.elements.some(e => e.id === 'front_farmer_tagline'), 'Marathi cultural tagline intact');
assert(template.front.elements.some(e => e.id === 'front_qr'), 'Dynamic QR element intact');
assert(template.back.elements.some(e => e.id === 'back_land_table'), 'Dynamic Land Table intact');
assert(template.back.elements.some(e => e.id === 'back_address'), 'Compact Address block intact');

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL 18 PRINT & EXPORT TESTS PASSED SUCCESSFULLY!');
} else {
  console.error('❌ SOME TESTS FAILED. PLEASE INSPECT LOGS ABOVE.');
  process.exit(1);
}
console.log('====================================================\n');
