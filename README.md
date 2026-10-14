# ID Card For All - Unified Identity Card Generation & Issuance Suite

A comprehensive, unified monorepo bringing together three distinct identity card design, editing, and printing systems:
1. **AgriStack Farmer Identity Card** (Government of India initiative)
2. **Ajeenkya DY Patil University (ADYPU) Student ID Card** (Institutional PVC card issuance)
3. **UIDAI Aadhaar PVC Identity Card** (National identity card generator & optical alignment engine)

All three systems are organized into modular, self-contained subdirectories with their own assets, codebases, templates, and specifications.

---

## Repository Architecture

`
id-card-for-all/
¦
+-- .gitignore                      # Monorepo-level git ignore rules
+-- README.md                       # Master documentation & progress overview
¦
+-- farmer-id-card/                 # ?? AGPISTACK FARMER IDENTITY CARD
¦   +-- README.md                   # Detailed Farmer ID documentation
¦   +-- package.json                # Vite + React 18 configuration
¦   +-- vite.config.js              # Build config
¦   +-- index.html                  # Web app entry point
¦   +-- src/                        # Complete React dashboard, state, & components
¦   ¦   +-- components/             # Dual-sided CardRenderer, Modals, WYSIWYG editor
¦   ¦   +-- services/               # PDF Parser, IndexedDB, QR generator, Export engine
¦   ¦   +-- types/                  # Template coordinate definitions
¦   ¦   +-- utils/                  # Bilingual Marathi/English helpers
¦   +-- public/                     # High-res vector backgrounds, seals, & icons
¦   +-- scripts/                    # 25+ automated alignment, OCR, & verification scripts
¦   +-- templates/                  # Reference PDFs & baseline templates
¦
+-- adypu-student-id/               # ?? ADYPU STUDENT IDENTITY CARD
¦   +-- README.md                   # Detailed ADYPU documentation
¦   +-- ady-patil-college-id-editable.html # Live interactive editor & CR80 print proof
¦   +-- card-preview.html           # Photorealistic 3D desk lighting preview
¦   +-- ady-patil-authorized-id-system-spec.md # Institutional security & RBAC specification
¦   +-- ady-patil-college-id-sample-template.svg # 1:1 Vector SVG CR80 template
¦   +-- scripts/                    # Node.js SVG & Code 128 barcode compilers
¦   +-- assets/                     # Official university crest, logos, & sample photos
¦
+-- aadhaar-id-card/                # ???? UIDAI AADHAAR PVC CARD
    +-- README.md                   # Detailed Aadhaar documentation
    +-- requirements.txt            # Python dependencies (PyMuPDF, Pillow)
    +-- generators/                 # High-resolution vector generation scripts (v1, v2)
    +-- preview/                    # Modern dark-mode interactive preview HTML
    +-- assets/                     # Ashoka emblem, scissor cut lines, tricolor banners
    +-- samples/                    # Verified CR80 print-ready PDF & PNG outputs
`

---

## Executive Summary & Progress Dashboard

| Identity Card System | Target Domain | Core Technologies | Work Done Status | Completeness | Next Critical Steps |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **AgriStack Farmer ID** | Agriculture / Digital India | React 18, Vite, IndexedDB, pdfjs-dist, html2canvas, jspdf | Full web app, PDF auto-parser, photo adjustment, single & A4 batch printing | **90%** | Cloud database sync (Supabase/PostgreSQL), live AgriStack API connection, scanned PDF OCR fallback |
| **ADYPU Student ID** | Higher Education / Campus | HTML5, Vanilla CSS, JS, SVG, Code 128, Node.js | Interactive live editor, CR80 print stylesheet, 3D desk mockup, 1:1 vector SVG, RBAC architecture spec | **85%** | Backend REST API, Student Information System (SIS) integration, signed barcode payloads, audit log DB |
| **UIDAI Aadhaar PVC** | National Identity | Python 3, PyMuPDF (fitz), Pillow, HarfBuzz | 300+ DPI vector PDF generator, optical reference alignment, dense QR support, web preview | **80%** | Web UI / REST API wrapper, UIDAI encrypted QR code parser & verification, multi-language support |

---

## Card System Deep Dive

### 1. ?? AgriStack Farmer Identity Card (armer-id-card/)

#### What Work Is Done:
- **Full Operator Web Dashboard**: Built with React 18 and Vite. Features real-time search, farmer profiles list, template customization, and instant print preview.
- **Dual-Sided CR80 PVC Rendering**: Millimeter-accurate front and back layouts with interactive 3D flip animation.
- **Automated PDF Extraction (services/pdfParser.js)**: Ingests official government farmer registration certificates (7-12 extracts) and automatically parses Farmer ID, Name, DOB, Gender, Village, Taluka, District, and Land Record tables.
- **Integrated Photo Studio (components/PhotoAdjustmentModal.jsx)**: In-browser cropping, brightness/contrast adjustments, zoom, pan, and facial centering.
- **Production Printing Options**:
  - Direct 1-click single-card CR80 PVC printer mode.
  - Multi-card A4 batch print sheet layout (prints 5 front/back card pairs per sheet with alignment guides).
- **Persistent Local Storage (services/db.js)**: IndexedDB offline storage for farmer profiles, custom templates, and print history.
- **Bilingual Marathi/English Typography**: Full Devanagari script support calibrated with Noto Sans Devanagari.
- **Comprehensive Quality Assurance**: 25+ automated testing scripts in scripts/ validating baseline text alignment, QR rendering, and footer metrics.

#### How Much Work Is Done: **~90%**
- Frontend & Core Features: 92%
- PDF Data Extraction: 80%
- Print Fidelity & Export: 95%
- Cloud Infrastructure: 20% (local IndexedDB operational)

#### What Needs to Be Done:
1. **Cloud Database Integration**: Deploy a cloud backend (e.g. Supabase, PostgreSQL) to synchronize farmer records across multiple print kiosks and operators.
2. **Official AgriStack API Sync**: Direct integration with government APIs to fetch farmer records via Aadhaar OTP or Farmer ID lookup.
3. **Enhanced OCR for Scanned Documents**: Fallback OCR pipeline for hand-scanned or photocopied land records.
4. **Mobile/Tablet Optimization**: Responsive layout adjustments for agricultural field officers using tablets.

---

### 2. ?? Ajeenkya DY Patil University (ADYPU) Student ID (dypu-student-id/)

#### What Work Is Done:
- **Interactive Live Card Studio (dy-patil-college-id-editable.html)**: Real-time form fields for student name, enrollment UID, branch, semester, academic year, and validity. Includes instant photo upload and circular cropping.
- **Native Code 128 Barcode Engine**: Client-side algorithmic Code 128 barcode generator with valid start/stop patterns and checksum calculation.
- **CR80 PVC Print Calibration**: Dedicated @media print CSS enforcing exact 54mm × 85.6mm dimensions, zero margin, and 300 DPI vector clarity.
- **Photorealistic 3D Desk Preview (card-preview.html)**: Real-world presentation mockup featuring realistic room lighting, card thickness bevels, and physical drop shadows on a desk surface.
- **1:1 Precision Vector SVG Template (dy-patil-college-id-sample-template.svg)**: Standalone vector asset embedding the official university crest and crisp typography.
- **System Architecture Specification (dy-patil-authorized-id-system-spec.md)**: Complete institutional blueprint specifying role-based workflows (Admin, Operator, Approver, Issuing Officer, Auditor), student record schema, barcode payload security, and tamper prevention.

#### How Much Work Is Done: **~85%**
- Frontend Editor & Proofing UI: 95%
- Print Layout & Vector Template: 90%
- Backend API & SIS Connection: 0% (Spec is defined; implementation pending)

#### What Needs to Be Done:
1. **Institutional Backend Integration**: Build a backend service (Node.js/Python) connected to the university ERP/SIS database.
2. **Role-Based Access Control (RBAC)**: Secure operator logins and approval workflows before cards can be officially printed.
3. **Cryptographically Signed Barcode Payloads**: Replace plain text enrollment numbers with signed verification tokens to prevent fake card fabrication.
4. **Audit Logging Service**: Database tables tracking who printed or reprinted each card, timestamp, and machine fingerprint.
5. **Bulk Batch Generation**: Support batch CSV/Excel import with automated multi-card PDF export for orientation day card batches.

---

### 3. ???? UIDAI Aadhaar PVC Identity Card (adhaar-id-card/)

#### What Work Is Done:
- **High-Resolution Vector Rendering Pipeline (generators/generate_aadhaar_v2.py)**:
  - Python engine using PyMuPDF (itz) and Pillow (PIL).
  - Master canvas resolution: 2560 × 1632 px (CR80 1.57:1 aspect ratio).
  - Produces dual-page 300+ DPI vector PDF cards (samples/aadhaar_raisabi_final_pvc.pdf) and ultra-HD PNGs.
- **Optical Reference Matching**:
  - Millimeter-accurate placement of the national Ashoka emblem, tricolor government header banners, and sun emblems.
  - Dashed cut line with scissor guide icon (scissor_icon.png).
  - Red divider accent line positioned at 91.5% card height matching physical UIDAI PVC cards.
  - Aligned footer contact table (Toll-free 1947, email, website) with SVG icons and baseline centering.
- **Dense 2D Secure QR Code Support**: Generates and places high-density secure QR codes.
- **Devanagari Complex Text Shaping**: PyMuPDF HarfBuzz integration rendering proper conjuncts and matras in regional languages (Marathi/Hindi).
- **Interactive Web Preview (preview/aadhaar-card-preview.html)**: Modern dark-mode preview dashboard with 3D flip card interaction and technical specifications.

#### How Much Work Is Done: **~80%**
- Vector Graphic & Print Rendering: 88%
- Optical Calibration & Physical Matching: 92%
- Interactive Web Interface: 60% (Interactive preview exists; dynamic web form generator needed)
- Cryptographic Verification: 40% (Inserts QR; XML cryptographic signature parser needed)

#### What Needs to Be Done:
1. **Dynamic Web / REST API Interface**: Create a FastAPI or Flask web wrapper allowing users to input card details and photos via a browser UI.
2. **UIDAI Secure QR Cryptographic Decoder**: Implement decompression and RSA public key verification to extract authenticated data directly from official e-Aadhaar QR codes.
3. **Multi-Language Regional Expansion**: Add font mappings and layout presets for Tamil, Telugu, Kannada, Bengali, and Gujarati.
4. **Bulk CLI Processor**: Command-line batch generator to ingest CSV data and generate hundreds of PVC cards automatically.

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0 or newer
- **Python**: v3.10 or newer (for Aadhaar generator)
- **Git**

### 1. Running AgriStack Farmer ID Studio
`ash
cd farmer-id-card
npm install
npm run dev
`
Open http://localhost:5173 in your browser.

### 2. Running ADYPU Student ID Editor
No build step required! Simply open the HTML file:
`ash
# On Windows
start adypu-student-id/ady-patil-college-id-editable.html
# Or view the 3D desk render
start adypu-student-id/card-preview.html
`

To recompile the vector SVG:
`ash
node adypu-student-id/scripts/build_fixed_svg.js
`

### 3. Running Aadhaar PVC Card Generator
`ash
cd aadhaar-id-card
pip install -r requirements.txt
python generators/generate_aadhaar_v2.py
`
Output files will be saved in samples/ and ssets/.
To view the web preview:
`ash
start preview/aadhaar-card-preview.html
`

---

## License & Usage
This repository contains reference implementations, educational prototypes, and institutional proof-of-concepts. 
All trademarks, official logos, and institutional crests are the property of their respective authorities (Government of India, UIDAI, and Ajeenkya DY Patil University).
