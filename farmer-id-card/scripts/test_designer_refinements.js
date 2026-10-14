import { createDefaultTemplate, BUILTIN_TEMPLATE_ID } from './src/types/defaultTemplate.js';
import { SAMPLE_FARMERS as sampleFarmers } from './src/services/sampleData.js';

const defaultTemplate = createDefaultTemplate();
const front = defaultTemplate.front;
const back = defaultTemplate.back;

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('   DESIGNER-LEVEL CARD & EDITOR REFINEMENTS TEST    ');
console.log('====================================================\n');

// 1. Physical Dimensions & Ratio
console.log('--- 1. Physical Dimensions (85.6 mm × 54.0 mm Standard) ---');
const size = defaultTemplate.size;
assert(size.width === 85.6 && size.height === 54 && size.unit === 'mm', 'Physical dimensions strictly 85.6 mm × 54.0 mm');
assert(size.canvasWidth === 856 && size.canvasHeight === 540, 'Canvas dimensions are strictly 856 × 540 px (10:1 ratio with 85.6 × 54 mm)');

// 2. Front Photo & Hero Anchors
console.log('\n--- 2. Front Hero Visual Anchors ---');
const photoEl = front.elements.find((e) => e.type === 'photo');
assert(photoEl && photoEl.width >= 180 && photoEl.height >= 230, `Photo is enlarged to ${photoEl.width}×${photoEl.height} px (physical ~26×32 mm)`);

const marathiName = front.elements.find((e) => e.field === 'name_marathi');
const englishName = front.elements.find((e) => e.field === 'name_english');
assert(marathiName && marathiName.style.valueFontSize >= 20, `Marathi name is prominent (${marathiName.style.valueFontSize}px bold)`);
assert(englishName && englishName.style.valueFontSize >= 17, `English name is prominent (${englishName.style.valueFontSize}px bold)`);

const farmerIdHero = front.elements.find((e) => e.id === 'front_farmer_id_container');
assert(farmerIdHero && farmerIdHero.style.valueFontSize >= 26, `Farmer ID is a hero element (${farmerIdHero.style.valueFontSize}px bold pill)`);
assert(farmerIdHero.style.prefix === 'FARMER ID :', 'Farmer ID prefix matches "FARMER ID :"');

// 3. Lower Front Layout & Hierarchy
console.log('\n--- 3. Lower Front Deliberate Visual Hierarchy ---');
const registryEl = front.elements.find((e) => e.id === 'front_registry_subtitle');
const taglineEl = front.elements.find((e) => e.id === 'front_farmer_tagline');
const footerEl = front.elements.find((e) => e.id === 'front_footer_notice');

assert(registryEl && registryEl.text === 'Agriculture & Farmer Information Registry', 'Registry descriptor present');
assert(taglineEl && taglineEl.text === 'शेतकरी जगाचा पोशिंदा, बळीराजा आमचा अभिमान!', 'Tagline matches exact Marathi tribute');
assert(footerEl && footerEl.text.includes('NOT GOVERNMENT ISSUED'), 'Disclaimer clearly states PRIVATE REFERENCE • NOT GOVERNMENT ISSUED');
assert(farmerIdHero.y < registryEl.y && registryEl.y < taglineEl.y && taglineEl.y < footerEl.y, 'Strict vertical hierarchy: Farmer ID -> Registry -> Tagline -> Disclaimer');

// 4. Back Side: Dual-Language Compact Address
console.log('\n--- 4. Back Side: Compact Dual-Language Address ---');
const addressEl = back.elements.find((e) => e.type === 'address');
assert(addressEl, 'Back contains dedicated address element');
assert(addressEl.style.addressStyle === 'compact', 'Default address style is "compact" to maximize vertical space for land records');

// 5. Back Side: Multi-Record Land Table (1 to 5+ Records)
console.log('\n--- 5. Dynamic Land Records (1, 2, 3, 4, 5 Parcels) ---');
const tableEl = back.elements.find((e) => e.type === 'table');
assert(tableEl, 'Dynamic land table element present on back side');
assert(tableEl.tableConfig.maxRows >= 5, 'Table supports at least 5 visible records');

// Verify sample farmers exist with 1, 2, 3, 4, 5 records
const f1 = sampleFarmers.find((f) => f.land_records?.length === 1);
const f2 = sampleFarmers.find((f) => f.land_records?.length === 2);
const f3 = sampleFarmers.find((f) => f.land_records?.length === 3);
const f4 = sampleFarmers.find((f) => f.land_records?.length === 4);
const f5 = sampleFarmers.find((f) => f.land_records?.length === 5);

assert(f1 && f1.land_records.length === 1, `1-parcel farmer found: ${f1?.name_english} (${f1?.land_records?.[0]?.survey_no})`);
assert(f2 && f2.land_records.length === 2, `2-parcel farmer found: ${f2?.name_english} (${f2?.land_records?.map(r=>r.survey_no).join(', ')})`);
assert(f3 && f3.land_records.length === 3, `3-parcel farmer found: ${f3?.name_english} (${f3?.land_records?.map(r=>r.survey_no).join(', ')})`);
assert(f4 && f4.land_records.length === 4, `4-parcel farmer found: ${f4?.name_english} (${f4?.land_records?.map(r=>r.survey_no).join(', ')})`);
assert(f5 && f5.land_records.length === 5, `5-parcel farmer found: ${f5?.name_english} (${f5?.land_records?.map(r=>r.survey_no).join(', ')})`);

// Verify distinct surveys are never merged
const surveysF5 = f5.land_records.map(r => r.survey_no);
const uniqueSurveys = new Set(surveysF5);
assert(uniqueSurveys.size === 5, 'All 5 survey records remain individually identifiable (never merged into single string)');

console.log('\n====================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed} DESIGNER REFINEMENT TESTS PASSED! 🎉`);
  console.log('====================================================');
  process.exit(0);
} else {
  console.error(`❌ ${failed} TESTS FAILED.`);
  console.log('====================================================');
  process.exit(1);
}
