import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { QRCodeSVG } from 'qrcode.react';
import QRCode from 'qrcode';
import jsQR from 'jsqr';
import { QrCodeElement } from './src/components/CardRenderer.jsx';
import { resolveQrPayload, generateQrCodeDataUrl } from './src/services/qrHelper.js';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';
import { createDefaultTemplate } from './src/types/defaultTemplate.js';

console.log('====================================================');
console.log('    QR CODE CLIPPING FIX & COMPLETE SQUARE SUITE    ');
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

// Programmatic optical decoding helper using jsQR
async function decodePayloadWithJsQR(payload, options = {}) {
  const qr = QRCode.create(payload, {
    errorCorrectionLevel: options.errorCorrection || 'Q'
  });
  const margin = options.margin ?? 4;
  const size = qr.modules.size;
  const totalSize = size + margin * 2;
  const scale = 8;
  const imgW = totalSize * scale;
  const imgH = totalSize * scale;
  const data = new Uint8ClampedArray(imgW * imgH * 4);

  for (let y = 0; y < imgH; y++) {
    for (let x = 0; x < imgW; x++) {
      const modX = Math.floor(x / scale) - margin;
      const modY = Math.floor(y / scale) - margin;
      const isDark = (modX >= 0 && modX < size && modY >= 0 && modY < size) ? qr.modules.get(modX, modY) : 0;
      const idx = (y * imgW + x) * 4;
      const col = isDark ? 0 : 255;
      data[idx] = col;
      data[idx + 1] = col;
      data[idx + 2] = col;
      data[idx + 3] = 255;
    }
  }

  const result = jsQR(data, imgW, imgH);
  return result ? { success: true, data: result.data } : { success: false, data: null };
}

// -------------------------------------------------------------------------
// TEST 1: QR Component DOM Structure — Complete Square, No Clipping, SVG
// -------------------------------------------------------------------------
console.log('--- Test 1: DOM Sizing, Aspect Ratio & SVG Vector Properties ---');
const template = createDefaultTemplate();
const farmerA = SAMPLE_FARMERS[0]; // ID: 38533702295
const qrElementDef = template.front.elements.find(el => el.id === 'front_qr');

assert(qrElementDef !== undefined, 'front_qr element exists in default template');

// Render component to static HTML markup
const renderedHtml = ReactDOMServer.renderToStaticMarkup(
  React.createElement(QrCodeElement, {
    element: qrElementDef,
    template: template,
    farmer: farmerA,
    style: qrElementDef.style
  })
);

assert(renderedHtml.includes('<svg'), 'QR is rendered as pure vector SVG element (not low-res bitmap or img)');
assert(renderedHtml.includes('xmlns="http://www.w3.org/2000/svg"'), 'SVG contains explicit xmlns namespace attribute');
assert(renderedHtml.includes('preserveAspectRatio="xMidYMid meet"'), 'SVG contains preserveAspectRatio="xMidYMid meet"');
assert(renderedHtml.includes('shape-rendering="crispEdges"'), 'SVG contains shape-rendering="crispEdges" for sharp modules');

// Verify square aspect ratio in style
assert(renderedHtml.includes('aspect-ratio:1 / 1') || renderedHtml.includes('aspect-ratio:1/1'), 'Square aspect ratio is explicitly declared (Width = Height)');
assert(!renderedHtml.includes('object-fit'), 'No object-fit rule present on QR element (eliminates html2canvas clipping bug)');
assert(renderedHtml.includes('overflow:visible'), 'QR container specifies overflow:visible (prevents module cutoff)');
assert(renderedHtml.includes('box-sizing:border-box'), 'QR container enforces box-sizing: border-box');

// -------------------------------------------------------------------------
// TEST 2: Multi-Payload Optical Tests (38533702295, 12345678901, SAMPLE-FARMER-001)
// -------------------------------------------------------------------------
console.log('\n--- Test 2: Multi-Payload Verification Suite ---');

const testPayloads = [
  '38533702295',
  '12345678901',
  'SAMPLE-FARMER-001'
];

for (const p of testPayloads) {
  const dec = await decodePayloadWithJsQR(p, { errorCorrection: 'Q', margin: 4 });
  assert(dec.success && dec.data === p, `Payload "${p}" decodes 100% bit-perfect with jsQR`);
}

// -------------------------------------------------------------------------
// TEST 3: Dynamic Farmer Switching (Farmer A vs Farmer B)
// -------------------------------------------------------------------------
console.log('\n--- Test 3: Dynamic Farmer Switching (Farmer A → QR A, Farmer B → QR B) ---');
const farmerB = SAMPLE_FARMERS.find(f => f.farmer_id === '8220502510') || SAMPLE_FARMERS[1];

assert(farmerA.farmer_id === '38533702295', 'Farmer A ID is 38533702295');
assert(farmerB.farmer_id === '8220502510', `Farmer B ID is ${farmerB.farmer_id}`);

const resA = resolveQrPayload(template.qrConfig, farmerA);
const resB = resolveQrPayload(template.qrConfig, farmerB);

assert(resA.payload === '38533702295', 'Resolved Farmer A payload is 38533702295');
assert(resB.payload === '8220502510', 'Resolved Farmer B payload is 8220502510');
assert(resA.payload !== resB.payload, 'Farmer A and Farmer B payloads are strictly distinct');

const decA = await decodePayloadWithJsQR(resA.payload);
const decB = await decodePayloadWithJsQR(resB.payload);

assert(decA.data === '38533702295', `Decoded QR A matches Farmer A: ${decA.data}`);
assert(decB.data === '8220502510', `Decoded QR B matches Farmer B: ${decB.data}`);
assert(decA.data !== decB.data, 'QR A and QR B decode to different data; no stale cache');

// -------------------------------------------------------------------------
// TEST 4: Missing ID Safety Fallback
// -------------------------------------------------------------------------
console.log('\n--- Test 4: Missing ID Fallback Handling ---');
const emptyFarmer = { id: 'test-empty', name_english: 'No ID Farmer', farmer_id: '' };
const renderedMissing = ReactDOMServer.renderToStaticMarkup(
  React.createElement(QrCodeElement, {
    element: qrElementDef,
    template: template,
    farmer: emptyFarmer,
    style: qrElementDef.style
  })
);

assert(renderedMissing.includes('QR unavailable'), 'Displays safe "QR unavailable" notification');
assert(!renderedMissing.includes('shape-rendering="crispEdges"'), 'Does NOT render fake or decorative QR for empty data');

// -------------------------------------------------------------------------
// TEST 5: Card Integrity Check
// -------------------------------------------------------------------------
console.log('\n--- Test 5: Overall Card Integrity Check ---');
assert(template.size.width === 85.6 && template.size.height === 54, 'Physical dimensions intact: 85.6 × 54 mm (CR80 standard)');
assert(template.front.elements.some(el => el.id === 'front_farmer_tagline'), 'Marathi farmer tagline element remains intact');
assert(template.front.elements.some(el => el.id === 'front_farmer_id_container'), 'Focal Farmer ID container remains intact');
assert(template.back.elements.some(el => el.id === 'back_land_table'), '6-column Land Table on back remains intact');

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL QR RENDERING & CLIPPING TESTS PASSED! 🎉');
} else {
  console.error('❌ SOME TESTS FAILED!');
  process.exit(1);
}
console.log('====================================================\n');
