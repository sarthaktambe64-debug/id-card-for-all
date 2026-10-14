/**
 * Default Built-in Template Definition:
 * "Farmer ID Card – Front & Back" (Premium Physical PVC Standard)
 *
 * Implements Major Visual Correction:
 * - 85.6 mm × 54 mm physical card standard (856 × 540 px, 10:1 ratio)
 * - Safe 2.5–3 mm margins from card trim edge
 * - Warm ivory/cream base (#FBF8EE) with subtle paper-like variation
 * - Restrained Agricultural Color Palette:
 *     Base:                   #FBF8EE
 *     Agricultural Green:     #245F3D
 *     Pale Green:             #DCE7D7
 *     Very Pale Green:        #EAF0E5
 *     Muted Gold:             #D4B14A
 *     Background Line Green:  #C9D8C6
 *     Background Gold:        #E6D69B
 *     Deep Text:              #243C34
 * - Front: AgriStack logo + Farmer ID Card title, enlarged photo anchor (190 × 242 px, 2.4 mm radius),
 *   high-hierarchy Marathi & English names, 3-column personal details grid,
 *   Hero Farmer ID panel (2.6 mm radius), registry descriptor, Marathi farmer tagline, and subtle footer.
 * - Back: AgriStack logo + Farmer Details title, large Enrollment No. (2.4 mm radius),
 *   Compact Dual-Language Address block, and
 *   Dynamic Land Table supporting 1 to 5+ individual survey records with auto-fitting height (2.0 mm outer radius).
 */

export const BUILTIN_TEMPLATE_ID = 'farmer-id-card-v1';

export const createDefaultTemplate = () => ({
  templateId: BUILTIN_TEMPLATE_ID,
  name: 'Farmer ID Card – Front & Back',
  version: 14,
  category: 'Agricultural Reference',
  description: 'Production-ready Farmer ID card template designed strictly to the physical 85.6 × 54 mm standard with bilingual Marathi & English typography, dynamic QR, AgriStack branding, compact dual-language address, and multi-record dynamic Land Table.',
  isBuiltin: true,
  createdAt: '2026-10-08T10:00:00.000Z',
  updatedAt: new Date().toISOString(),
  size: {
    width: 85.6,
    height: 54,
    unit: 'mm',
    canvasWidth: 856,
    canvasHeight: 540
  },
  addressStyle: 'compact',
  qrConfig: {
    sourceType: 'field',
    sourceField: 'farmer_id',
    errorCorrection: 'Q',
    size: 20,
    margin: 4,
    foregroundColor: '#000000',
    backgroundColor: '#FFFFFF',
    caption: '',
    captionFontSize: 10,
    multipleFields: ['farmer_id', 'name_english', 'farmer_enrollment_number'],
    customText: 'FARMER CARD\nFarmer ID: {{farmer_id}}\nName: {{name_english}}',
    urlPattern: 'https://krishiseva.gov.in/verify/{{farmer_id}}'
  },
  front: {
    background: {
      type: 'agricultural-vector',
      color: '#FBF8EE',
      opacity: 1,
      brightness: 100,
      contrast: 100,
      imageUrl: '',
      imageScale: 1,
      imagePositionX: 0,
      imagePositionY: 0,
      locked: true,
      showDecorative: true,
      decorativeOpacity: 1,
      watermarkOpacity: 0.85,
      headerColor: '#245F3D',
      goldAccentColor: '#D4B14A',
      showBottomAccent: false,
      showSolidHeader: false,
      showInnerKeyline: true
    },
    elements: [
      // 1. AgriStack Brand Logo (Top-Left)
      {
        id: 'front_logo_agristack',
        type: 'image',
        role: 'brand-logo',
        name: 'AgriStack Logo',
        assetId: 'agristack-logo',
        src: '/agristack_logo.png',
        x: 36,
        y: 14,
        width: 126,
        height: 35,
        rotation: 0,
        locked: false,
        style: {
          opacity: 1,
          borderRadius: 0
        }
      },

      // 2. Header Title (Beside AgriStack Logo)
      {
        id: 'front_header_title',
        type: 'text',
        name: 'Header Title',
        text: 'FARMER ID CARD',
        x: 176,
        y: 16,
        width: 644,
        height: 36,
        rotation: 0,
        locked: true,
        style: {
          fontSize: 22,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          color: '#245F3D',
          letterSpacing: '2px',
          textAlign: 'left'
        }
      },

      // 3. Farmer Photograph (Primary Visual Anchor on Left: 190 × 242 px, 2.4 mm radius)
      {
        id: 'front_photo',
        type: 'photo',
        name: 'Farmer Photograph',
        field: 'photo',
        x: 36,
        y: 72,
        width: 190,
        height: 242,
        rotation: 0,
        locked: false,
        style: {
          borderWidth: 1.5,
          borderColor: '#C7D9CD',
          borderRadius: 24,
          backgroundColor: '#FAF6ED'
        }
      },

      // 4. Name (Marathi) - Strong Personal Hierarchy
      {
        id: 'front_name_marathi',
        type: 'field',
        name: 'Name Marathi',
        label: 'नाव (मराठी)',
        field: 'name_marathi',
        x: 240,
        y: 72,
        width: 416,
        height: 46,
        rotation: 0,
        locked: false,
        style: {
          labelFontSize: 10.5,
          labelFontFamily: "'Noto Sans Devanagari', 'Mukta', sans-serif",
          labelFontWeight: 700,
          labelColor: '#4C8157',
          valueFontSize: 23,
          valueFontFamily: "'Noto Sans Devanagari', 'Mukta', sans-serif",
          valueFontWeight: 800,
          valueColor: '#245F3D',
          showUnderline: false
        }
      },

      // 5. Name (English)
      {
        id: 'front_name_english',
        type: 'field',
        name: 'Name English',
        label: 'Name (English)',
        field: 'name_english',
        x: 240,
        y: 122,
        width: 416,
        height: 42,
        rotation: 0,
        locked: false,
        style: {
          labelFontSize: 10,
          labelFontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
          labelFontWeight: 700,
          labelColor: '#4C8157',
          valueFontSize: 19,
          valueFontFamily: "'Plus Jakarta Sans', 'Outfit', sans-serif",
          valueFontWeight: 700,
          valueColor: '#245F3D',
          showUnderline: false
        }
      },

      // 6. Gender / लिंग (Row 1 of Personal Grid)
      {
        id: 'front_gender',
        type: 'field',
        name: 'Gender',
        label: 'Gender / लिंग',
        field: 'gender',
        x: 240,
        y: 172,
        width: 130,
        height: 42,
        rotation: 0,
        locked: false,
        style: {
          labelFontSize: 10,
          labelFontWeight: 700,
          labelColor: '#4C8157',
          valueFontSize: 16,
          valueFontWeight: 700,
          valueColor: '#243C34',
          showUnderline: false
        }
      },

      // 7. DOB / जन्मतारीख (Row 1 of Personal Grid)
      {
        id: 'front_dob',
        type: 'field',
        name: 'Date of Birth',
        label: 'DOB / जन्मतारीख',
        field: 'dob',
        x: 380,
        y: 172,
        width: 130,
        height: 42,
        rotation: 0,
        locked: false,
        style: {
          labelFontSize: 10,
          labelFontWeight: 700,
          labelColor: '#4C8157',
          valueFontSize: 16,
          valueFontWeight: 700,
          valueColor: '#243C34',
          showUnderline: false
        }
      },

      // 8. Mobile Number (Row 1 of Personal Grid)
      {
        id: 'front_mobile',
        type: 'field',
        name: 'Mobile Number',
        label: 'Mobile No.',
        field: 'mobile',
        x: 520,
        y: 172,
        width: 136,
        height: 42,
        rotation: 0,
        locked: false,
        style: {
          labelFontSize: 10,
          labelFontWeight: 700,
          labelColor: '#4C8157',
          valueFontSize: 16,
          valueFontWeight: 700,
          valueColor: '#243C34',
          showUnderline: false
        }
      },

      // 9. UID / Aadhaar (Row 2 of Personal Grid)
      {
        id: 'front_uid',
        type: 'field',
        name: 'UID / Aadhaar',
        label: 'UID / Aadhaar',
        field: 'uid',
        x: 240,
        y: 226,
        width: 416,
        height: 42,
        rotation: 0,
        locked: false,
        style: {
          labelFontSize: 10,
          labelFontWeight: 700,
          labelColor: '#4C8157',
          valueFontSize: 17,
          valueFontWeight: 700,
          valueColor: '#243C34',
          letterSpacing: '1.2px',
          showUnderline: false
        }
      },

      // 10. QR Code Anchor on Right (152 × 172 px, ~19–22 mm physical footprint, 2.4 mm radius)
      {
        id: 'front_qr',
        type: 'qr',
        name: 'QR Code',
        x: 668,
        y: 72,
        width: 152,
        height: 172,
        rotation: 0,
        locked: false,
        style: {
          borderWidth: 1.2,
          borderColor: '#C7D9CD',
          borderRadius: 24,
          padding: 6,
          caption: '',
          captionFontSize: 10,
          backgroundColor: '#FFFFFF',
          boxShadow: 'none'
        }
      },

      // 11. Hero Element: Prominent Centered Farmer ID Panel (2.6 mm radius)
      {
        id: 'front_farmer_id_container',
        type: 'field_container',
        name: 'Farmer ID',
        label: '',
        field: 'farmer_id',
        x: 44,
        y: 326,
        width: 768,
        height: 60,
        rotation: 0,
        locked: false,
        style: {
          prefix: 'FARMER ID :',
          prefixColor: '#245F3D',
          valueFontSize: 29,
          valueFontFamily: "'Plus Jakarta Sans', monospace",
          valueFontWeight: 800,
          valueColor: '#245F3D',
          letterSpacing: '2.5px',
          textAlign: 'center',
          containerBg: '#FFFFFF',
          containerBorderColor: '#A4CBB0',
          containerBorderWidth: 1.2,
          containerBorderRadius: 26,
          boxShadow: 'none'
        }
      },

      // 12. Supporting Registry Descriptor Text
      {
        id: 'front_registry_subtitle',
        type: 'text',
        name: 'Registry Subtitle',
        text: 'Agriculture & Farmer Information Registry',
        x: 44,
        y: 400,
        width: 768,
        height: 22,
        rotation: 0,
        locked: true,
        style: {
          fontSize: 13,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 700,
          color: '#4C8157',
          letterSpacing: '1px',
          textAlign: 'center'
        }
      },

      // 13. Marathi Farmer Tagline
      {
        id: 'front_farmer_tagline',
        type: 'text',
        role: 'tagline',
        name: 'Farmer Tagline (मराठी)',
        text: 'शेतकरी जगाचा पोशिंदा, बळीराजा आमचा अभिमान!',
        x: 44,
        y: 450,
        width: 768,
        height: 26,
        rotation: 0,
        locked: false,
        style: {
          fontSize: 14.5,
          fontFamily: "'Noto Sans Devanagari', 'Mukta', sans-serif",
          fontWeight: 700,
          color: '#245F3D',
          textAlign: 'center',
          letterSpacing: '0.5px'
        }
      },

      // 14. Non-Government Footer Notice
      {
        id: 'front_footer_notice',
        type: 'text',
        name: 'Footer Notice',
        text: 'PRIVATE REFERENCE • NOT GOVERNMENT ISSUED',
        x: 44,
        y: 488,
        width: 768,
        height: 20,
        rotation: 0,
        locked: true,
        style: {
          fontSize: 10.5,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          color: '#4C8157',
          textAlign: 'center',
          letterSpacing: '1px'
        }
      }
    ]
  },
  back: {
    background: {
      type: 'agricultural-vector',
      color: '#FBF8EE',
      opacity: 1,
      brightness: 100,
      contrast: 100,
      imageUrl: '',
      imageScale: 1,
      imagePositionX: 0,
      imagePositionY: 0,
      locked: true,
      showDecorative: true,
      decorativeOpacity: 1,
      watermarkOpacity: 0.85,
      headerColor: '#245F3D',
      goldAccentColor: '#D4B14A',
      showBottomAccent: false,
      showSolidHeader: false,
      showInnerKeyline: true
    },
    elements: [
      // 1. AgriStack Brand Logo (Top-Left)
      {
        id: 'back_logo_agristack',
        type: 'image',
        role: 'brand-logo',
        name: 'AgriStack Logo',
        assetId: 'agristack-logo',
        src: '/agristack_logo.png',
        x: 36,
        y: 14,
        width: 126,
        height: 35,
        rotation: 0,
        locked: false,
        style: {
          opacity: 1,
          borderRadius: 0
        }
      },

      // 2. Header Title (Beside AgriStack Logo)
      {
        id: 'back_header_title',
        type: 'text',
        name: 'Header Title',
        text: 'FARMER DETAILS',
        x: 176,
        y: 16,
        width: 644,
        height: 36,
        rotation: 0,
        locked: true,
        style: {
          fontSize: 22,
          fontFamily: "'Outfit', sans-serif",
          fontWeight: 800,
          color: '#245F3D',
          letterSpacing: '2px',
          textAlign: 'left'
        }
      },

      // 3. Farmer Enrollment Number Container (Prominent Secondary Identifier, 2.4 mm radius)
      {
        id: 'back_enrollment_container',
        type: 'field_container',
        name: 'Enrollment Number',
        label: 'FARMER ENROLLMENT NO.',
        field: 'farmer_enrollment_number',
        x: 36,
        y: 68,
        width: 784,
        height: 48,
        rotation: 0,
        locked: false,
        style: {
          labelFontSize: 11,
          labelFontFamily: "'Plus Jakarta Sans', sans-serif",
          labelFontWeight: 800,
          labelColor: '#245F3D',
          letterSpacing: '1.5px',
          valueFontSize: 18.5,
          valueFontFamily: "'Plus Jakarta Sans', monospace",
          valueFontWeight: 800,
          valueColor: '#245F3D',
          letterSpacing: '2px',
          containerBg: '#FFFFFF',
          containerBorderColor: '#A4CBB0',
          containerBorderWidth: 1.2,
          containerBorderRadius: 24,
          boxShadow: 'none'
        }
      },

      // 4. Compact Dual-Language Address Component (Saves vertical space for Land Table)
      {
        id: 'back_address',
        type: 'address',
        name: 'Address Block (Dual-Language)',
        label: 'ADDRESS / पत्ता',
        x: 36,
        y: 124,
        width: 784,
        height: 58,
        rotation: 0,
        locked: false,
        style: {
          addressStyle: 'compact',
          headingFontSize: 11,
          headingColor: '#245F3D',
          fontSize: 12.5,
          textColor: '#243C34',
          marathiColor: '#243C34'
        }
      },

      // 5. Land Details Heading
      {
        id: 'back_land_heading',
        type: 'text',
        name: 'Land Table Heading',
        text: 'LAND DETAILS / जमिनीची माहिती',
        x: 36,
        y: 190,
        width: 784,
        height: 18,
        rotation: 0,
        locked: true,
        style: {
          fontSize: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          color: '#245F3D',
          letterSpacing: '0.8px'
        }
      },

      // 6. Dynamic Multi-Record Land Table (Automatically adapts for 1 to 5+ individual records, 2.0 mm outer radius)
      {
        id: 'back_land_table',
        type: 'table',
        name: 'Land Table',
        x: 36,
        y: 212,
        width: 784,
        height: 180,
        rotation: 0,
        locked: false,
        tableConfig: {
          columns: [
            { key: 'district', label: 'DISTRICT', width: '23%' },
            { key: 'taluka', label: 'TALUKA', width: '16%' },
            { key: 'village', label: 'VILLAGE', width: '16%' },
            { key: 'survey_no', label: 'SURVEY NO.', width: '14%' },
            { key: 'area', label: 'AREA', width: '14%' },
            { key: 'owner_share', label: 'OWNER / SHARE', width: '17%' }
          ],
          maxRows: 5,
          borderColor: '#C7D9CD',
          headerBg: '#245F3D',
          headerTextColor: '#FFFFFF',
          textColor: '#243C34'
        }
      },

      // 7. Non-Government Footer Notice
      {
        id: 'back_footer_notice',
        type: 'text',
        name: 'Footer Notice',
        text: 'PRIVATE REFERENCE • NOT GOVERNMENT ISSUED',
        x: 36,
        y: 488,
        width: 784,
        height: 20,
        rotation: 0,
        locked: true,
        style: {
          fontSize: 10.5,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          fontWeight: 800,
          color: '#4C8157',
          textAlign: 'center',
          letterSpacing: '1px'
        }
      }
    ]
  }
});
