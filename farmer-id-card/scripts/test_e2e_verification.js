import { createDefaultTemplate, BUILTIN_TEMPLATE_ID } from './src/types/defaultTemplate.js';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';
import { extractFarmerDataFromText } from './src/services/pdfParser.js';
import QRCode from 'qrcode';

console.log('=== RUNNING FARMER ID CARD SYSTEM VERIFICATION ===\n');

// 1. Template Model Verification
console.log('1. Checking Template Model:');
const tpl = createDefaultTemplate();
console.log(' - Template ID:', tpl.templateId);
console.log(' - Template Name:', tpl.name);
console.log(' - Card Dimensions:', tpl.size.width, 'x', tpl.size.height, tpl.size.unit);
console.log(' - Front Elements:', tpl.front.elements.length);
console.log(' - Back Elements:', tpl.back.elements.length);

if (tpl.templateId !== BUILTIN_TEMPLATE_ID || tpl.name !== 'Farmer ID Card – Front & Back') {
  throw new Error('Template name / ID mismatch');
}

// Check required dynamic front fields
const frontFields = tpl.front.elements.map(e => e.field || e.type);
const requiredFront = ['photo', 'farmer_id', 'name_marathi', 'name_english', 'dob', 'gender', 'mobile', 'uid', 'qr'];
for (const rf of requiredFront) {
  const found = tpl.front.elements.some(e => e.field === rf || e.type === rf);
  console.log(`   - Front field [${rf}]: ${found ? 'FOUND ✓' : 'MISSING ✗'}`);
  if (!found) throw new Error(`Missing front field ${rf}`);
}

// Check disclaimer
const disclaimer = tpl.front.elements.find(e => e.text && e.text.includes('PRIVATE REFERENCE • NOT GOVERNMENT ISSUED'));
console.log(`   - Disclaimer text: ${disclaimer ? 'FOUND ✓' : 'MISSING ✗'}`);
if (!disclaimer) throw new Error('Missing mandatory disclaimer');

// Check required back fields
const requiredBack = ['farmer_enrollment_number', 'village', 'taluka', 'district', 'pincode', 'land_records'];
for (const rb of requiredBack) {
  const found = tpl.back.elements.some(e => e.field === rb || e.type === rb);
  console.log(`   - Back field [${rb}]: ${found ? 'FOUND ✓' : 'MISSING ✗'}`);
  if (!found) throw new Error(`Missing back field ${rb}`);
}

// 2. Separation of Template and Farmer Data Verification
console.log('\n2. Checking Separation of Template vs Farmer Data:');
const tplStr = JSON.stringify(tpl);
const hasHardcodedName = tplStr.includes('Vilas') || tplStr.includes('38533702295');
console.log(' - Template contains NO hardcoded farmer records:', !hasHardcodedName ? 'CONFIRMED ✓' : 'FAILED ✗');
if (hasHardcodedName) throw new Error('Template contains hardcoded farmer data');

// 3. Sample Farmers Verification
console.log('\n3. Checking Sample Farmers:');
console.log(' - Total Sample Farmers:', SAMPLE_FARMERS.length);
SAMPLE_FARMERS.forEach((f, idx) => {
  console.log(`   Farmer ${idx + 1}: ${f.name_english} (${f.name_marathi}) | ID: ${f.farmer_id} | Parcels: ${f.land_records.length}`);
});

// 4. Local Dynamic QR Code Generation
console.log('\n4. Checking Dynamic Client-Side QR Generation:');
async function testQR() {
  for (const f of SAMPLE_FARMERS) {
    const dataUrl = await QRCode.toDataURL(f.farmer_id);
    console.log(`   QR generated for ${f.name_english} (${f.farmer_id}): length = ${dataUrl.length} bytes ✓`);
  }
}
await testQR();

// 5. PDF Extraction Verification
console.log('\n5. Checking PDF Auto-Fill Parsing Heuristics:');
const samplePdfText = `
Farmer Registration Form
Farmer enrollment number: 27_469_4141_549554_005672
Farmer ID: 38533702295
Farmer Name as per Aadhaar in English: Vilas Sopanrao Tupkari
Farmer's Name in Local Language: विलास सोपान तुपकरी
Gender: Male
Date of Birth: 10/10/1977
Mobile Number: 9423455585
Address In English: VIHAMANDWA
Address In Local Language: विहामांडवा
District: Chhatrapati Sambhajinagar
Sub District: Paithan
Village: Vihamandwa
Pincode: 431137
Survey No.: 79
Extent Total Area: 0.040000
`;
const extracted = extractFarmerDataFromText(samplePdfText);
console.log(' - Extracted Farmer ID:', extracted.farmer_id);
console.log(' - Extracted Enrollment:', extracted.farmer_enrollment_number);
console.log(' - Extracted Name English:', extracted.name_english);
console.log(' - Extracted Name Marathi:', extracted.name_marathi);
console.log(' - Extracted DOB:', extracted.dob);
console.log(' - Extracted Mobile:', extracted.mobile);
console.log(' - Extracted Village:', extracted.village);
console.log(' - Extracted Taluka:', extracted.taluka);
console.log(' - Extracted District:', extracted.district);
console.log(' - Extracted Land Records:', extracted.land_records.length);

if (extracted.farmer_id !== '38533702295' || extracted.name_english !== 'Vilas Sopanrao Tupkari') {
  throw new Error('PDF extraction failed');
}

console.log('\n=== ALL END-TO-END SPECIFICATIONS VERIFIED SUCCESSFULLY! ===');
