import QRCode from 'qrcode';
import jsQR from 'jsqr';

export const QR_SOURCE_OPTIONS = [
  { value: 'farmer_id', label: 'Farmer ID', type: 'field' },
  { value: 'uid', label: 'UID / Aadhaar', type: 'field' },
  { value: 'farmer_enrollment_number', label: 'Farmer Enrollment Number', type: 'field' },
  { value: 'mobile', label: 'Mobile Number', type: 'field' },
  { value: 'custom', label: 'Custom Text', type: 'custom' },
  { value: 'multiple', label: 'Multiple Fields', type: 'multiple' },
  { value: 'url', label: 'Verification URL', type: 'url' }
];

export const AVAILABLE_MULTIPLE_FIELDS = [
  { key: 'farmer_id', label: 'Farmer ID', prefix: 'Farmer ID' },
  { key: 'name_english', label: 'Name (English)', prefix: 'Name' },
  { key: 'name_marathi', label: 'Name (Marathi)', prefix: 'नाव' },
  { key: 'farmer_enrollment_number', label: 'Farmer Enrollment Number', prefix: 'Enrollment' },
  { key: 'mobile', label: 'Mobile Number', prefix: 'Mobile' },
  { key: 'uid', label: 'UID / Aadhaar', prefix: 'UID' },
  { key: 'dob', label: 'Date of Birth', prefix: 'DOB' },
  { key: 'village', label: 'Village', prefix: 'Village' },
  { key: 'taluka', label: 'Taluka', prefix: 'Taluka' },
  { key: 'district', label: 'District', prefix: 'District' }
];

export const DEFAULT_MULTIPLE_FIELDS = [
  'farmer_id',
  'name_english',
  'farmer_enrollment_number'
];

export const DEFAULT_CUSTOM_TEMPLATE = `FARMER CARD
Farmer ID: {{farmer_id}}
Name: {{name_english}}`;

export const DEFAULT_VERIFICATION_URL = 'https://krishiseva.gov.in/verify/{{farmer_id}}';

/**
 * Resolves the QR payload based on the template QR configuration and farmer record.
 * Never leaks data into template; dynamically evaluated at render time.
 */
export function resolveQrPayload(qrConfig = {}, farmer = {}) {
  const sourceField = qrConfig.sourceField || 'farmer_id';
  const sourceType = qrConfig.sourceType || 
    (sourceField === 'custom' ? 'custom' : 
     sourceField === 'multiple' ? 'multiple' : 
     sourceField === 'url' ? 'url' : 'field');

  // 1. Single Field Binding
  if (sourceType === 'field' || ['farmer_id', 'uid', 'farmer_enrollment_number', 'mobile'].includes(sourceField)) {
    const fieldMap = {
      farmer_id: { label: 'Farmer ID', val: farmer?.farmer_id },
      uid: { label: 'UID / Aadhaar', val: farmer?.uid },
      farmer_enrollment_number: { label: 'Farmer Enrollment Number', val: farmer?.farmer_enrollment_number },
      mobile: { label: 'Mobile Number', val: farmer?.mobile }
    };

    const target = fieldMap[sourceField] || { label: sourceField, val: farmer?.[sourceField] };
    const rawVal = target.val ? String(target.val).trim() : '';

    if (!rawVal) {
      return {
        payload: '',
        isMissing: true,
        missingField: target.label,
        message: `QR unavailable — ${target.label} is missing.`
      };
    }

    return {
      payload: rawVal,
      isMissing: false,
      missingField: null,
      message: null
    };
  }

  // 2. Custom Text Binding with {{placeholder}} interpolation
  if (sourceType === 'custom' || sourceField === 'custom') {
    const template = qrConfig.customText || DEFAULT_CUSTOM_TEMPLATE;
    if (!template.trim()) {
      return {
        payload: '',
        isMissing: true,
        missingField: 'Custom Text',
        message: 'QR unavailable — Custom text template is empty.'
      };
    }

    // Replace {{key}} placeholders
    let resolved = template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const val = farmer?.[key];
      return val !== undefined && val !== null ? String(val).trim() : '';
    });

    resolved = resolved.trim();
    if (!resolved) {
      return {
        payload: '',
        isMissing: true,
        missingField: 'Custom Text',
        message: 'QR unavailable — Custom template generated empty content.'
      };
    }

    return {
      payload: resolved,
      isMissing: false,
      missingField: null,
      message: null
    };
  }

  // 3. Multiple Fields Controlled Selection
  if (sourceType === 'multiple' || sourceField === 'multiple') {
    const selectedKeys = qrConfig.multipleFields && qrConfig.multipleFields.length > 0
      ? qrConfig.multipleFields
      : DEFAULT_MULTIPLE_FIELDS;

    const lines = [];
    selectedKeys.forEach(key => {
      const fieldDef = AVAILABLE_MULTIPLE_FIELDS.find(f => f.key === key);
      const label = fieldDef?.prefix || key;
      const val = farmer?.[key];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        lines.push(`${label}: ${String(val).trim()}`);
      }
    });

    if (lines.length === 0) {
      return {
        payload: '',
        isMissing: true,
        missingField: 'Multiple Fields',
        message: 'QR unavailable — Selected fields are missing in farmer record.'
      };
    }

    return {
      payload: lines.join('\n'),
      isMissing: false,
      missingField: null,
      message: null
    };
  }

  // 4. Verification URL Binding
  if (sourceType === 'url' || sourceField === 'url') {
    const urlPattern = qrConfig.urlPattern || qrConfig.customText || DEFAULT_VERIFICATION_URL;
    const farmerId = farmer?.farmer_id ? String(farmer.farmer_id).trim() : '';

    if (!farmerId) {
      return {
        payload: '',
        isMissing: true,
        missingField: 'Farmer ID',
        message: 'QR unavailable — Farmer ID is missing for verification URL.',
        isUrl: true,
        warning: 'Verification URL requires an online verification service.'
      };
    }

    const resolvedUrl = urlPattern
      .replace(/\{\{\s*farmer_id\s*\}\}/g, encodeURIComponent(farmerId))
      .replace(/\{\{\s*id\s*\}\}/g, encodeURIComponent(farmerId));

    return {
      payload: resolvedUrl,
      isMissing: false,
      missingField: null,
      message: null,
      isUrl: true,
      warning: 'Verification URL requires an online verification service.'
    };
  }

  // Fallback
  return {
    payload: '',
    isMissing: true,
    missingField: 'Data Binding',
    message: 'QR unavailable — Data source not configured.'
  };
}

/**
 * Generates high-resolution QR Data URL in memory
 */
export async function generateQrCodeDataUrl(payload, options = {}) {
  if (!payload) return '';

  const {
    errorCorrection = 'Q',
    margin = 4,
    foregroundColor = '#000000',
    backgroundColor = '#FFFFFF',
    width = 512
  } = options;

  return new Promise((resolve, reject) => {
    QRCode.toDataURL(payload, {
      width,
      margin,
      color: {
        dark: foregroundColor,
        light: backgroundColor
      },
      errorCorrectionLevel: errorCorrection
    }, (err, url) => {
      if (err) return reject(err);
      resolve(url);
    });
  });
}

/**
 * Programmatically decodes a QR code data URL using jsQR
 * Useful for automated verification, tests, and developer inspector
 */
export async function decodeQrDataUrl(dataUrl) {
  if (!dataUrl) {
    return { success: false, data: null, error: 'Empty data URL' };
  }

  return new Promise((resolve) => {
    // In Browser environment
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            resolve({
              success: true,
              data: code.data,
              error: null,
              location: code.location
            });
          } else {
            resolve({
              success: false,
              data: null,
              error: 'No QR code pattern detected by scanner'
            });
          }
        } catch (err) {
          resolve({
            success: false,
            data: null,
            error: err.message
          });
        }
      };
      img.onerror = () => {
        resolve({ success: false, data: null, error: 'Failed to load image for scanning' });
      };
      img.src = dataUrl;
    } else {
      // In Node environment
      resolve({ success: false, data: null, error: 'DOM not available for image decoding' });
    }
  });
}
