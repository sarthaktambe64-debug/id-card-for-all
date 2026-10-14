const fs = require('fs');
const path = require('path');

const PATTERNS = [
  '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
  '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
  '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
  '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
  '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
  '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
  '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
  '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
  '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
  '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
  '114131','311141','411131','211412','211214','211232','2331112'
];

function buildSvg() {
  const uid = 'DEN23244564';
  const codes = [104];
  let sum = 104;
  for (let i = 0; i < uid.length; i++) {
    const val = uid.charCodeAt(i) - 32;
    codes.push(val);
    sum += val * (i + 1);
  }
  codes.push(sum % 103);
  codes.push(106);

  const patternStr = codes.map(c => PATTERNS[c]).join('');
  let totalModules = 0;
  for (const ch of patternStr) totalModules += Number(ch);

  const targetW = 430;
  const scale = targetW / totalModules;
  const startX = (540 - targetW) / 2; // 55
  const startY = 794;
  const barH = 48;

  let svgBars = [];
  let curX = startX;
  let isBar = true;
  for (const ch of patternStr) {
    const w = Number(ch) * scale;
    if (isBar) {
      svgBars.push(`    <rect x="${curX.toFixed(2)}" y="${startY}" width="${w.toFixed(2)}" height="${barH}" fill="#08090b"/>`);
    }
    curX += w;
    isBar = !isBar;
  }

  const content = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 540 856" width="540" height="856">
  <defs>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="540" height="856" rx="32" ry="32"/>
    </clipPath>
    <style>
      .motto { font-family: Georgia, "Times New Roman", serif; font-size: 17.5px; font-style: italic; font-weight: 700; fill: #1c1b1d; }
      .brand { font-family: Georgia, "Times New Roman", serif; font-size: 51px; font-weight: 700; letter-spacing: 7.5px; fill: #b92b27; }
      .school { font-family: Georgia, "Times New Roman", serif; font-size: 29.5px; font-weight: 700; fill: #0f3b73; }
      .approval { font-family: Georgia, "Times New Roman", serif; font-size: 18.5px; font-style: italic; font-weight: 700; fill: #1c1b1d; }
      .name { font-family: Arial, Helvetica, sans-serif; font-size: 32px; font-weight: 800; fill: #060709; }
      .detail-lbl { font-family: Arial, Helvetica, sans-serif; font-size: 24.5px; font-weight: 800; fill: #08090c; }
      .detail-colon { font-family: Arial, Helvetica, sans-serif; font-size: 24.5px; font-weight: 800; fill: #08090c; }
      .detail-val { font-family: Arial, Helvetica, sans-serif; font-size: 24.5px; font-weight: 800; fill: #08090c; }
    </style>
  </defs>

  <!-- Background White Card Surface with Rounded Corners -->
  <rect x="0" y="0" width="540" height="856" rx="32" ry="32" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5"/>

  <g clip-path="url(#cardClip)">
    <!-- 1. Official Crest (Eagle, Sun, Elephants, Banner) -->
    <image href="assets/ady-patil-crest-cropped.png" x="175" y="24" width="190" height="138" preserveAspectRatio="xMidYMin meet"/>

    <!-- 2. Tagline / Motto -->
    <text class="motto" x="270" y="180" text-anchor="middle">"Empowerment through quality technical education"</text>

    <!-- 3. Primary Header: AJEENKYA -->
    <text class="brand" x="270" y="228" text-anchor="middle">AJEENKYA</text>

    <!-- 4. College: DY Patil School of Engineering -->
    <text class="school" x="270" y="271" text-anchor="middle">DY Patil School of Engineering</text>

    <!-- 5. Accreditation: Approved by AICTE, DTE & Affiliated to SPPU -->
    <text class="approval" x="270" y="310" text-anchor="middle">Approved by AICTE, DTE &amp; Affiliated to SPPU</text>

    <!-- 6. Student Portrait Frame & Photo -->
    <g transform="translate(182, 344)">
      <rect x="0" y="0" width="176" height="226" fill="#edf2f7" stroke="#0a0b0d" stroke-width="3.5"/>
      <image href="assets/sample-student-photo.jpg" x="2" y="2" width="172" height="222" preserveAspectRatio="xMidYMid slice"/>
    </g>

    <!-- 7. Full Student Name -->
    <text class="name" x="270" y="608" text-anchor="middle">Tambe Sarthak Mahesh</text>

    <!-- 8. Student Details Block (Aligned labels, colons, and values) -->
    <g transform="translate(48, 646)">
      <!-- Row 1: Branch -->
      <text class="detail-lbl" x="0" y="0">Branch</text>
      <text class="detail-colon" x="98" y="0">:</text>
      <text class="detail-val" x="116" y="0">Diploma Computer Engg</text>

      <!-- Row 2: Class -->
      <text class="detail-lbl" x="0" y="38">Class</text>
      <text class="detail-colon" x="98" y="38">:</text>
      <text class="detail-val" x="116" y="38">FY-SEM-IV</text>

      <!-- Row 3: Year (2026-2027) -->
      <text class="detail-lbl" x="0" y="76">Year</text>
      <text class="detail-colon" x="98" y="76">:</text>
      <text class="detail-val" x="116" y="76">2026-2027</text>

      <!-- Row 4: UID -->
      <text class="detail-lbl" x="0" y="114">UID</text>
      <text class="detail-colon" x="98" y="114">:</text>
      <text class="detail-val" x="116" y="114">DEN23244564</text>
    </g>

    <!-- 9. Crisp Crimson Divider Line -->
    <line x1="28" y1="780" x2="512" y2="780" stroke="#c63737" stroke-width="2.6"/>

    <!-- 10. Real Scannable Code 128 Barcode for UID DEN23244564 -->
    <g id="barcode-bars">
${svgBars.join('\n')}
    </g>
  </g>
</svg>`;

  const outPath = path.join(__dirname, '..', 'ady-patil-college-id-sample-template.svg');
  fs.writeFileSync(outPath, content);
  console.log('Saved to ' + outPath);
  console.log('SVG updated with aligned colons and year 2025-2026!');
}

buildSvg();

