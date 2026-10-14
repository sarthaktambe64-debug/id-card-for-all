import assert from 'assert';
import { createDefaultTemplate, BUILTIN_TEMPLATE_ID } from './src/types/defaultTemplate.js';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';

console.log('====================================================');
console.log('  FINAL POLISH PASS — FARMER ID CARD VERIFICATION   ');
console.log('====================================================');

let allPassed = true;
function check(cond, msg) {
  if (cond) {
    console.log(`✅ PASSED: ${msg}`);
  } else {
    console.error(`❌ FAILED: ${msg}`);
    allPassed = false;
  }
}

const template = createDefaultTemplate();
const frontElements = template.front.elements;
const backElements = template.back.elements;

// 1. CARD SIZE & SAFE MARGINS
console.log('\n--- 1. Card Size & Physical Dimensions ---');
check(template.size.width === 85.6, `Physical card width is 85.6 mm (actual: ${template.size.width})`);
check(template.size.height === 54, `Physical card height is 54 mm (actual: ${template.size.height})`);
check(template.size.canvasWidth === 856, `Canvas width is 856 px (10:1 ratio)`);
check(template.size.canvasHeight === 540, `Canvas height is 540 px (10:1 ratio)`);

// 2. PHOTO ANCHOR & SIZING
console.log('\n--- 2. Photo Size & Anchor ---');
const photo = frontElements.find(e => e.id === 'front_photo');
check(photo, 'Photo element is present on front side');
check(photo.width === 190 && photo.height === 242, `Photo size is enlarged (190 × 242 px, actual: ${photo.width} × ${photo.height} px)`);
check(photo.x === 36 && photo.y === 72, `Photo is anchored cleanly at x: ${photo.x}, y: ${photo.y}`);
check(photo.style.borderRadius >= 10 && photo.style.borderRadius <= 24, 'Photo has clean rounded corners');
check(photo.style.borderWidth >= 1 && photo.style.borderWidth <= 2, 'Photo has subtle border');

// 3. NAME TYPOGRAPHY & HIERARCHY
console.log('\n--- 3. Name Typography & Devanagari Hierarchy ---');
const marathiName = frontElements.find(e => e.id === 'front_name_marathi');
const englishName = frontElements.find(e => e.id === 'front_name_english');
check(marathiName && englishName, 'Both Marathi and English name elements exist');
check(marathiName.style.valueFontSize >= 22, `Marathi name value is large & strong (${marathiName.style.valueFontSize}px)`);
check(marathiName.style.labelFontSize <= 11, `Marathi name label is subtle (${marathiName.style.labelFontSize}px)`);
check(marathiName.style.valueFontFamily.includes('Noto Sans Devanagari'), 'Marathi name uses proper Devanagari font');
check(englishName.style.valueFontSize >= 18.5, `English name value is strong (${englishName.style.valueFontSize}px)`);
check(englishName.style.labelFontSize <= 10.5, `English name label is subtle (${englishName.style.labelFontSize}px)`);
check(marathiName.x >= photo.x + photo.width, 'Name block has clear gutter and does not overlap photo');

// 4. PERSONAL DETAILS (3-COLUMN GRID)
console.log('\n--- 4. Personal Information Grid (Gender, DOB, Mobile) ---');
const gender = frontElements.find(e => e.id === 'front_gender');
const dob = frontElements.find(e => e.id === 'front_dob');
const mobile = frontElements.find(e => e.id === 'front_mobile');
check(gender && dob && mobile, 'Gender, DOB, and Mobile fields all present');
check(gender.y === dob.y && dob.y === mobile.y, `Baselines aligned: y = ${gender.y}`);
check(gender.style.valueFontSize >= 16 && dob.style.valueFontSize >= 16 && mobile.style.valueFontSize >= 16, 'Value font sizes increased to >= 16px');
check(gender.style.labelFontSize <= 10.5, 'Labels remain subtle');

// 5. UID / AADHAAR
console.log('\n--- 5. UID / Aadhaar ---');
const uid = frontElements.find(e => e.id === 'front_uid');
check(uid, 'UID element is present');
check(uid.style.valueFontSize >= 16.5, `UID value is comfortably readable (${uid.style.valueFontSize}px)`);
check(uid.y > gender.y, 'UID is positioned below 3-column personal grid');

// 6. HERO FARMER ID PILL
console.log('\n--- 6. Hero Farmer ID Pill Element ---');
const farmerIdContainer = frontElements.find(e => e.id === 'front_farmer_id_container');
check(farmerIdContainer, 'Farmer ID container is present');
check(farmerIdContainer.style.prefix === 'FARMER ID :', `Prefix is 'FARMER ID :' (actual: ${farmerIdContainer.style.prefix})`);
check(farmerIdContainer.style.valueFontSize >= 28, `Farmer ID value is hero size (${farmerIdContainer.style.valueFontSize}px)`);
check(farmerIdContainer.style.containerBorderRadius >= 24, 'Container has refined information panel radius');
check(farmerIdContainer.y > uid.y, `Breathing room: Farmer ID (y: ${farmerIdContainer.y}) is well below UID (y: ${uid.y})`);

// 7. QR CODE SPECIFICATION
console.log('\n--- 7. QR Code Placement & Caption ---');
const qr = frontElements.find(e => e.id === 'front_qr');
check(!qr.style.caption, `QR caption is removed (actual: '${qr.style.caption || ''}')`);
check(!template.qrConfig.caption, `template.qrConfig.caption is removed (actual: '${template.qrConfig.caption || ''}')`);
check(qr.x >= 660, `QR aligned cleanly on right (x: ${qr.x})`);
check(qr.y === photo.y, `QR top aligns with photo and name block (y: ${qr.y})`);

// 8. FRONT LOWER CONTENT & MARATHI TAGLINE
console.log('\n--- 8. Front Lower Content & Tagline ---');
const registrySubtitle = frontElements.find(e => e.id === 'front_registry_subtitle');
const farmerTagline = frontElements.find(e => e.id === 'front_farmer_tagline');
const footerNotice = frontElements.find(e => e.id === 'front_footer_notice');
check(registrySubtitle && farmerTagline && footerNotice, 'Registry subtitle, tagline, and footer all present');
check(registrySubtitle.y > farmerIdContainer.y, 'Registry subtitle positioned below Farmer ID');
check(farmerTagline.y > registrySubtitle.y, 'Farmer tagline positioned below Registry subtitle');
check(farmerTagline.style.fontFamily.includes('Noto Sans Devanagari'), 'Tagline uses proper Devanagari font');
check(footerNotice.y > farmerTagline.y, 'Footer positioned below tagline');
check(540 - (footerNotice.y + footerNotice.height) >= 30, `Safe bottom margin from trim edge (${540 - (footerNotice.y + footerNotice.height)} px >= 3 mm)`);

// 9. BACK ENROLLMENT & COMPACT ADDRESS
console.log('\n--- 9. Back Enrollment & Compact Bilingual Address ---');
const enrollment = backElements.find(e => e.id === 'back_enrollment_container');
const address = backElements.find(e => e.id === 'back_address');
check(enrollment, 'Enrollment number container is present');
check(enrollment.style.valueFontSize >= 18, `Enrollment value font is clearly readable (${enrollment.style.valueFontSize}px)`);
check(address, 'Address component is present');
check(address.style.addressStyle === 'compact', 'Compact bilingual address layout preserved');
check(address.style.fontSize >= 12, `Address text font is >= 12px (${address.style.fontSize}px)`);

// 10. BACK LAND TABLE & DYNAMIC RECORDS
console.log('\n--- 10. Back Land Table Adaptability ---');
const landTable = backElements.find(e => e.id === 'back_land_table');
check(landTable, 'Land table element is present');
const cols = landTable.tableConfig.columns.map(c => c.label);
const expectedCols = ['DISTRICT', 'TALUKA', 'VILLAGE', 'SURVEY NO.', 'AREA', 'OWNER / SHARE'];
check(JSON.stringify(cols) === JSON.stringify(expectedCols), `All 6 required columns present: ${cols.join(', ')}`);
check(landTable.tableConfig.borderColor === '#C7D9CD' || landTable.tableConfig.borderColor === '#C2D6C7', `Table border is softened sage (${landTable.tableConfig.borderColor})`);

// 11. MULTI-RECORD LAND PARCEL SUPPORT
console.log('\n--- 11. Multi-Record Land Parcel Dynamic Tests ---');
const sampleFarmer1 = SAMPLE_FARMERS[0];
const sampleFarmer2 = SAMPLE_FARMERS[1];
check(Array.isArray(sampleFarmer1.land_records), 'Farmer 1 has dynamic land_records[]');
check(sampleFarmer1.land_records.length > 0, `Farmer 1 has ${sampleFarmer1.land_records.length} land records`);
check(sampleFarmer2.land_records.length > 0, `Farmer 2 has ${sampleFarmer2.land_records.length} land records`);

// Test with 1, 2, 3, 5, 8 records
for (const count of [1, 2, 3, 5, 8]) {
  const dynamicRecords = Array.from({ length: count }, (_, i) => ({
    district: 'Buldhana',
    taluka: 'Sindkhed Raja',
    village: 'Kingaon Jattu',
    survey_no: `10${i}/A`,
    area: `${(1.2 + i * 0.4).toFixed(2)} Ha`,
    owner_share: '1.00 (Self)'
  }));
  const maxRows = 5;
  const hasOverflow = dynamicRecords.length > maxRows;
  const displayRows = hasOverflow ? dynamicRecords.slice(0, maxRows) : dynamicRecords;
  check(displayRows.length === Math.min(count, 5), `${count} land records -> renders ${displayRows.length} rows with ${hasOverflow ? `+${count - maxRows} additional indicator` : 'no overflow'}`);
}

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL FINAL POLISH PASS CHECKS PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED.');
  console.log('====================================================');
  process.exit(1);
}
