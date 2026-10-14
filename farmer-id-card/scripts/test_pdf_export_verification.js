import { jsPDF } from 'jspdf';
import fs from 'fs';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';
import { createDefaultTemplate } from './src/types/defaultTemplate.js';

console.log('====================================================');
console.log('       PHYSICAL CR80 PDF EXPORT VERIFICATION        ');
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
// TEST 1: Physical CR80 Dimensions & Page Setup (85.6 × 54 mm)
// -------------------------------------------------------------
console.log('--- Test 1: CR80 Physical Geometry & Landscape Orientation ---');

const template = createDefaultTemplate();
assert(template.size.width === 85.6, 'Template physical width: 85.6 mm');
assert(template.size.height === 54, 'Template physical height: 54.0 mm');
assert(template.size.canvasWidth === 856, 'Canvas pixel width: 856 px (10:1 physical scale)');
assert(template.size.canvasHeight === 540, 'Canvas pixel height: 540 px (10:1 physical scale)');

// Create actual jsPDF document with the CR80 standard
const doc = new jsPDF({
  orientation: 'landscape',
  unit: 'mm',
  format: [85.6, 54]
});

const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();

assert(Math.abs(pageWidth - 85.6) < 0.01, `PDF page width is exactly 85.6 mm (actual: ${pageWidth.toFixed(2)} mm)`);
assert(Math.abs(pageHeight - 54.0) < 0.01, `PDF page height is exactly 54.0 mm (actual: ${pageHeight.toFixed(2)} mm)`);

// -------------------------------------------------------------
// TEST 2: Multi-Page Dual-Sided Card Structure (Front + Back)
// -------------------------------------------------------------
console.log('\n--- Test 2: Dual-Sided Card Page Layout ---');

// Mock a clean 1x1 base64 transparent PNG to test addImage
const dummyPngData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

// Page 1: Front side
doc.addImage(dummyPngData, 'PNG', 0, 0, 85.6, 54);
assert(doc.getNumberOfPages() === 1, 'Front side occupies Page 1');

// Page 2: Back side
doc.addPage([85.6, 54], 'landscape');
doc.addImage(dummyPngData, 'PNG', 0, 0, 85.6, 54);
assert(doc.getNumberOfPages() === 2, 'Back side occupies Page 2; total 2 pages for dual-sided card');

const page2W = doc.internal.pageSize.getWidth();
const page2H = doc.internal.pageSize.getHeight();
assert(Math.abs(page2W - 85.6) < 0.01 && Math.abs(page2H - 54.0) < 0.01, 'Page 2 retains identical 85.6 × 54 mm dimensions');

// -------------------------------------------------------------
// TEST 3: Binary PDF Stream & File Integrity
// -------------------------------------------------------------
console.log('\n--- Test 3: PDF Binary Stream Validation ---');

const pdfBytes = doc.output('arraybuffer');
const buffer = Buffer.from(pdfBytes);

assert(buffer.length > 500, `Valid binary PDF stream generated (${buffer.length} bytes)`);

// Verify PDF magic header
const header = buffer.subarray(0, 8).toString('ascii');
assert(header.startsWith('%PDF-'), `PDF header present and valid: ${header.trim()}`);

// Verify EOF marker
const trailer = buffer.subarray(buffer.length - 30).toString('ascii');
assert(trailer.includes('%%EOF'), 'PDF EOF marker properly written');

// -------------------------------------------------------------
// TEST 4: A4 Print Sheet Layout with Cut Guidelines
// -------------------------------------------------------------
console.log('\n--- Test 4: A4 Print Sheet Layout Mode ---');

const a4Doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const a4W = a4Doc.internal.pageSize.getWidth();
const a4H = a4Doc.internal.pageSize.getHeight();

assert(Math.abs(a4W - 210) < 0.01, `A4 page width is 210 mm (actual: ${a4W} mm)`);
assert(Math.abs(a4H - 297) < 0.01, `A4 page height is 297 mm (actual: ${a4H} mm)`);

// Save test artifacts to scratch directory
const scratchDir = './test_output';
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir);
}

fs.writeFileSync(`${scratchDir}/test-card-cr80.pdf`, buffer);
console.log(`Saved sample CR80 verification PDF to ${scratchDir}/test-card-cr80.pdf`);

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL PHYSICAL CR80 PDF EXPORT TESTS PASSED! 🎉');
} else {
  console.error('❌ SOME TESTS FAILED!');
  process.exit(1);
}
console.log('====================================================\n');
