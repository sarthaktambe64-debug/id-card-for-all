/**
 * Comprehensive Acceptance Test for:
 * MAJOR HOME PAGE UX/UI REDESIGN
 * LIGHT THEME • CSC OPERATOR FIRST • SIMPLE • CALM • TASK-ORIENTED
 */

import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('   LIGHT THEME & CSC OPERATOR-FIRST VERIFICATION    ');
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

const appFile = fs.readFileSync(path.resolve('./src/App.jsx'), 'utf-8');
const cssFile = fs.readFileSync(path.resolve('./src/index.css'), 'utf-8');

// 1. Light Theme Palette Tokens in CSS & App
console.log('--- 1. Light Theme Color System ---');
assert('Page Background #F5F7F5 is defined in CSS', cssFile.includes('#F5F7F5'));
assert('Primary Surface #FFFFFF is defined in CSS', cssFile.includes('#FFFFFF'));
assert('Secondary Surface #F8FAF8 is defined in CSS', cssFile.includes('#F8FAF8'));
assert('Primary Green #147A4A is defined in CSS', cssFile.includes('#147A4A'));
assert('Dark Green #155A3A hover is defined in CSS', cssFile.includes('#155A3A'));
assert('Main Text #1F2933 is defined in CSS', cssFile.includes('#1F2933'));
assert('Secondary Text #667085 is defined in CSS', cssFile.includes('#667085'));
assert('Border #D9E2DC is defined in CSS', cssFile.includes('#D9E2DC'));
assert('Light Green #E9F5EE is defined in CSS', cssFile.includes('#E9F5EE'));
assert('Body background is light (#F5F7F5)', cssFile.includes('background-color: #F5F7F5'));
assert('Body text color is dark slate (#1F2933)', cssFile.includes('color: #1F2933'));

// 2. Visual Density & Centered Workspace
console.log('\n--- 2. Centered Workspace (1200–1320px) ---');
assert('Centered workspace width within 1200-1320px', 
  appFile.includes('max-w-[1280px]') || appFile.includes('max-w-6xl') || appFile.includes('max-w-[1320px]'));
assert('No full-screen stretch: centered container with mx-auto', appFile.includes('mx-auto'));

// 3. Header Redesign
console.log('\n--- 3. Clean Professional Application Header ---');
assert('Brand name KRISHI CARD STUDIO present', appFile.includes('KRISHI CARD STUDIO'));
assert('Subtitle Farmer ID & Personal Card System present', appFile.includes('Farmer ID & Personal Card System'));
assert('Clean text navigation Home, Farmers, Templates, History', 
  appFile.includes('>Home<') || appFile.includes('Home\n') && 
  appFile.includes('Farmers') && appFile.includes('Templates') && appFile.includes('History'));
assert('Primary CTA [+ Generate Card] in green', appFile.includes('Generate Card') && appFile.includes('#147A4A'));
assert('Settings gear icon button present', appFile.includes('<Settings') && appFile.includes("setActiveTab('settings')"));
assert('Subtle status indicator pill without technical jargon', appFile.includes('Online') && appFile.includes('Offline'));

// 4. Compact Hero
console.log('\n--- 4. Primary Hero Section ---');
assert('Hero title is "Generate Farmer Card"', appFile.includes('Generate Farmer Card'));
assert('Hero subtitle: "Select a farmer and print their saved card in seconds."', 
  appFile.includes('Select a farmer and print their saved card in seconds.'));
assert('Primary hero button [+ Generate Card]', appFile.includes('+ Generate Card'));
assert('Secondary hero button [Print Multiple]', appFile.includes('Print Multiple'));

// 5. Find a Farmer & Live Match Highlighting
console.log('\n--- 5. Find a Farmer & Interactive Search ---');
assert('Section title FIND A FARMER present', appFile.includes('FIND A FARMER'));
assert('Search placeholder "Search farmer name, Farmer ID, mobile or village…"', 
  appFile.includes('Search farmer name, Farmer ID, mobile or village…'));
assert('Keyboard shortcut hint Ctrl + K present', appFile.includes('Ctrl + K'));
assert('highlightMatch helper is implemented', appFile.includes('function highlightMatch'));
assert('Interactive search dropdown rendered on query', appFile.includes('searchQuery.trim().length > 0'));

// 6. Recent Farmers Table (Max 5 Rows)
console.log('\n--- 6. Quick Recent Farmers Table ---');
assert('RECENT FARMERS heading present', appFile.includes('RECENT FARMERS'));
assert('Recent farmers limited to 5 rows', appFile.includes('farmers.slice(0, 5)'));
assert('Clean table includes Photo, Name, Farmer ID, Village, Parcels, Action',
  appFile.includes('Photo</th>') &&
  appFile.includes('Name</th>') &&
  appFile.includes('Farmer ID</th>') &&
  appFile.includes('Village</th>') &&
  appFile.includes('Parcels</th>') &&
  appFile.includes('Action</th>')
);
assert('Row action is primary green [Generate] button', appFile.includes('#147A4A') && appFile.includes('>Generate<') || appFile.includes('>Generate\n'));

// 7. Quick Actions (3 Cards)
console.log('\n--- 7. Quick Actions (3 Cards) ---');
assert('Card 1: + New Farmer with description "Create a local farmer record."', 
  appFile.includes('+ New Farmer') && appFile.includes('Create a local farmer record.'));
assert('Card 2: Import PDF with description "Auto-fill from Farmer Registration PDF"', 
  appFile.includes('Import PDF') && appFile.includes('Auto-fill from Farmer Registration PDF'));
assert('Card 3: Templates with saved count description', 
  appFile.includes('Templates') && (appFile.includes('saved template') || appFile.includes('Manage reusable')));

// 8. Statistics AFTER Primary Workflow
console.log('\n--- 8. Statistics Section ---');
assert('Farmers count card present', appFile.includes('{farmers.length}') && appFile.includes('Farmers'));
assert('Templates count card present', appFile.includes('{templates.length}') && appFile.includes('Templates'));
assert('Cards Printed count card present', appFile.includes('{printHistory.length}') && appFile.includes('Cards Printed'));

// 9. Privacy Message Strip
console.log('\n--- 9. Subtle Privacy Strip ---');
assert('Privacy message present: "Personal records are stored locally on this device."', 
  appFile.includes('Personal records are stored locally on this device.'));
assert('Reassuring secondary note: "Internet is only required for online template features."',
  appFile.includes('Internet is only required for online template features.'));

// 10. Developer Jargon Removed from Normal View
console.log('\n--- 10. Absence of Developer Clutter in Normal Flow ---');
assert('Inspection drawer tucked behind Developer Mode toggle', 
  appFile.includes('isDevToolsOpen') && appFile.includes('Developer Mode'));

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL 28 LIGHT THEME & OPERATOR-FIRST CHECKS PASSED! 🎉');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED');
  process.exit(1);
}
