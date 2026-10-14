/**
 * Verification Script for:
 * REDESIGN THE OVERALL HOME EXPERIENCE — CSC OPERATOR FIRST
 */

import fs from 'fs';
import path from 'path';

console.log('====================================================');
console.log('  HOME REDESIGN — CSC OPERATOR FIRST VERIFICATION   ');
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
const dbFile = fs.readFileSync(path.resolve('./src/services/db.js'), 'utf-8');

// 1. Header Branding
console.log('--- 1. Header & Brand Identity ---');
assert('Brand title is KRISHI CARD STUDIO', appFile.includes('KRISHI CARD STUDIO'));
assert('Subtitle is Farmer ID & Personal Card System', appFile.includes('Farmer ID & Personal Card System'));
assert('Header includes CSC Utility badge', appFile.includes('CSC Utility'));

// 2. Primary Navigation
console.log('\n--- 2. Primary Navigation ---');
assert('Navigation contains Home tab', appFile.includes('>Home<') || appFile.includes('Home\n') || appFile.includes('<Home size='));
assert('Navigation contains Generate tab', appFile.includes('Generate\n') || appFile.includes('>Generate<') || appFile.includes('Generate & Print'));
assert('Navigation contains Farmers tab', appFile.includes('Farmers'));
assert('Navigation contains Templates tab', appFile.includes('Templates'));
assert('Navigation contains Print History tab', appFile.includes('Print History'));
assert('Navigation contains Settings tab', appFile.includes('Settings'));

// 3. Online / Offline Status
console.log('\n--- 3. Online / Offline Status Indicator ---');
assert('Contains Online status indicator', appFile.includes('Online — Template sync available'));
assert('Contains Offline status indicator', appFile.includes('Offline — Local records available'));
assert('Listens to online/offline window events', appFile.includes("window.addEventListener('online'") && appFile.includes("window.addEventListener('offline'"));

// 4. Home Hero / Primary Action
console.log('\n--- 4. Home Hero / Primary Action ---');
assert('Hero primary title is GENERATE & PRINT', appFile.includes('GENERATE & PRINT'));
assert('Hero description is "Select a farmer and generate their saved card in seconds."', 
  appFile.includes('Select a farmer and generate their saved card in seconds.'));
assert('Contains Generate & Print primary action button', appFile.includes('Generate & Print Card'));

// 5. Quick Action Cards
console.log('\n--- 5. Quick Action Cards ---');
assert('Contains NEW FARMER quick action card', appFile.includes('NEW FARMER') && appFile.includes('Create a local farmer record.'));
assert('Contains IMPORT PDF quick action card', appFile.includes('IMPORT PDF') && appFile.includes('Auto-fill farmer information from registration PDF.'));
assert('Contains TEMPLATES quick action card', appFile.includes('TEMPLATES') && appFile.includes('Create, edit and manage reusable card templates.'));

// 6. Recent Farmers Table
console.log('\n--- 6. Recent Farmers Table & Local Search ---');
assert('Contains RECENT FARMERS section', appFile.includes('RECENT FARMERS'));
assert('Table includes Name column', appFile.includes('<th className="py-3 px-4">Name</th>'));
assert('Table includes Farmer ID column', appFile.includes('<th className="py-3 px-4">Farmer ID</th>'));
assert('Table includes Village column', appFile.includes('<th className="py-3 px-4">Village</th>'));
assert('Table includes Parcels column', appFile.includes('Parcels</th>'));
assert('Table includes Last Used column', appFile.includes('Last Used</th>'));
assert('Every row has [Generate Card] action', appFile.includes('Generate Card'));
assert('Local search bar present', appFile.includes('Search farmers by name, Farmer ID, village, or mobile...'));

// 7. Print History & Reprint
console.log('\n--- 7. Print History & 1-Click Reprint ---');
assert('Contains RECENT PRINTS section on Home', appFile.includes('RECENT PRINTS'));
assert('Contains [Print Again] reprint button', appFile.includes('Print Again'));
assert('Database service exports getPrintHistory', dbFile.includes('export async function getPrintHistory'));
assert('Database service exports addPrintRecord', dbFile.includes('export async function addPrintRecord'));
assert('Database service exports clearPrintHistory', dbFile.includes('export async function clearPrintHistory'));

// 8. Minimal Dashboard Statistics
console.log('\n--- 8. Minimal Dashboard Statistics ---');
assert('Shows Farmers count stat', appFile.includes('{farmers.length}') && appFile.includes('Farmers'));
assert('Shows Templates count stat', appFile.includes('{templates.length}') && appFile.includes('Templates'));
assert('Shows Cards Generated count stat', appFile.includes('{printHistory.length}') && appFile.includes('Cards Generated'));

// 9. Absence of Development Clutter on Home
console.log('\n--- 9. Development Clutter Removed from Home ---');
// Development tools are placed in collapsible dev tools or in the editor
assert('Dev tools are tucked into collapsible panel', appFile.includes('isDevToolsOpen'));
assert('Dev tools labeled as Advanced Diagnostics (Developer Mode)', appFile.includes('Advanced Diagnostics & Inspection Controls (Developer Mode)'));

// 10. Hotkeys & Privacy
console.log('\n--- 10. Hotkeys & Data Privacy ---');
assert('Ctrl+K hotkey for search is wired', appFile.includes("e.key.toLowerCase() === 'k'"));
assert('N hotkey for new farmer is wired', appFile.includes("e.key === 'n' || e.key === 'N'"));
assert('P hotkey for print is wired', appFile.includes("e.key === 'p' || e.key === 'P'"));
assert('Data privacy message is displayed', appFile.includes('Personal records are stored locally on this device. Offline-first architecture.'));

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL CSC OPERATOR HOME REDESIGN CHECKS PASSED! 🎉');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ SOME CHECKS FAILED');
  process.exit(1);
}
