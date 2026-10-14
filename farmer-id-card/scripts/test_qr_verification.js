import { resolveQrPayload, generateQrCodeDataUrl } from './src/services/qrHelper.js';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';
import { createDefaultTemplate } from './src/types/defaultTemplate.js';
import QRCode from 'qrcode';
import jsQR from 'jsqr';

console.log('====================================================');
console.log('       FARMER ID DYNAMIC QR VERIFICATION SUITE       ');
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

// Helper to decode a QR payload programmatically via jsQR in Node
async function decodeQrPayloadProgrammatically(payload, options = {}) {
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
  return result ? result.data : null;
}

// ----------------------------------------------------
// TEST 1: Default Farmer ID QR Generation & Scannability
// ----------------------------------------------------
console.log('--- Test 1: Real Dynamic QR Generation for Farmer 1 ---');
const farmer1 = SAMPLE_FARMERS[0];
assert(farmer1.farmer_id === '38533702295', 'Farmer 1 has ID 38533702295');

const res1 = resolveQrPayload({ sourceField: 'farmer_id' }, farmer1);
assert(!res1.isMissing, 'Payload is resolved and not marked missing');
assert(res1.payload === '38533702295', 'Exact payload string matches Farmer ID: 38533702295');

const decoded1 = await decodeQrPayloadProgrammatically(res1.payload, { errorCorrection: 'Q', margin: 4 });
assert(decoded1 === '38533702295', `Decoded QR code matches exact Farmer ID: ${decoded1}`);

// ----------------------------------------------------
// TEST 2: Dynamic Farmer Switch (Farmer A -> Farmer B)
// ----------------------------------------------------
console.log('\n--- Test 2: Dynamic Farmer Switching (Farmer A -> Farmer B) ---');
const farmer2 = SAMPLE_FARMERS[1];
const res2 = resolveQrPayload({ sourceField: 'farmer_id' }, farmer2);
assert(res2.payload === farmer2.farmer_id, `Farmer 2 resolves to ID: ${farmer2.farmer_id}`);

const decoded2 = await decodeQrPayloadProgrammatically(res2.payload, { errorCorrection: 'Q', margin: 4 });
assert(decoded2 === farmer2.farmer_id, `Farmer 2 QR decodes to exact ID: ${decoded2}`);
assert(decoded1 !== decoded2, 'QR codes for Farmer 1 and Farmer 2 are strictly distinct (Never stuck on Farmer A!)');

// ----------------------------------------------------
// TEST 3: Empty Field Safety Rule (Requirement 14)
// ----------------------------------------------------
console.log('\n--- Test 3: Empty Data Safety Handling (Requirement 14) ---');
const emptyFarmer = { id: 'empty-test', name_english: 'Empty ID Farmer', farmer_id: '' };
const resEmpty = resolveQrPayload({ sourceField: 'farmer_id' }, emptyFarmer);
assert(resEmpty.isMissing === true, 'Empty farmer_id correctly identified as missing');
assert(resEmpty.payload === '', 'Empty payload returned; no fake QR generated');
assert(resEmpty.message === 'QR unavailable — Farmer ID is missing.', `Exact missing error message returned: "${resEmpty.message}"`);

// ----------------------------------------------------
// TEST 4: Multiple Fields Controlled Payload (Requirement 5)
// ----------------------------------------------------
console.log('\n--- Test 4: Multiple Fields Selective Encoding (Requirement 5) ---');
const multiConfig = {
  sourceType: 'multiple',
  sourceField: 'multiple',
  multipleFields: ['farmer_id', 'name_english', 'farmer_enrollment_number']
};
const resMulti = resolveQrPayload(multiConfig, farmer1);
const expectedMulti = `Farmer ID: ${farmer1.farmer_id}\nName: ${farmer1.name_english}\nEnrollment: ${farmer1.farmer_enrollment_number}`;
assert(resMulti.payload === expectedMulti, 'Multiple fields payload formatted as expected:\n' + resMulti.payload);

const decodedMulti = await decodeQrPayloadProgrammatically(resMulti.payload);
assert(decodedMulti === expectedMulti, 'Multiple fields QR decodes back bit-perfect');

// ----------------------------------------------------
// TEST 5: Custom Text with {{placeholder}} Interpolation (Requirement 4)
// ----------------------------------------------------
console.log('\n--- Test 5: Custom Text Template Interpolation (Requirement 4) ---');
const customConfig = {
  sourceType: 'custom',
  sourceField: 'custom',
  customText: 'FARMER CARD\nFarmer ID: {{farmer_id}}\nName: {{name_english}}'
};
const resCustom = resolveQrPayload(customConfig, farmer1);
const expectedCustom = `FARMER CARD\nFarmer ID: ${farmer1.farmer_id}\nName: ${farmer1.name_english}`;
assert(resCustom.payload === expectedCustom, 'Custom text tokens interpolated correctly');

const decodedCustom = await decodeQrPayloadProgrammatically(resCustom.payload);
assert(decodedCustom === expectedCustom, 'Custom text QR decodes back bit-perfect');

// ----------------------------------------------------
// TEST 6: Verification URL (Requirement 6)
// ----------------------------------------------------
console.log('\n--- Test 6: Verification URL (Requirement 6) ---');
const urlConfig = {
  sourceType: 'url',
  sourceField: 'url',
  urlPattern: 'https://krishiseva.gov.in/verify/{{farmer_id}}'
};
const resUrl = resolveQrPayload(urlConfig, farmer1);
assert(resUrl.payload === `https://krishiseva.gov.in/verify/${encodeURIComponent(farmer1.farmer_id)}`, 'Verification URL generated correctly');
assert(resUrl.warning.includes('online verification service'), 'Warning flag present for verification URL');

// ----------------------------------------------------
// TEST 7: Template Storage Separation (Requirement 16)
// ----------------------------------------------------
console.log('\n--- Test 7: Template Storage Separation (Requirement 16) ---');
const tpl = createDefaultTemplate();
const tplStr = JSON.stringify(tpl);
assert(!tplStr.includes('38533702295'), 'Template definition does NOT contain hardcoded Farmer ID');
assert(!tplStr.includes('Vilas'), 'Template definition does NOT contain hardcoded farmer name');
assert(tpl.qrConfig.sourceField === 'farmer_id', 'Template stores only QR config: sourceField = "farmer_id"');
assert(tpl.qrConfig.errorCorrection === 'Q', 'Template default Error Correction is Level Q');
assert(tpl.qrConfig.margin === 4, 'Template default Quiet Zone is 4 modules');

// ----------------------------------------------------
// TEST 8: Data URL Generation Integrity (Requirement 7 & 12)
// ----------------------------------------------------
console.log('\n--- Test 8: Client-Side Data URL Generation (Requirements 7 & 12) ---');
const dataUrl = await generateQrCodeDataUrl(farmer1.farmer_id, {
  errorCorrection: 'Q',
  margin: 4,
  width: 512
});
assert(dataUrl.startsWith('data:image/png;base64,'), 'Generated high-resolution PNG data URL in memory');
assert(dataUrl.length > 500, `Data URL length is ${dataUrl.length} bytes (high-res)`);

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL QR CODE TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED.');
  console.log('====================================================');
  process.exit(1);
}
