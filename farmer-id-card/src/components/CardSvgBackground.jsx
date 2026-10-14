import React from 'react';

/**
 * CardSvgBackground: Professional Agricultural Topographic & Field Background.
 *
 * Implements Major Visual Correction:
 * - Removed cartoon leaf/sticker drawings.
 * - Single authoritative border architecture: NO outer border drawn inside SVG.
 *   The outer 3.2 mm border is exclusively handled by the card's outer CSS shell.
 * - Optional single mathematical inner keyline: Inset 12 px (1.2 mm), R = 20 px (32 - 12),
 *   guaranteeing zero corner seam, halo, or double-line conflict.
 * - Field-based graphics: Topographic agricultural elevation/contour lines,
 *   subtle crop plot boundary hairlines, and faint distant horizon.
 * - Quiet Zones:
 *   - FRONT: Top 70% (Photo, Names, Personal Grid, UID, QR, Farmer ID) is 100% quiet cream.
 *   - BACK: Top 65% (Enrollment, Address, Land Table) is 100% quiet cream.
 * - Restrained Palette:
 *   - Base: #FBF8EE
 *   - Primary Green: #245F3D
 *   - Pale Green: #DCE7D7
 *   - Very Pale Green: #EAF0E5
 *   - Muted Gold: #D4B14A
 *   - Background Line Green: #C9D8C6
 *   - Background Gold: #E6D69B
 *   - Deep Text: #243C34
 * - Visual contrast strictly kept between 3%–6% to never compete with text.
 */
export const CardSvgBackground = ({
  side = 'front', // 'front' | 'back'
  config = {}
}) => {
  const {
    color = '#FBF8EE',
    opacity = 1,
    brightness = 100,
    contrast = 100,
    imageUrl = '',
    imageScale = 1,
    imagePositionX = 0,
    imagePositionY = 0,
    showDecorative = true,
    decorativeOpacity = 1,
    watermarkOpacity = 0.85,
    headerColor = '#245F3D',
    goldAccentColor = '#D4B14A',
    showBottomAccent = false,
    showSolidHeader = false,
    showInnerKeyline = true
  } = config;

  return (
    <svg
      viewBox="0 0 856 540"
      width="100%"
      height="100%"
      preserveAspectRatio="none"
      className="absolute inset-0 pointer-events-none select-none z-0"
      style={{
        borderRadius: '32px',
        overflow: 'hidden',
        filter: `brightness(${brightness}%) contrast(${contrast}%)`
      }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Exact CR80 physical 3.2 mm inner clipping mask */}
        <clipPath id={`cardClip_${side}`}>
          <rect width="856" height="540" rx="32" ry="32" />
        </clipPath>

        {/* Calm Ivory / Cream Base Gradient (#FBF8EE) */}
        <linearGradient id={`creamBaseGrad_${side}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color || '#FBF8EE'} />
          <stop offset="60%" stopColor="#FAF6EA" />
          <stop offset="100%" stopColor="#F5EFE0" />
        </linearGradient>

        {/* Deep Agricultural Green Gradient for Optional Banner */}
        <linearGradient id={`headerGreenGrad_${side}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={headerColor || '#245F3D'} />
          <stop offset="50%" stopColor="#2E754B" />
          <stop offset="100%" stopColor="#1E5435" />
        </linearGradient>

        {/* Muted Gold Accent Gradient (#D4B14A) */}
        <linearGradient id={`goldLineGrad_${side}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={goldAccentColor || '#D4B14A'} stopOpacity="0.75" />
          <stop offset="30%" stopColor="#E6D69B" />
          <stop offset="50%" stopColor="#F0E3B6" />
          <stop offset="70%" stopColor="#E6D69B" />
          <stop offset="100%" stopColor={goldAccentColor || '#D4B14A'} stopOpacity="0.75" />
        </linearGradient>
      </defs>

      <g clipPath={`url(#cardClip_${side})`}>
        {/* ============================================================== */}
        {/* 1. BASE BACKGROUND LAYER (WARM IVORY / CREAM BASE)            */}
        {/* ============================================================== */}
        <rect
          width="856"
          height="540"
          rx="32"
          fill={`url(#creamBaseGrad_${side})`}
          opacity={opacity}
        />

        {/* Custom Uploaded Background Image (if any) */}
        {imageUrl && (
          <image
            href={imageUrl}
            x={imagePositionX || 0}
            y={imagePositionY || 0}
            width={856 * (imageScale || 1)}
            height={540 * (imageScale || 1)}
            preserveAspectRatio="xMidYMid slice"
            opacity={opacity}
          />
        )}

        {/* ============================================================== */}
        {/* 2. REFINED AGRICULTURAL GRAPHICS & TOPOGRAPHIC CONTOURS        */}
        {/* ============================================================== */}
        {showDecorative && (
          <g opacity={decorativeOpacity}>
            {/* Optional Solid Green Header Banner (if toggled) */}
            {showSolidHeader && (
              <path
                d="M 0,32 Q 0,0 32,0 L 824,0 Q 856,0 856,32 L 856,58 L 0,58 Z"
                fill={`url(#headerGreenGrad_${side})`}
              />
            )}

            {/* ZONE A: THIN MUTED GOLD DIVIDER KEYLINE BELOW HEADER */}
            <line
              x1="36"
              y1="58"
              x2="820"
              y2="58"
              stroke={`url(#goldLineGrad_${side})`}
              strokeWidth="1.2"
              strokeLinecap="round"
            />

            {/* ZONE A: ULTRA-SUBTLE REFINED SEED/SPROUT ACCENT AT TOP-RIGHT */}
            <g transform="translate(794, 20)" opacity="0.12">
              <path
                d="M 16,3 C 9,5 5,12 7,19 C 14,17 18,11 16,3 Z"
                fill="#C9D8C6"
              />
            </g>

            {/* ========================================================== */}
            {/* ZONE C: TOPOGRAPHIC FIELD CONTOUR MAP WATERMARK            */}
            {/* Zone B (Center & Data Regions) is completely protected     */}
            {/* ========================================================== */}
            {side === 'front' ? (
              /* -------------------------------------------------------- */
              /* FRONT SIDE: Biased toward Lower-Left and Lower-Center    */
              /* Top 70% (y = 0 to 390) is 100% calm cream                */
              /* -------------------------------------------------------- */
              <g opacity={watermarkOpacity}>
                {/* 1. Faint Distant Horizon Hairline */}
                <path
                  d="M 36,462 Q 160,456 320,460 T 680,458 T 820,460"
                  stroke="#C9D8C6"
                  strokeWidth="0.65"
                  fill="none"
                  opacity="0.22"
                />

                {/* Minimalist soft grove canopy silhouette along horizon */}
                <path
                  d="M 52,462 C 55,456 63,454 68,460 C 74,453 84,452 90,459 C 96,455 106,456 110,462 Z"
                  fill="#EAF0E5"
                  opacity="0.30"
                />
                <path
                  d="M 120,462 C 123,458 128,456 132,460 C 136,456 144,455 148,462 Z"
                  fill="#EAF0E5"
                  opacity="0.25"
                />

                {/* 2. Smooth Topographic Field Contour Furrows */}
                {/* Math-controlled smooth curves with uniform 0.8px line weight */}
                <path
                  d="M 36,478 Q 180,466 360,476 T 760,474"
                  stroke="#C9D8C6"
                  strokeWidth="0.85"
                  fill="none"
                  opacity="0.30"
                />
                <path
                  d="M 36,496 Q 200,484 400,494 T 800,492"
                  stroke="#C9D8C6"
                  strokeWidth="0.85"
                  fill="none"
                  opacity="0.26"
                />
                <path
                  d="M 40,514 Q 220,502 440,512 T 820,510"
                  stroke="#C9D8C6"
                  strokeWidth="0.80"
                  fill="none"
                  opacity="0.22"
                />
                <path
                  d="M 48,530 Q 240,518 480,528 T 820,526"
                  stroke="#C9D8C6"
                  strokeWidth="0.75"
                  fill="none"
                  opacity="0.18"
                />

                {/* 3. Surveyed Agricultural Plot Boundary Hairlines */}
                <line
                  x1="260"
                  y1="476"
                  x2="236"
                  y2="530"
                  stroke="#C9D8C6"
                  strokeWidth="0.75"
                  strokeDasharray="4,4"
                  opacity="0.22"
                />
                <line
                  x1="460"
                  y1="476"
                  x2="436"
                  y2="530"
                  stroke="#C9D8C6"
                  strokeWidth="0.75"
                  strokeDasharray="4,4"
                  opacity="0.18"
                />

                {/* 4. Subtle Muted Gold Field Terrace Contour */}
                <path
                  d="M 36,488 Q 160,480 300,488"
                  stroke="#E6D69B"
                  strokeWidth="0.85"
                  fill="none"
                  opacity="0.45"
                />
              </g>
            ) : (
              /* -------------------------------------------------------- */
              /* BACK SIDE: Biased toward Lower-Right and Lower-Center    */
              /* Top 65% (y = 0 to 380) is 100% calm cream (Land Table)   */
              /* -------------------------------------------------------- */
              <g opacity={watermarkOpacity}>
                {/* 1. Faint Distant Horizon Hairline on Back */}
                <path
                  d="M 180,462 Q 420,456 640,460 T 820,458"
                  stroke="#C9D8C6"
                  strokeWidth="0.65"
                  fill="none"
                  opacity="0.22"
                />

                {/* Minimalist soft tree grove along right horizon */}
                <path
                  d="M 690,460 C 694,454 702,452 707,458 C 713,451 723,450 729,457 C 735,453 745,454 749,460 Z"
                  fill="#EAF0E5"
                  opacity="0.30"
                />
                <path
                  d="M 760,460 C 763,456 768,454 772,458 C 776,454 784,453 788,460 Z"
                  fill="#EAF0E5"
                  opacity="0.25"
                />

                {/* 2. Smooth Topographic Field Contour Furrows */}
                <path
                  d="M 220,476 Q 480,466 680,476 T 820,474"
                  stroke="#C9D8C6"
                  strokeWidth="0.85"
                  fill="none"
                  opacity="0.30"
                />
                <path
                  d="M 240,494 Q 510,484 710,494 T 820,492"
                  stroke="#C9D8C6"
                  strokeWidth="0.85"
                  fill="none"
                  opacity="0.26"
                />
                <path
                  d="M 260,512 Q 540,502 740,512 T 820,510"
                  stroke="#C9D8C6"
                  strokeWidth="0.80"
                  fill="none"
                  opacity="0.22"
                />
                <path
                  d="M 290,528 Q 570,518 770,528 T 820,526"
                  stroke="#C9D8C6"
                  strokeWidth="0.75"
                  fill="none"
                  opacity="0.18"
                />

                {/* 3. Surveyed Agricultural Plot Boundary Hairlines */}
                <line
                  x1="560"
                  y1="476"
                  x2="584"
                  y2="530"
                  stroke="#C9D8C6"
                  strokeWidth="0.75"
                  strokeDasharray="4,4"
                  opacity="0.22"
                />
                <line
                  x1="380"
                  y1="476"
                  x2="404"
                  y2="530"
                  stroke="#C9D8C6"
                  strokeWidth="0.75"
                  strokeDasharray="4,4"
                  opacity="0.18"
                />

                {/* 4. Subtle Muted Gold Field Terrace Contour */}
                <path
                  d="M 520,488 Q 660,480 820,488"
                  stroke="#E6D69B"
                  strokeWidth="0.85"
                  fill="none"
                  opacity="0.45"
                />
              </g>
            )}

            {/* THIN MUTED GOLD DIVIDER KEYLINE ABOVE FOOTER */}
            <line
              x1="36"
              y1="472"
              x2="820"
              y2="472"
              stroke={`url(#goldLineGrad_${side})`}
              strokeWidth="1.0"
              strokeLinecap="round"
              opacity="0.65"
            />

            {/* ========================================================== */}
            {/* 3. OPTIONAL SINGLE CONCENTRIC INNER KEYLINE                */}
            {/* Inset 12 px (1.2 mm), R = 20 px (32 - 12 = 20).            */}
            {/* Mathematically concentric, zero corner collision.          */}
            {/* ========================================================== */}
            {showInnerKeyline && (
              <rect
                x="12"
                y="12"
                width="832"
                height="516"
                rx="20"
                ry="20"
                fill="none"
                stroke="#E6D69B"
                strokeWidth="0.75"
                opacity="0.35"
              />
            )}
          </g>
        )}
      </g>
    </svg>
  );
};
