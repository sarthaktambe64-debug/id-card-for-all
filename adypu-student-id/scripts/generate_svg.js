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

function generateSvg() {
  const text = 'DEN23244564';
  const codes = [104];
  let sum = 104;
  for (let i = 0; i < text.length; i++) {
    const val = text.charCodeAt(i) - 32;
    codes.push(val);
    sum += val * (i + 1);
  }
  codes.push(sum % 103);
  codes.push(106);

  const patternStr = codes.map(c => PATTERNS[c]).join('');
  let totalModules = 0;
  for (const ch of patternStr) totalModules += Number(ch);

  const targetW = 432;
  const scale = targetW / totalModules;
  const startX = 54;
  const startY = 801;
  const barH = 48;

  let svgBars = [];
  let curX = startX;
  let isBar = true;
  for (const ch of patternStr) {
    const w = Number(ch) * scale;
    if (isBar) {
      svgBars.push(`    <rect x="${curX.toFixed(2)}" y="${startY}" width="${w.toFixed(2)}" height="${barH}" fill="#07080b"/>`);
    }
    curX += w;
    isBar = !isBar;
  }

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="54mm" height="85.6mm" viewBox="0 0 540 856" role="img" aria-labelledby="title desc">
  <title id="title">Ajeenkya DY Patil School of Engineering Student ID Card - Tambe Sarthak Mahesh</title>
  <desc id="desc">Authorized Institutional Student ID Card</desc>
  <defs>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="540" height="856" rx="32" ry="32"/>
    </clipPath>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="#000000" flood-opacity="0.22"/>
    </filter>
    <style>
      .motto { font: italic 700 23px Georgia, "Times New Roman", serif; fill: #1a1a1a; }
      .brand { font: 700 55px Georgia, "Times New Roman", serif; letter-spacing: 9px; fill: #b62826; }
      .school { font: 700 34px Georgia, "Times New Roman", serif; fill: #134474; }
      .approval { font: italic 700 24.5px Georgia, "Times New Roman", serif; fill: #1a1a1a; }
      .name { font: 800 37px Arial, Helvetica, sans-serif; fill: #07080b; }
      .label { font: 800 32.5px Arial, Helvetica, sans-serif; fill: #07080b; }
      .val { font: 800 32.5px Arial, Helvetica, sans-serif; fill: #07080b; }
    </style>
  </defs>

  <!-- Card Base with Shadow -->
  <g filter="url(#cardShadow)">
    <rect x="0" y="0" width="540" height="856" rx="32" ry="32" fill="#ffffff" stroke="#d5dde3" stroke-width="2"/>
  </g>

  <g clip-path="url(#cardClip)">
    <!-- Crisp White Card Surface -->
    <rect x="0" y="0" width="540" height="856" fill="#ffffff"/>

    <!-- Official Ajeenkya Crest -->
    <image href="assets/ady-patil-crest-cropped.png" x="179" y="26" width="182" height="135" preserveAspectRatio="xMidYMin meet"/>

    <!-- Motto -->
    <text class="motto" x="270" y="174" text-anchor="middle">"Empowerment through quality technical education"</text>

    <!-- Brand: AJEENKYA -->
    <text class="brand" x="270" y="228" text-anchor="middle">AJEENKYA</text>

    <!-- School Title -->
    <text class="school" x="270" y="278" text-anchor="middle">DY Patil School of Engineering</text>

    <!-- Accreditations -->
    <text class="approval" x="270" y="322" text-anchor="middle">Approved by AICTE, DTE &amp; Affiliated to SPPU</text>

    <!-- Student Portrait Frame & Photo -->
    <g transform="translate(182, 358)">
      <rect x="0" y="0" width="176" height="228" fill="#edf2f7" stroke="#08090b" stroke-width="3.8"/>
      <image href="assets/sample-student-photo.jpg" x="2" y="2" width="172" height="224" preserveAspectRatio="xMidYMid slice"/>
    </g>

    <!-- Student Full Name -->
    <text class="name" x="270" y="628" text-anchor="middle">Tambe Sarthak Mahesh</text>

    <!-- Student Details Grid -->
    <g transform="translate(56, 672)">
      <text class="label" x="0" y="0">Branch :</text>
      <text class="val" x="146" y="0">Diploma Computer Engg</text>

      <text class="label" x="0" y="42">Class :</text>
      <text class="val" x="122" y="42">FY-SEM-I</text>

      <text class="label" x="0" y="84">Year :</text>
      <text class="val" x="112" y="84">2023-2024</text>

      <text class="label" x="0" y="126">UID :</text>
      <text class="val" x="98" y="126">DEN23244564</text>
    </g>

    <!-- Thin Crimson Divider Line -->
    <line x1="32" y1="792" x2="508" y2="792" stroke="#c63737" stroke-width="2.8"/>

    <!-- Code 128 Real Scannable Barcode for DEN23244564 -->
    <g id="barcode-code128">
${svgBars.join('\n')}
    </g>
  </g>
</svg>`;

  const outPath = path.join(__dirname, '..', 'ady-patil-college-id-sample-template.svg');
  fs.writeFileSync(outPath, svgContent);
  console.log('SVG written to ' + outPath);
  console.log('SVG written successfully!');
}

generateSvg();

