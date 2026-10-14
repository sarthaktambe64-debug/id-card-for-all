import fs from 'fs';
import path from 'path';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';
import { resolveQrPayload } from './src/services/qrHelper.js';
import { parseFarmerRegistrationPDF } from './src/services/pdfParser.js';

async function run() {
  console.log('--- VERIFYING BHARAT RAJABHAU PAWAR FARMER RECORD & CARD GENERATION ---');
  let passed = 0;
  let failed = 0;

  function assert(desc, condition) {
    if (condition) {
      console.log(`✓ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`✗ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Check in SAMPLE_FARMERS
  const bharat = SAMPLE_FARMERS.find(f => f.farmer_id === '65940671942');
  assert('Bharat Rajabhau Pawar found in SAMPLE_FARMERS', !!bharat);
  assert('Farmer ID matches 65940671942', bharat?.farmer_id === '65940671942');
  assert('Enrollment number matches 27_469_4141_549551_005301', bharat?.farmer_enrollment_number === '27_469_4141_549551_005301');
  assert('English Name is Bharat Rajabhau Pawar', bharat?.name_english === 'Bharat Rajabhau Pawar');
  assert('Marathi Name is भरत राजाभाऊ पवार', bharat?.name_marathi === 'भरत राजाभाऊ पवार');
  assert('Mobile is 9422529424', bharat?.mobile === '9422529424');
  assert('DOB is 01/01/1958', bharat?.dob === '01/01/1958');
  assert('Photo path is /bharat_pawar_photo.jpg', bharat?.photo === '/bharat_pawar_photo.jpg');

  // 2. Photo asset in public directory
  const photoFile = path.resolve('public/bharat_pawar_photo.jpg');
  assert('Photo asset exists in public folder', fs.existsSync(photoFile));
  if (fs.existsSync(photoFile)) {
    const stats = fs.statSync(photoFile);
    assert('Photo has valid non-zero byte size', stats.size > 5000);
  }

  // 3. Land records
  assert('Has exactly 2 land parcels', bharat?.land_records?.length === 2);
  const p1 = bharat?.land_records?.[0];
  const p2 = bharat?.land_records?.[1];
  assert('Parcel 1 is Survey 9 with 1.2500 Ha', p1?.survey_no === '9' && p1?.area.includes('1.2500'));
  assert('Parcel 2 is Survey 130/3 with 1.2400 Ha', p2?.survey_no === '130/3' && p2?.area.includes('1.2400'));

  // 4. Dynamic QR code binding
  const qrRes = resolveQrPayload({ sourceField: 'farmer_id' }, bharat);
  assert('Dynamic QR code binds to 65940671942', qrRes?.payload === '65940671942');

  // 5. Test PDF parser with uploaded file
  const uploadedPdfPath = 'C:/Users/sarth/.gemini/antigravity-ide/brain/22cb536e-df15-431e-aaf0-9412db7633be/.user_uploaded/media_1791521711560.pdf';
  if (fs.existsSync(uploadedPdfPath)) {
    const pdfBuf = fs.readFileSync(uploadedPdfPath);
    const parsed = await parseFarmerRegistrationPDF(pdfBuf);
    assert('PDF Parser correctly identifies Bharat Pawar', parsed?.farmer_id === '65940671942');
    assert('PDF Parser extracts full name', parsed?.name_english === 'Bharat Rajabhau Pawar');
    assert('PDF Parser extracts mobile', parsed?.mobile === '9422529424');
    assert('PDF Parser extracts 2 land parcels', parsed?.land_records?.length === 2);
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

run();
