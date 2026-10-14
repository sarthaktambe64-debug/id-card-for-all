/**
 * Verification Script for:
 * FIX LAND DETAILS TABLE — CORNER GEOMETRY + UI/UX POLISH
 */

import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log(' LAND TABLE CORNER GEOMETRY & UI POLISH VERIFICATION ');
console.log('====================================================\n');

let allPassed = true;
function assert(desc, condition) {
  if (condition) {
    console.log(`✅ PASSED: ${desc}`);
  } else {
    console.error(`❌ FAILED: ${desc}`);
    allPassed = false;
  }
}

const rendererFile = fs.readFileSync(path.resolve('./src/components/CardRenderer.jsx'), 'utf-8');
const templateFile = fs.readFileSync(path.resolve('./src/types/defaultTemplate.js'), 'utf-8');

// 1. One Outer Table Container Architecture
console.log('--- 1. Dedicated Wrapper Architecture ---');
assert('Uses dedicated land-table-wrapper class', rendererFile.includes('className="land-table-wrapper'));
assert('Wrapper controls single outer border (1px solid)', rendererFile.includes('border: `1px solid ${borderColor}`'));
assert('Wrapper controls corner radius (14px)', rendererFile.includes("borderRadius: '14px'"));
assert('Wrapper controls overflow clipping (overflow: hidden)', rendererFile.includes("overflow: 'hidden'"));
assert('Wrapper controls background color', rendererFile.includes("backgroundColor: '#FFFFFF'"));

// 2. Table Element Border System
console.log('\n--- 2. Table & Border Isolation ---');
assert('Table uses separate border collapse to avoid bleed', rendererFile.includes("borderCollapse: 'separate'"));
assert('Table uses zero border spacing', rendererFile.includes("borderSpacing: 0"));
assert('Table itself has border: none', rendererFile.includes("border: 'none'"));

// 3. Corner Clipping & Internal Dividers
console.log('\n--- 3. Corner Clipping & Internal Dividers ---');
assert('Header has borderBottom divider', rendererFile.includes("borderBottom: `1px solid ${borderColor}`"));
assert('Header cells have borderTop: none to avoid outer collision', rendererFile.includes("borderTop: 'none'"));
assert('Last column has borderRight: none', rendererFile.includes("idx < columns.length - 1 ? `1px solid ${borderColor}` : 'none'"));
assert('Last data row has borderBottom: none to avoid bottom corner collision', rendererFile.includes("borderBottom: isLastRow ? 'none' : `1px solid ${borderColor}`"));

// 4. Header Proportions & Typography
console.log('\n--- 4. Header Proportions & Typography ---');
assert('Header height is refined to 27px', rendererFile.includes("height: '27px'"));
assert('Header text is centered', rendererFile.includes("textAlign: 'center'"));
assert('Header text is vertically centered', rendererFile.includes("verticalAlign: 'middle'"));
assert('Header text is bold (fontWeight: 800)', rendererFile.includes('fontWeight: 800'));
assert('Header uses agricultural green (#245F3D)', templateFile.includes("headerBg: '#245F3D'"));

// 5. Column Alignment & Widths
console.log('\n--- 5. Column Alignment & Proportions ---');
assert('District is left aligned', rendererFile.includes("district: 'left'"));
assert('Taluka is left aligned', rendererFile.includes("taluka: 'left'"));
assert('Village is left aligned', rendererFile.includes("village: 'left'"));
assert('Survey No is center aligned', rendererFile.includes("survey_no: 'center'"));
assert('Area is center aligned', rendererFile.includes("area: 'center'"));
assert('Owner / Share is center aligned', rendererFile.includes("owner_share: 'center'"));
assert('District column width is 23%', templateFile.includes("width: '23%'"));
assert('Owner/share column width is 17%', templateFile.includes("width: '17%'"));

// 6. Data Cell Typography & Long Names
console.log('\n--- 6. Data Cell Typography & Long Text Handling ---');
assert('Long text scaling logic is present', rendererFile.includes('isVeryLong') && rendererFile.includes('cellFontSize - 1.5'));
assert('Cell horizontal padding is 8px', rendererFile.includes("paddingLeft: '8px'") && rendererFile.includes("paddingRight: '8px'"));
assert('Subtle alternating rows (#FFFFFF and #F6FAF6)', rendererFile.includes("rIdx % 2 === 0 ? '#FFFFFF' : '#F6FAF6'"));

// 7. Dynamic Records & Overflow
console.log('\n--- 7. Dynamic Records & Overflow ---');
assert('Supports dynamic land records', rendererFile.includes('displayRows.map'));
assert('Overflow summary row renders for > 5 records', rendererFile.includes('+ {totalParcels - maxRows} additional land records'));

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL LAND TABLE CORNER GEOMETRY CHECKS PASSED! 🎉');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED');
  process.exit(1);
}
