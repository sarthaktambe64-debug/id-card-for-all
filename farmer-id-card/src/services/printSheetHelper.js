/**
 * Multi-Card A4 Print Sheet Helper & Layout Engine
 * Calculates optimal physical card packing on A4 sheets (210 × 297 mm)
 * and computes duplex back-side mirror alignment for physical registration.
 */

export const DEFAULT_PRINT_PRESETS = [
  {
    id: 'a4-portrait-10',
    name: 'A4 Portrait – 10 Cards (Compact Grid)',
    paper: 'A4',
    orientation: 'portrait',
    pageWidthMm: 210,
    pageHeightMm: 297,
    cardWidthMm: 85.6,
    cardHeightMm: 54.0,
    marginTopMm: 8,
    marginBottomMm: 8,
    marginLeftMm: 8,
    marginRightMm: 8,
    gapXMm: 2.5,
    gapYMm: 2.5,
    duplexFlip: 'long-edge',
    mirrorBack: true,
    showCutGuides: true
  },
  {
    id: 'a4-portrait-8',
    name: 'A4 Portrait – 8 Cards (Comfortable Margins)',
    paper: 'A4',
    orientation: 'portrait',
    pageWidthMm: 210,
    pageHeightMm: 297,
    cardWidthMm: 85.6,
    cardHeightMm: 54.0,
    marginTopMm: 12,
    marginBottomMm: 12,
    marginLeftMm: 12,
    marginRightMm: 12,
    gapXMm: 5,
    gapYMm: 6,
    duplexFlip: 'long-edge',
    mirrorBack: true,
    showCutGuides: true
  },
  {
    id: 'a4-landscape-9',
    name: 'A4 Landscape – 9 Cards (3×3 Grid)',
    paper: 'A4',
    orientation: 'landscape',
    pageWidthMm: 297,
    pageHeightMm: 210,
    cardWidthMm: 85.6,
    cardHeightMm: 54.0,
    marginTopMm: 10,
    marginBottomMm: 10,
    marginLeftMm: 10,
    marginRightMm: 10,
    gapXMm: 5,
    gapYMm: 5,
    duplexFlip: 'short-edge',
    mirrorBack: true,
    showCutGuides: true
  },
  {
    id: 'canon-pvc-tray',
    name: 'Canon / Epson PVC Sheet – A4',
    paper: 'A4',
    orientation: 'portrait',
    pageWidthMm: 210,
    pageHeightMm: 297,
    cardWidthMm: 85.6,
    cardHeightMm: 54.0,
    marginTopMm: 10,
    marginBottomMm: 10,
    marginLeftMm: 10,
    marginRightMm: 10,
    gapXMm: 3,
    gapYMm: 3,
    duplexFlip: 'long-edge',
    mirrorBack: true,
    showCutGuides: true
  }
];

export function calculateSheetPacking({
  pageWidthMm = 210,
  pageHeightMm = 297,
  cardWidthMm = 85.6,
  cardHeightMm = 54.0,
  marginLeftMm = 10,
  marginRightMm = 10,
  marginTopMm = 10,
  marginBottomMm = 10,
  gapXMm = 4,
  gapYMm = 4,
  totalCards = 0
}) {
  const availW = Math.max(10, pageWidthMm - marginLeftMm - marginRightMm);
  const availH = Math.max(10, pageHeightMm - marginTopMm - marginBottomMm);

  const cols = Math.max(1, Math.floor((availW + gapXMm) / (cardWidthMm + gapXMm)));
  const rows = Math.max(1, Math.floor((availH + gapYMm) / (cardHeightMm + gapYMm)));

  const gridW = cols * cardWidthMm + (cols - 1) * gapXMm;
  const gridH = rows * cardHeightMm + (rows - 1) * gapYMm;

  // Center within margins
  const startX = marginLeftMm + (availW - gridW) / 2;
  const startY = marginTopMm + (availH - gridH) / 2;

  const capacityPerPage = cols * rows;
  const totalPages = Math.max(1, Math.ceil(totalCards / capacityPerPage));

  return {
    cols,
    rows,
    capacityPerPage,
    startX,
    startY,
    gridW,
    gridH,
    totalPages
  };
}

export function getSlotCoordinates({
  slotIndex,
  isBackSide = false,
  cols,
  rows,
  startX,
  startY,
  cardWidthMm = 85.6,
  cardHeightMm = 54.0,
  gapXMm = 4,
  gapYMm = 4,
  duplexFlip = 'long-edge',
  mirrorBack = true
}) {
  let col = slotIndex % cols;
  let row = Math.floor(slotIndex / cols);

  if (isBackSide && mirrorBack) {
    if (duplexFlip === 'long-edge') {
      // Horizontal column reflection for long-edge flip
      col = cols - 1 - col;
    } else if (duplexFlip === 'short-edge') {
      // Vertical row reflection for short-edge flip
      row = rows - 1 - row;
    }
  }

  const x = startX + col * (cardWidthMm + gapXMm);
  const y = startY + row * (cardHeightMm + gapYMm);

  return { x, y, col, row };
}
