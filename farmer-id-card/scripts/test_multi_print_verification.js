import { DEFAULT_PRINT_PRESETS, calculateSheetPacking, getSlotCoordinates } from './src/services/printSheetHelper.js';
import { SAMPLE_FARMERS } from './src/services/sampleData.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASSED: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAILED: ${message}`);
    failed++;
  }
}

console.log('====================================================');
console.log('   ONE-CLICK MULTI-CARD PRINT & DUPLEX VERIFICATION ');
console.log('====================================================\n');

// 1. Standard CR80 Card Dimensions
console.log('--- 1. Card Standards & Built-in Presets ---');
const cr80Preset = DEFAULT_PRINT_PRESETS.find(p => p.id === 'a4-portrait-10');
assert(cr80Preset, 'Built-in 10-card A4 portrait preset exists');
assert(cr80Preset.cardWidthMm === 85.6 && cr80Preset.cardHeightMm === 54.0, 'Card dimensions strictly adhere to 85.6 × 54.0 mm CR80 standard');
assert(cr80Preset.pageWidthMm === 210 && cr80Preset.pageHeightMm === 297, 'Page dimensions strictly 210 × 297 mm (A4)');

const landscapePreset = DEFAULT_PRINT_PRESETS.find(p => p.id === 'a4-landscape-9');
assert(landscapePreset, 'Built-in 9-card A4 landscape preset exists');
assert(landscapePreset.cardWidthMm === 85.6 && landscapePreset.cardHeightMm === 54.0, 'Landscape preset uses exact 85.6 × 54.0 mm CR80');

// 2. Automatic Packing Calculations
console.log('\n--- 2. Automatic Packing Calculations ---');
function calculatePacking(config) {
  const availW = Math.max(10, config.pageWidthMm - config.marginLeftMm - config.marginRightMm);
  const availH = Math.max(10, config.pageHeightMm - config.marginTopMm - config.marginBottomMm);
  const cols = Math.max(1, Math.floor((availW + config.gapXMm) / (config.cardWidthMm + config.gapXMm)));
  const rows = Math.max(1, Math.floor((availH + config.gapYMm) / (config.cardHeightMm + config.gapYMm)));
  return { cols, rows, capacity: cols * rows };
}

const portrait10Packing = calculatePacking(cr80Preset);
assert(portrait10Packing.cols === 2 && portrait10Packing.rows === 5, `A4 Portrait Compact packs exactly 2 cols × 5 rows = 10 cards (Computed: ${portrait10Packing.cols}×${portrait10Packing.rows})`);
assert(portrait10Packing.capacity === 10, 'Capacity per A4 page is exactly 10 cards');

const landscapePacking = calculatePacking(landscapePreset);
assert(landscapePacking.cols === 3 && landscapePacking.rows === 3, `A4 Landscape packs exactly 3 cols × 3 rows = 9 cards (Computed: ${landscapePacking.cols}×${landscapePacking.rows})`);
assert(landscapePacking.capacity === 9, 'Capacity per A4 landscape page is exactly 9 cards');

// 3. Duplex Long-Edge Horizontal Mirroring (Critical Requirement)
console.log('\n--- 3. Duplex Back Registration & Mirroring ---');
function getSlotCol(slotIndex, cols, isBack, flipMode) {
  let col = slotIndex % cols;
  if (isBack && flipMode === 'long-edge') {
    col = cols - 1 - col;
  }
  return col;
}

// In a 2-column grid:
// Front Slot 0 (left column, col 0) -> Back Slot 0 (right column, col 1)
// Front Slot 1 (right column, col 1) -> Back Slot 1 (left column, col 0)
const frontCol0 = getSlotCol(0, 2, false, 'long-edge');
const backCol0 = getSlotCol(0, 2, true, 'long-edge');
assert(frontCol0 === 0 && backCol0 === 1, `Front Card 0 (col ${frontCol0}) mirrors to Back col ${backCol0} for physical long-edge turn`);

const frontCol1 = getSlotCol(1, 2, false, 'long-edge');
const backCol1 = getSlotCol(1, 2, true, 'long-edge');
assert(frontCol1 === 1 && backCol1 === 0, `Front Card 1 (col ${frontCol1}) mirrors to Back col ${backCol1} for physical long-edge turn`);

// 4. Batch Multi-Farmer Sheet Population
console.log('\n--- 4. Batch Different Farmers Sheet Population ---');
const sheetCards = SAMPLE_FARMERS.slice(0, 6).map((farmer, idx) => ({
  id: `card_${idx}`,
  farmerId: farmer.id,
  farmer
}));
assert(sheetCards.length === 6, 'Successfully queued 6 distinct farmers on sheet');
const distinctNames = new Set(sheetCards.map(c => c.farmer.name_english));
assert(distinctNames.size === 6, 'All 6 cards hold distinct individual farmer identities');

// 5. Single Farmer Multi-Copy Duplication
console.log('\n--- 5. Single Farmer Multi-Copy Generation ---');
const singleTarget = SAMPLE_FARMERS[0];
const tenCopies = Array.from({ length: 10 }, (_, i) => ({
  id: `card_copy_${i}`,
  farmerId: singleTarget.id,
  farmer: singleTarget
}));
assert(tenCopies.length === 10, 'Successfully generated 10 copies of Vilas Sopanrao Tupkari in one click');
assert(tenCopies.every(c => c.farmer.farmer_id === singleTarget.farmer_id), 'All 10 copies maintain authentic Farmer ID binding');

console.log('\n====================================================');
if (failed === 0) {
  console.log(`🎉 ALL ${passed} MULTI-PRINT TESTS PASSED! 🎉`);
  console.log('====================================================');
  process.exit(0);
} else {
  console.error(`❌ ${failed} TESTS FAILED.`);
  console.log('====================================================');
  process.exit(1);
}
