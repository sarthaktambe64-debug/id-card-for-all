# AgriStack - Farmer Identity Card Generation & Print Studio

## Overview
A comprehensive React + Vite web application engineered to generate, customize, verify, and print **AgriStack Farmer Identity Cards** (Government of India / Ministry of Agriculture & Farmers Welfare initiative).

The application supports bilingual typography (English and Marathi/Devanagari), direct PDF registration document ingestion, offline-first IndexedDB storage, photo adjustment tools, single-card CR80 PVC printing, and multi-card batch print sheets on A4.

---

## Technical Specifications
- **Framework**: React 18 + Vite 6
- **Styling**: Modern CSS / Tailwind CSS tokens with custom glassmorphism and print rules
- **Card Format**: Standard CR80 PVC Card (85.6 mm × 54.0 mm / Landscape orientation)
- **Sides**: Dual-sided (Front: Farmer profile, photo, QR code, village details; Back: Land holding records table, sub-district, surveyor seal)
- **Typography**: Google Fonts (Outfit, Mukta, Noto Sans Devanagari, Plus Jakarta Sans)
- **Storage**: Browser IndexedDB (idb / local database) for persistent offline capability
- **Document Processing**: pdfjs-dist for local client-side PDF text extraction
- **Export Formats**: High-resolution PNG, JPG, PDF (html2canvas, jspdf)

---

## Directory Structure
`
farmer-id-card/
+-- index.html                   # Application entry HTML
+-- package.json                 # Node dependencies and scripts
+-- vite.config.js               # Vite build configuration
+-- src/
¦   +-- App.jsx                  # Main dashboard, tab navigation, search, and action dispatcher
¦   +-- index.css                # Global styles, print media queries, layout utilities
¦   +-- main.jsx                 # React root mount point
¦   +-- components/
¦   ¦   +-- CardRenderer.jsx     # High-precision dual-sided canvas/HTML card renderer
¦   ¦   +-- AgriStackSvgBackground.jsx # Official AgriStack vector emblem & background
¦   ¦   +-- CardSvgBackground.jsx # Standard CR80 card background geometry
¦   ¦   +-- FarmerModal.jsx      # Manual farmer record creation and edit dialog
¦   ¦   +-- MultiCardPrintModal.jsx # A4 multi-card grid sheet layout for batch printing
¦   ¦   +-- PhotoAdjustmentModal.jsx # Crop, brightness, contrast, zoom, and face alignment
¦   ¦   +-- PrintModal.jsx       # Single-card CR80 direct printer dialog
¦   ¦   +-- QrTestModal.jsx      # QR code scanner and payload inspection tool
¦   ¦   +-- TemplateEditor.jsx   # Visual WYSIWYG coordinate and typography editor
¦   ¦   +-- TemplateLibraryModal.jsx # Template preset manager with import/export
¦   +-- services/
¦   ¦   +-- cardExportService.js # PNG, JPG, PDF download and clipboard copying
¦   ¦   +-- db.js                # IndexedDB wrapper (farmers, templates, print history)
¦   ¦   +-- pdfParser.js         # Intelligent parser for official farmer registration PDFs
¦   ¦   +-- photoService.js      # Image processing, base64 encoding, thumbnailing
¦   ¦   +-- printSheetHelper.js  # Calculates A4 sheet page layout and grid coordinates
¦   ¦   +-- qrHelper.js          # Encodes and renders official AgriStack QR codes
¦   ¦   +-- sampleData.js        # Seed farmer profiles for instant testing
¦   +-- types/
¦   ¦   +-- defaultTemplate.js   # Coordinate system tokens for front & back card fields
¦   +-- utils/
¦       +-- marathiAddress.js    # Bilingual translation & district-taluka mapping
+-- public/                      # Static assets, worker scripts, logos, reference scans
+-- scripts/                     # Optical calibration, margin verification, and test scripts
+-- templates/                   # Reference PDF samples and baseline card templates
`

---

## Work Done
1. **Full-Featured React Web Studio**:
   - Operator-first interface with intuitive search, farmer list, card preview, and one-click actions.
   - Dual-sided 3D flipping card preview with front and back toggle.
2. **Automated PDF Parsing (services/pdfParser.js)**:
   - Drag-and-drop parsing of official government Farmer Registration Certificates / 7-12 extracts.
   - Automatically extracts Farmer ID, Name (English & Marathi), Gender, DOB, Village, Taluka, District, and Land Records table.
3. **Advanced Photo Enhancement (components/PhotoAdjustmentModal.jsx)**:
   - Built-in photo enhancement: brightness, contrast, pan/zoom, circular and rectangular masks, face alignment.
4. **WYSIWYG Template Editor (components/TemplateEditor.jsx)**:
   - Visual drag/numeric position calibration for text blocks, labels, photo boxes, and QR codes.
5. **Production Printing Suite**:
   - Single-card direct CR80 PVC printing.
   - Multi-card A4 sheet printing (prints 5 front/back pairs per sheet with cut marks).
6. **Offline Persistent Database (services/db.js)**:
   - Client-side IndexedDB storing farmer records, saved templates, and print audit logs.
7. **Bilingual Typography & Formatting**:
   - Full support for Devanagari script alongside Latin text, calibrated with Noto Sans Devanagari.
8. **Automated Alignment & Calibration Scripts**:
   - Over 25 testing and verification scripts in scripts/ validating optical margins, baseline text alignment, QR rendering, and footer metrics.

---

## Completion Status
- **Frontend Studio & Dashboard**: **92% Complete** (Fully functional, responsive, rich feature set)
- **PDF Extraction Engine**: **80% Complete** (Handles standard digital certificates; scanned OCR mode in progress)
- **Card Rendering & Print Accuracy**: **95% Complete** (Calibrated against official PVC references)
- **Centralized Cloud Sync**: **20% Complete** (Runs locally via IndexedDB; needs cloud backend)

---

## What Needs to Be Done (Roadmap)
1. **Cloud Database Backend**: Integrate Supabase / Firebase / PostgreSQL for multi-operator sync across centers.
2. **Live AgriStack API Integration**: Query the national farmer registry via official API endpoints using Farmer ID or Aadhaar OTP.
3. **Advanced OCR Fallback**: Enhance Tesseract.js / cloud OCR for low-quality physical document photo uploads.
4. **Mobile / Tablet Responsive Optimization**: Polish UI for field operators using tablets without external keyboards.
5. **Bulk PDF Ingestion**: Support batch folder upload to parse dozens of farmer certificates at once.

---

## How to Run
`ash
cd farmer-id-card
npm install
npm run dev
`
Open http://localhost:5173 in your browser.
