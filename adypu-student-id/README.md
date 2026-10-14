# Ajeenkya DY Patil University (ADYPU) - Student ID Card Issuance System

## Overview
This module provides a front-end print proof, interactive editor, and vector template generation suite for standard CR80 PVC Student Identity Cards for **Ajeenkya DY Patil University (ADYPU)**.

---

## Technical Specifications
- **Card Format**: Standard CR80 PVC Card (54.0 mm × 85.6 mm / Vertical Portrait orientation)
- **Corner Radius**: 3.2 mm
- **Color Palette**:
  - Primary Navy Blue: #123e70
  - Deep Crimson Red: #b32724 (Accent: #c03333)
  - Typography / Ink Black: #111215
  - Background: Crisp White #ffffff with micro-pattern overlay
- **Barcode Encoding**: Code 128 symbology encoding student enrollment UID (e.g., DEN23244564)
- **Print Optimization**: Dedicated @media print CSS calibrated for 1:1 scale on CR80 card printers (Evolis, Zebra, Magicard)

---

## Directory Structure
`
adypu-student-id/
+-- ady-patil-college-id-editable.html      # Interactive web application for editing & proofing
+-- card-preview.html                      # Photorealistic 3D CSS render on realistic desk background
+-- ady-patil-authorized-id-system-spec.md # Complete institutional issuance architecture specification
+-- ady-patil-college-id-sample-template.svg # 1:1 Precision vector SVG card template
+-- scripts/
¦   +-- build_fixed_svg.js                 # Generates calibrated SVG card with Code 128 barcode
¦   +-- generate_svg.js                    # Vector generator script for student ID templates
+-- assets/
    +-- ady-patil-crest-official.jpg       # Master university crest
    +-- ady-patil-crest-cropped.png        # Header-cropped crest without text banner
    +-- ady-patil-logo.jpg                 # University logo asset
    +-- desk-background.jpg                # Photorealistic desk texture
    +-- sample-student-photo.jpg           # Standard reference student portrait
    +-- *.png                              # Rendered proofs and mockups
`

---

## Work Done
1. **Interactive Card Studio (dy-patil-college-id-editable.html)**:
   - Real-time form controls for Student Name, UID, Branch/Course, Class/Semester, Academic Year, and Issue Date.
   - Interactive photo upload with instant circular/rounded cropping preview.
   - Client-side real-time Code 128 barcode generator with checksum validation.
   - CR80 exact dimensions (54mm x 85.6mm) with millimeter-level CSS typography.
   - Direct-to-printer print stylesheet (@page { size: 54mm 85.6mm; margin: 0; }).
2. **Photorealistic Preview (card-preview.html)**:
   - 3D CSS transformation with ambient lighting, card edge bevel, and realistic drop shadow on desk texture.
3. **Precision Vector Template (dy-patil-college-id-sample-template.svg)**:
   - Clean vector paths, high-res university crest, crisp divider lines, aligned colons, and vector barcode bars.
4. **Node.js Build Scripts (scripts/build_fixed_svg.js)**:
   - Automatic Code 128 pattern calculation and SVG compilation.
5. **System Architecture Specification (dy-patil-authorized-id-system-spec.md)**:
   - Detailed documentation on required roles (Admin, Data Operator, Approver, Issuing Officer, Auditor).
   - Student record schema and lifecycle workflow.
   - Cryptographic barcode payload format and tamper-proofing guidelines.

---

## Completion Status
- **UI / Frontend Template & Editor**: **95% Complete** (Production-ready front-end proofing)
- **Vector Graphics & Printing Layout**: **90% Complete** (Calibrated for CR80 card printers)
- **Backend & Database Integration**: **0% Complete** (Specified in architecture document, pending backend implementation)

---

## What Needs to Be Done (Roadmap)
1. **Backend API Integration**: Connect to University Student Information System (SIS / ERP) to fetch verified student records directly by UID.
2. **Role-Based Access Control (RBAC)**: Enforce authentication for Data Operators, Approvers, and Issuing Officers.
3. **Cryptographically Signed Barcodes**: Replace plain UID barcode generation with backend-signed verification tokens (JWT / signed hash) to prevent counterfeiting.
4. **Audit Logging & Reprint Tracking**: Record every issuance, print, and reprint event with operator ID, timestamp, and machine fingerprint.
5. **Batch Issuance Queue**: Support CSV/Excel bulk upload and multi-record batch PDF export for mass student onboarding.

---

## How to Run
- **Interactive Editor**: Open dy-patil-college-id-editable.html in any modern web browser.
- **3D Desk Preview**: Open card-preview.html in a web browser.
- **Rebuild Vector SVG**: Run 
ode scripts/build_fixed_svg.js.
