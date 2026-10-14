import QRCode from 'qrcode';
import fs from 'fs';

async function main() {
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<PrintLetterBarcodeData uid="971095127245" name="Raisabi Mahabub Sayyad" gender="F" yob="1986" co="" vtc="Vihamandwa" po="Bihamandwa" dist="Aurangabad" subdist="Paithan" state="Maharashtra" pc="431137" dob="06/06/1986"/>';

  await QRCode.toFile('public/qr_aadhaar_xml.png', xml, {
    errorCorrectionLevel: 'M',
    margin: 1,
    width: 800
  });
  console.log('Generated public/qr_aadhaar_xml.png');

  if (fs.existsSync('decoded_ref_qr.txt')) {
    const refData = fs.readFileSync('decoded_ref_qr.txt', 'utf8').trim();
    await QRCode.toFile('public/qr_aadhaar_dense.png', refData, {
      errorCorrectionLevel: 'L',
      margin: 1,
      width: 800
    });
    console.log('Generated public/qr_aadhaar_dense.png');
  }
}

main().catch(console.error);
