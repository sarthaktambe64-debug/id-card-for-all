import assert from 'assert';
import { createDefaultTemplate, BUILTIN_TEMPLATE_ID } from './src/types/defaultTemplate.js';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';

console.log('====================================================');
console.log('  FINAL VISUAL ART DIRECTION VERIFICATION SUITE      ');
console.log('====================================================\n');

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

// 1. CONTROLLED PALETTE & BASE COLOR
console.log('--- 1. Controlled Agricultural Color Palette ---');
check(template.front.background.color === '#FBF8EE', `Front base background is warm ivory #FBF8EE (actual: ${template.front.background.color})`);
check(template.back.background.color === '#FBF8EE', `Back base background is warm ivory #FBF8EE (actual: ${template.back.background.color})`);
check(template.front.background.headerColor === '#245F3D', `Primary green is #245F3D (actual: ${template.front.background.headerColor})`);
check(template.front.background.goldAccentColor === '#D4B14A', `Muted gold accent is #D4B14A (actual: ${template.front.background.goldAccentColor})`);

// 2. CORNER SYSTEM (PHYSICAL 85.6 × 54 MM CR80 STANDARD)
console.log('\n--- 2. Unified Physical Corner System ---');
check(template.size.canvasWidth === 856 && template.size.canvasHeight === 540, 'Canvas is 856 × 540 px (CR80 standard 10:1 ratio)');
const photo = frontElements.find(e => e.id === 'front_photo');
check(photo.style.borderRadius >= 20 && photo.style.borderRadius <= 30, `Photo corner radius is 2–3 mm (actual: ${photo.style.borderRadius} px = ${(photo.style.borderRadius / 10).toFixed(1)} mm)`);
const qr = frontElements.find(e => e.id === 'front_qr');
check(qr.style.borderRadius >= 20 && qr.style.borderRadius <= 30, `QR container radius is 2–3 mm (actual: ${qr.style.borderRadius} px = ${(qr.style.borderRadius / 10).toFixed(1)} mm)`);
const farmerId = frontElements.find(e => e.id === 'front_farmer_id_container');
check(farmerId.style.containerBorderRadius >= 20 && farmerId.style.containerBorderRadius <= 30, `Farmer ID panel radius is 2–3 mm (actual: ${farmerId.style.containerBorderRadius} px = ${(farmerId.style.containerBorderRadius / 10).toFixed(1)} mm)`);
const enrollment = backElements.find(e => e.id === 'back_enrollment_container');
check(enrollment.style.containerBorderRadius >= 20 && enrollment.style.containerBorderRadius <= 30, `Enrollment container radius is 2–3 mm (actual: ${enrollment.style.containerBorderRadius} px = ${(enrollment.style.containerBorderRadius / 10).toFixed(1)} mm)`);

// 3. FRONT/BACK ASYMMETRIC SEPARATION & ZONE B CLEANLINESS
console.log('\n--- 3. Visual Zones & Layout Integrity ---');
const marathiName = frontElements.find(e => e.id === 'front_name_marathi');
const englishName = frontElements.find(e => e.id === 'front_name_english');
const uid = frontElements.find(e => e.id === 'front_uid');
check(marathiName.style.valueColor === '#245F3D', 'Marathi name value uses primary green #245F3D');
check(englishName.style.valueColor === '#245F3D', 'English name value uses primary green #245F3D');
check(uid.style.valueColor === '#243C34', 'UID value uses deep text color #243C34');

const gender = frontElements.find(e => e.id === 'front_gender');
const dob = frontElements.find(e => e.id === 'front_dob');
const mobile = frontElements.find(e => e.id === 'front_mobile');
check(gender.style.valueColor === '#243C34', 'Gender value uses deep text color #243C34');
check(dob.style.valueColor === '#243C34', 'DOB value uses deep text color #243C34');
check(mobile.style.valueColor === '#243C34', 'Mobile value uses deep text color #243C34');

// 4. BACK SIDE CLEAN ZONE (TOP 60% CLEAN FOR LAND TABLE & ADDRESS)
console.log('\n--- 4. Back Side Clean Zone for Land Table ---');
const address = backElements.find(e => e.id === 'back_address');
const landTable = backElements.find(e => e.id === 'back_land_table');
check(address.style.textColor === '#243C34', 'Address text uses deep text color #243C34');
check(landTable.tableConfig.headerBg === '#245F3D', 'Land table header uses primary green #245F3D');
check(landTable.tableConfig.textColor === '#243C34', 'Land table cell text uses deep text color #243C34');
check(landTable.tableConfig.borderColor === '#C7D9CD', 'Land table border uses softened sage #C7D9CD');

// 5. MARATHI TAGLINE & FOOTER
console.log('\n--- 5. Tagline & Footer Styling ---');
const tagline = frontElements.find(e => e.id === 'front_farmer_tagline');
const frontFooter = frontElements.find(e => e.id === 'front_footer_notice');
const backFooter = backElements.find(e => e.id === 'back_footer_notice');
check(tagline.style.color === '#245F3D', 'Farmer tagline uses primary green #245F3D');
check(frontFooter.style.color === '#4C8157', 'Front footer notice uses secondary green #4C8157');
check(backFooter.style.color === '#4C8157', 'Back footer notice uses secondary green #4C8157');

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL FINAL VISUAL ART DIRECTION CHECKS PASSED! 🎉');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED.');
  console.log('====================================================');
  process.exit(1);
}
