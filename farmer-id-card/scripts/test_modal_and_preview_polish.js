import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('--- STARTING VERIFICATION: FARMER MODAL & CARD PREVIEW UX POLISH ---');
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

  // 1. Inspect FarmerModal.jsx
  const farmerModalPath = path.resolve('src/components/FarmerModal.jsx');
  const farmerModalCode = fs.readFileSync(farmerModalPath, 'utf-8');

  // Modal dimensions
  assert('FarmerModal uses max-width 1000-1100px (max-w-[1060px])', farmerModalCode.includes('max-w-[1060px]'));
  assert('FarmerModal uses max-height calc(100vh - 48px)', farmerModalCode.includes('max-h-[calc(100vh-48px)]'));
  assert('FarmerModal has sticky header', farmerModalCode.includes('sticky top-0'));
  assert('FarmerModal has sticky footer', farmerModalCode.includes('sticky bottom-0'));
  assert('FarmerModal has scrollable modal-body', farmerModalCode.includes('modal-body') && farmerModalCode.includes('overflow-y-auto'));

  // Section structure
  assert('FarmerModal has Section 1: Identification & Photograph', farmerModalCode.includes('Identification & Photograph'));
  assert('FarmerModal has photo picker with choose/change/remove', farmerModalCode.includes('Choose Photo') && farmerModalCode.includes('Remove Photo'));
  assert('FarmerModal has Section 2: Personal Details with 2-column layout', farmerModalCode.includes('Personal Details'));
  assert('FarmerModal has Section 3: Address & Location', farmerModalCode.includes('Address & Location'));
  assert('FarmerModal has Section 4: Land Details dynamic table', farmerModalCode.includes('4. Land Details'));
  assert('FarmerModal supports Add Land Record', farmerModalCode.includes('Add Land Record'));
  assert('FarmerModal supports Duplicate land row', farmerModalCode.includes('handleDuplicateLandRow'));
  assert('FarmerModal supports Delete land row', farmerModalCode.includes('handleRemoveLandRow'));

  // UX Actions & Safety
  assert('FarmerModal has primary green Save Farmer button', farmerModalCode.includes('Save Farmer') && farmerModalCode.includes('bg-[#147A4A]'));
  assert('FarmerModal has Cancel button', farmerModalCode.includes('Cancel'));
  assert('FarmerModal confirms discard unsaved changes', farmerModalCode.includes('Discard unsaved changes?'));
  assert('FarmerModal listens for Escape key', farmerModalCode.includes("e.key === 'Escape'"));
  assert('FarmerModal has local draft auto-save and restore', farmerModalCode.includes('krishi_farmer_modal_draft_v1'));
  assert('FarmerModal has inline field validation', farmerModalCode.includes('errors.farmer_id') && farmerModalCode.includes('errors.mobile') && farmerModalCode.includes('errors.pin'));

  // 2. Inspect PrintModal.jsx
  const printModalPath = path.resolve('src/components/PrintModal.jsx');
  const printModalCode = fs.readFileSync(printModalPath, 'utf-8');

  // Background and isolation
  assert('PrintModal uses calm light background #F3F5F3', printModalCode.includes('bg-[#F3F5F3]'));
  assert('PrintModal does not have blurred dashboard backdrop (no backdrop-blur-sm)', !printModalCode.includes('backdrop-blur-sm'));
  assert('PrintModal has Back to Farmer button in header', printModalCode.includes('Back to Farmer'));
  assert('PrintModal has Farmer ID Card title and farmer name in header', printModalCode.includes('Farmer ID Card'));

  // Scaling
  assert('PrintModal defaults to Fit scale', printModalCode.includes("useState('Fit')"));
  assert('PrintModal supports Fit, 75%, 100%, 150%', printModalCode.includes("'Fit'") && printModalCode.includes("'75%'") && printModalCode.includes("'100%'") && printModalCode.includes("'150%'"));
  assert('PrintModal dynamically calculates fit scale', printModalCode.includes('calculateFit') && printModalCode.includes('computedFitScale'));

  // Layout & Non-technical Labels
  assert('PrintModal shows FRONT clean badge', printModalCode.includes('FRONT') && printModalCode.includes('85.6 × 54 mm'));
  assert('PrintModal shows BACK clean badge', printModalCode.includes('BACK') && printModalCode.includes('85.6 × 54 mm'));
  assert('PrintModal removes technical PAGE 1 string', !printModalCode.includes('PAGE 1 • FRONT 85.6 × 54.0 mm'));
  assert('PrintModal removes floating micro buttons over cards', !printModalCode.includes('title="Copy Front as image"'));

  // Action Toolbar
  assert('PrintModal has sticky bottom action toolbar', printModalCode.includes('sticky bottom-0'));
  assert('PrintModal has PRINT action group with primary Print Front + Back', printModalCode.includes('Print Front + Back') && printModalCode.includes('Print Front') && printModalCode.includes('Print Back'));
  assert('PrintModal has EXPORT action group with PDF, PNG, JPG, Copy Image', printModalCode.includes('PDF') && printModalCode.includes('PNG') && printModalCode.includes('JPG') && printModalCode.includes('Copy Image'));
  assert('PrintModal supports Escape key closing', printModalCode.includes("e.key === 'Escape'"));

  // 3. Inspect App.jsx
  const appPath = path.resolve('src/App.jsx');
  const appCode = fs.readFileSync(appPath, 'utf-8');
  assert('App.jsx has Preview Card action in Generator header', appCode.includes('Preview Card'));
  assert('App.jsx has default scale set away from 200%', appCode.includes("useState('100%')"));

  console.log(`\nVerification Complete: ${passed} passed, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
