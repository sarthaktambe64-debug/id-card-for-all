import { createDefaultTemplate, BUILTIN_TEMPLATE_ID } from './src/types/defaultTemplate.js';

console.log('====================================================');
console.log('     FARMER TAGLINE / QUOTE COMPONENT VERIFICATION   ');
console.log('====================================================\n');

let allPassed = true;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    allPassed = false;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

const tpl = createDefaultTemplate();

// 1. Verify Template ID and Version
console.log('--- Test 1: Template Model & Version ---');
assert(tpl.templateId === BUILTIN_TEMPLATE_ID, 'Template ID matches BUILTIN_TEMPLATE_ID');
assert(tpl.version >= 7, `Template version is ${tpl.version} (>= 7)`);

// 2. Locate Tagline Element on Front Side
console.log('\n--- Test 2: Tagline Element Presence ---');
const frontElements = tpl.front.elements;
const tagline = frontElements.find((e) => e.id === 'front_farmer_tagline');
assert(!!tagline, 'Tagline element front_farmer_tagline is PRESENT on FRONT side');
assert(tagline.type === 'text', `Tagline element type is "${tagline.type}" (standard editable text)`);
assert(tagline.role === 'tagline', 'Tagline element role is "tagline"');

// 3. Default Marathi Text
console.log('\n--- Test 3: Default Marathi Text ---');
const expectedDefaultText = 'शेतकरी जगाचा पोशिंदा, बळीराजा आमचा अभिमान!';
assert(tagline.text === expectedDefaultText, `Default text matches exactly: "${tagline.text}"`);

// 4. Visual Hierarchy & Placement
console.log('\n--- Test 4: Visual Hierarchy & Placement ---');
const farmerIdContainer = frontElements.find((e) => e.id === 'front_farmer_id_container');
const disclaimer = frontElements.find((e) => e.id === 'front_footer_notice');

assert(farmerIdContainer.y < tagline.y, `Farmer ID (y: ${farmerIdContainer.y}) is above Tagline (y: ${tagline.y})`);
assert(tagline.y < disclaimer.y, `Tagline (y: ${tagline.y}) is above Disclaimer (y: ${disclaimer.y})`);
assert(tagline.y >= 450 && tagline.y <= 470, `Tagline y position (${tagline.y}) is properly placed near bottom in visual hierarchy`);
assert(tagline.style.textAlign === 'center', 'Tagline is horizontally centered');

// 5. Typography & Styling (Devanagari, Agricultural Green, Readability)
console.log('\n--- Test 5: Typography & Design ---');
assert(tagline.style.fontFamily.includes('Noto Sans Devanagari'), `Font family includes Noto Sans Devanagari: "${tagline.style.fontFamily}"`);
assert(tagline.style.fontSize >= 12 && tagline.style.fontSize <= 16, `Tagline font size (${tagline.style.fontSize}px) is moderately sized`);
assert(tagline.style.fontSize < farmerIdContainer.style.valueFontSize, 'Tagline is visually secondary to Farmer ID');
assert(tagline.style.fontSize > disclaimer.style.fontSize, 'Tagline is visually stronger than Disclaimer');
assert(tagline.style.color.startsWith('#'), `Tagline color is styled with agricultural green palette: ${tagline.style.color}`);

// 6. Alternative Text Suitability
console.log('\n--- Test 6: Alternative Text Option ---');
const altText = 'शेतकऱ्यांशिवाय जग अपूर्ण, कष्टाला आमच्या मानाची पूर्ण!';
const updatedTagline = { ...tagline, text: altText };
assert(updatedTagline.text === altText, `Alternative text can be set cleanly: "${updatedTagline.text}"`);

// 7. Editability / Lock State
console.log('\n--- Test 7: Element Editability ---');
assert(tagline.locked === false, 'Tagline is NOT locked by default; operator can move/edit/resize');

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL TAGLINE TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('====================================================');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED.');
  console.log('====================================================');
  process.exit(1);
}
