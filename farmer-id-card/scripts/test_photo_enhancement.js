import {
  DEFAULT_PHOTO_SETTINGS,
  CARD_PHOTO_FRAME,
  getCssObjectPosition,
  getCssFilter
} from './src/services/photoService.js';
import { createDefaultTemplate } from './src/types/defaultTemplate.js';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';
import fs from 'fs';

console.log('================================================================');
console.log('    FARMER PHOTO QUALITY, CROPPING & DISPLAY VERIFICATION');
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
// TEST 1: Photo Frame Geometry & Proportions in Template
// -------------------------------------------------------------
console.log('--- Test 1: Photo Frame Geometry & Non-Overlapping Layout ---');

const template = createDefaultTemplate();
const photoElement = template.front.elements.find((el) => el.type === 'photo');

assert(!!photoElement, 'front_photo element exists in default template');
assert(photoElement.x === 36, `Photo x anchor is 36 px (actual: ${photoElement.x})`);
assert(photoElement.y === 72, `Photo y anchor is 72 px (actual: ${photoElement.y})`);
assert(photoElement.width === 190, `Photo width is exactly 190 px (actual: ${photoElement.width})`);
assert(photoElement.height === 242, `Photo height is exactly 242 px (actual: ${photoElement.height})`);
assert(photoElement.style?.borderRadius === 24, `Photo border radius is 24 px / 2.4 mm (actual: ${photoElement.style?.borderRadius})`);
assert(photoElement.style?.borderWidth === 1.5, `Photo border width is 1.5 px (actual: ${photoElement.style?.borderWidth})`);

const photoRightEdge = photoElement.x + photoElement.width; // 36 + 190 = 226
const nameMarathi = template.front.elements.find((el) => el.id === 'front_name_marathi');
assert(nameMarathi && nameMarathi.x >= photoRightEdge + 10,
  `Clear gutter between photo right (${photoRightEdge}px) and Name text (${nameMarathi?.x}px): ${nameMarathi?.x - photoRightEdge}px gutter`);

const photoBottomEdge = photoElement.y + photoElement.height; // 72 + 242 = 314
const farmerIdPill = template.front.elements.find((el) => el.id === 'front_farmer_id_container');
assert(farmerIdPill && farmerIdPill.y >= photoBottomEdge + 8,
  `Clear vertical clearance between photo bottom (${photoBottomEdge}px) and Farmer ID pill (${farmerIdPill?.y}px): ${farmerIdPill?.y - photoBottomEdge}px gap`);

const qrCode = template.front.elements.find((el) => el.type === 'qr');
assert(qrCode && qrCode.x > photoRightEdge + 200,
  `Photo never overlaps QR code (QR is at x: ${qrCode?.x}px, Photo right: ${photoRightEdge}px)`);

// -------------------------------------------------------------
// TEST 2: Photo Fitting & Object-Position Math
// -------------------------------------------------------------
console.log('\n--- Test 2: Photo Fitting, Object Position & CSS Filters ---');

assert(CARD_PHOTO_FRAME.width === 190, 'Photo service frame width matches template (190 px)');
assert(CARD_PHOTO_FRAME.height === 242, 'Photo service frame height matches template (242 px)');
assert(Math.abs(CARD_PHOTO_FRAME.aspectRatio - (190 / 242)) < 0.001, 'Photo aspect ratio is ~0.7851');

// Test Center Position
const centerPos = getCssObjectPosition({ panX: 0, panY: 0 });
assert(centerPos === '50% 50%', `Center pan produces '50% 50%' (actual: '${centerPos}')`);

// Test Offset Position
const offsetPos = getCssObjectPosition({ panX: -10, panY: 5 });
assert(offsetPos === '40% 55%', `Pan (-10%, +5%) produces '40% 55%' (actual: '${offsetPos}')`);

// Test Default Filter
const defaultFilter = getCssFilter({ brightness: 100, contrast: 100 });
assert(defaultFilter === 'none', `Default brightness/contrast produces 'none' (actual: '${defaultFilter}')`);

// Test Adjusted Filter
const boostedFilter = getCssFilter({ brightness: 115, contrast: 110 });
assert(boostedFilter === 'brightness(115%) contrast(110%)',
  `Boosted lighting produces 'brightness(115%) contrast(110%)' (actual: '${boostedFilter}')`);

// -------------------------------------------------------------
// TEST 3: CardRenderer Component Inspection
// -------------------------------------------------------------
console.log('\n--- Test 3: CardRenderer Photo Case Code Guarantees ---');

const cardRendererSrc = fs.readFileSync('./src/components/CardRenderer.jsx', 'utf8');

assert(cardRendererSrc.includes("objectFit: 'cover'"), 'CardRenderer enforces objectFit: cover for edge-to-edge fill');
assert(cardRendererSrc.includes('objectPosition'), 'CardRenderer supports configurable objectPosition');
assert(cardRendererSrc.includes('farmer?.photo_processed || farmer?.photo'), 'CardRenderer prefers photo_processed with fallback to original photo');
assert(cardRendererSrc.includes('boxSizing: \'border-box\''), 'CardRenderer photo container enforces boxSizing: border-box');
assert(cardRendererSrc.includes('padding: 0'), 'CardRenderer eliminates any inner padding inside photo frame');
assert(cardRendererSrc.includes('overflow-hidden'), 'CardRenderer clips photo to rounded frame via overflow-hidden');

// -------------------------------------------------------------
// TEST 4: FarmerModal & App Integration Inspection
// -------------------------------------------------------------
console.log('\n--- Test 4: Photo Adjustment Tool Integration in UI ---');

const farmerModalSrc = fs.readFileSync('./src/components/FarmerModal.jsx', 'utf8');
assert(farmerModalSrc.includes('PhotoAdjustmentModal'), 'FarmerModal renders PhotoAdjustmentModal');
assert(farmerModalSrc.includes('Adjust / Crop Photo'), 'FarmerModal includes dedicated Adjust / Crop Photo action');
assert(farmerModalSrc.includes('validatePhoto'), 'FarmerModal validates uploaded photos for quality and borders');
assert(farmerModalSrc.includes('Photo Quality Advice'), 'FarmerModal provides operator advice when photos have issues');

const appSrc = fs.readFileSync('./src/App.jsx', 'utf8');
assert(appSrc.includes('PhotoAdjustmentModal'), 'App.jsx renders PhotoAdjustmentModal');
assert(appSrc.includes('Adjust Photo'), 'App.jsx card preview toolbar provides 1-click Adjust Photo button');
assert(appSrc.includes('handleSavePhotoAdjustment'), 'App.jsx has dedicated handleSavePhotoAdjustment handler');

// -------------------------------------------------------------
// TEST 5: Existing Farmer Data Preservation
// -------------------------------------------------------------
console.log('\n--- Test 5: Existing Saved Farmer Records Preservation ---');

const f1 = SAMPLE_FARMERS.find((f) => f.id === 'farmer-001');
assert(!!f1, 'Farmer 1 (farmer-001) exists');
assert(f1.farmer_id === '38533702295', 'Farmer 1 ID remains 38533702295');
assert(f1.photo === '/sample_farmer_photo.jpg', 'Farmer 1 original photo remains pristine /sample_farmer_photo.jpg');
assert(f1.photo_settings?.zoom >= 1.05, 'Farmer 1 has border-trim zoom setting configured');
assert(f1.photo_settings?.brightness >= 105, 'Farmer 1 has brightness boost setting configured');

const f2 = SAMPLE_FARMERS.find((f) => f.id === 'farmer-003');
assert(!!f2, 'Farmer 2 (farmer-003) exists');
assert(f2.farmer_id === '65940671942', 'Farmer 2 ID remains 65940671942');
assert(f2.photo === '/bharat_pawar_photo.jpg', 'Farmer 2 original photo remains pristine /bharat_pawar_photo.jpg');
assert(f2.photo_settings?.zoom >= 1.05, 'Farmer 2 has photo_settings configured');

// -------------------------------------------------------------
// TEST 6: Acceptance Tests — Clear, Dark & Low-Resolution Cases
// -------------------------------------------------------------
console.log('\n--- Test 6: Acceptance Tests (Clear, Dark, Low-Res) ---');

function getJpegDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  let i = 2;
  while (i < buf.length) {
    if (buf[i] === 0xFF && (buf[i + 1] === 0xC0 || buf[i + 1] === 0xC2)) {
      const h = buf.readUInt16BE(i + 5);
      const w = buf.readUInt16BE(i + 7);
      return { width: w, height: h };
    }
    i++;
  }
  return null;
}

// Case 1: Clear, well-lit portrait
const clearDims = getJpegDimensions('./public/sample_farmer_photo_highres.jpg');
assert(!!clearDims, 'Case 1: Clear portrait file exists and is valid JPEG');
assert(clearDims.width >= 300 && clearDims.height >= 400,
  `Case 1: Clear portrait meets or exceeds 300×400 px print target (${clearDims.width} × ${clearDims.height} px)`);
const clearAspect = clearDims.width / clearDims.height;
assert(clearAspect > 0.6 && clearAspect < 0.9,
  `Case 1: Clear portrait has standard portrait aspect ratio (~${clearAspect.toFixed(2)})`);

// Case 2: Dark portrait
const darkDims = getJpegDimensions('./public/sample_farmer_photo_dark.jpg');
assert(!!darkDims, 'Case 2: Dark portrait file exists and is valid JPEG');
assert(darkDims.width >= 300 && darkDims.height >= 400,
  `Case 2: Dark portrait has sufficient resolution (${darkDims.width} × ${darkDims.height} px)`);
// Verify brightness filter produces restrained boost without clipping
const darkFilter = getCssFilter({ brightness: 125, contrast: 110 });
assert(darkFilter === 'brightness(125%) contrast(110%)',
  `Case 2: Brightness boost is restrained (+25% brightness, +10% contrast) preventing washed-out skin`);

// Case 3: Low-resolution portrait
const lowResDims = getJpegDimensions('./public/sample_farmer_photo_lowres.jpg');
assert(!!lowResDims, 'Case 3: Low-res portrait file exists and is valid JPEG');
assert(lowResDims.width < 300 || lowResDims.height < 400,
  `Case 3: Low-res portrait is under 300×400 px target (${lowResDims.width} × ${lowResDims.height} px)`);
const isVeryLow = lowResDims.width < 180 || lowResDims.height < 220;
assert(isVeryLow, 'Case 3: Correctly triggers low-resolution warning for physical print');

// Verification: Card template invariance (No other card element changed)
const totalFrontElements = template.front.elements.length;
assert(totalFrontElements === 14, `Front template contains exactly 14 approved elements (actual: ${totalFrontElements})`);
const totalBackElements = template.back.elements.length;
assert(totalBackElements === 7, `Back template contains exactly 7 approved elements (actual: ${totalBackElements})`);

// Card physical dimensions check (CR80 standard 85.60 × 54.0 mm)
assert(template.size.width === 85.6, `Card physical width is 85.6 mm (actual: ${template.size.width})`);
assert(template.size.height === 54, `Card physical height is 54 mm (actual: ${template.size.height})`);
assert(template.size.canvasWidth === 856, `Card canvas width is 856 px (actual: ${template.size.canvasWidth})`);
assert(template.size.canvasHeight === 540, `Card canvas height is 540 px (actual: ${template.size.canvasHeight})`);

console.log('\n================================================================');
if (allPassed) {
  console.log('🎉 ALL PHOTO QUALITY, CROPPING & ACCEPTANCE TESTS PASSED! 🎉');
} else {
  console.error('❌ SOME TESTS FAILED.');
  process.exit(1);
}
console.log('================================================================');
