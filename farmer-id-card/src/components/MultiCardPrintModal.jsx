import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import { CardRenderer } from './CardRenderer';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Printer,
  FileDown,
  X,
  CreditCard,
  Copy,
  Plus,
  Trash2,
  RotateCcw,
  Sliders,
  Check,
  CheckSquare,
  Square,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Layers,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Scissors,
  Save,
  HelpCircle,
  Users
} from 'lucide-react';
import {
  DEFAULT_PRINT_PRESETS,
  calculateSheetPacking,
  getSlotCoordinates as helperGetSlotCoordinates
} from '../services/printSheetHelper';

const LOCAL_STORAGE_PRESETS_KEY = 'krishi_print_custom_presets_v1';

export const MultiCardPrintModal = ({
  template,
  farmers = [],
  activeFarmer,
  isOpen,
  onClose
}) => {
  // Mode: 'single' (duplicate active/chosen farmer) | 'batch' (select multiple farmers)
  const [sourceMode, setSourceMode] = useState('single');

  // Single mode state
  const [singleFarmerId, setSingleFarmerId] = useState(activeFarmer?.id || farmers[0]?.id || '');
  const [singleCopyCount, setSingleCopyCount] = useState(8);

  // Batch mode state: Set of selected farmer IDs
  const [selectedFarmerIds, setSelectedFarmerIds] = useState(new Set(farmers.map((f) => f.id)));
  const [batchCopiesPerFarmer, setBatchCopiesPerFarmer] = useState(1);

  // Cards on Sheet: Array of { id, farmerId, farmer }
  const [sheetCards, setSheetCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [clipboardCard, setClipboardCard] = useState(null);

  // Layout Configuration
  const [layoutConfig, setLayoutConfig] = useState(DEFAULT_PRINT_PRESETS[0]);
  const [customPresets, setCustomPresets] = useState([]);
  const [customPresetName, setCustomPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  // Duplex Mode: 'both' | 'front' | 'back'
  const [duplexSide, setDuplexSide] = useState('both');
  // Active sheet preview side: 'front' | 'back'
  const [previewSide, setPreviewSide] = useState('front');
  // Current preview page index (0-indexed)
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  // Canvas View Zoom: 0.5, 0.75, 1.0, 1.5
  const [zoom, setZoom] = useState(0.85);

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState('');

  // Hidden print canvas refs
  const offscreenContainerRef = useRef(null);
  const sheetPreviewRef = useRef(null);

  // Load custom presets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_PRESETS_KEY);
      if (saved) {
        setCustomPresets(JSON.parse(saved));
      }
    } catch (_) {}
  }, []);

  // Initialize sheet cards with single farmer copies or active farmer
  useEffect(() => {
    if (isOpen && sheetCards.length === 0) {
      const targetFarmer = farmers.find((f) => f.id === singleFarmerId) || activeFarmer || farmers[0];
      if (targetFarmer) {
        const initialCards = Array.from({ length: 8 }, (_, i) => ({
          id: `card_${Date.now()}_${i}`,
          farmerId: targetFarmer.id,
          farmer: targetFarmer
        }));
        setSheetCards(initialCards);
        if (initialCards.length > 0) {
          setSelectedCardId(initialCards[0].id);
        }
      }
    }
  }, [isOpen, singleFarmerId, activeFarmer, farmers, sheetCards.length]);

  // Synchronize singleFarmerId if activeFarmer changes
  useEffect(() => {
    if (activeFarmer?.id) {
      setSingleFarmerId(activeFarmer.id);
    }
  }, [activeFarmer]);

  // Automatic Sheet Packing Calculation
  const packing = useMemo(() => {
    const {
      pageWidthMm,
      pageHeightMm,
      cardWidthMm,
      cardHeightMm,
      marginLeftMm,
      marginRightMm,
      marginTopMm,
      marginBottomMm,
      gapXMm,
      gapYMm
    } = layoutConfig;

    const availW = Math.max(10, pageWidthMm - marginLeftMm - marginRightMm);
    const availH = Math.max(10, pageHeightMm - marginTopMm - marginBottomMm);

    const cols = Math.max(1, Math.floor((availW + gapXMm) / (cardWidthMm + gapXMm)));
    const rows = Math.max(1, Math.floor((availH + gapYMm) / (cardHeightMm + gapYMm)));

    const gridW = cols * cardWidthMm + (cols - 1) * gapXMm;
    const gridH = rows * cardHeightMm + (rows - 1) * gapYMm;

    // Centered origin within printable margins
    const startX = marginLeftMm + (availW - gridW) / 2;
    const startY = marginTopMm + (availH - gridH) / 2;

    const capacityPerPage = cols * rows;
    const totalPages = Math.max(1, Math.ceil(sheetCards.length / capacityPerPage));

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
  }, [layoutConfig, sheetCards.length]);

  // Ensure current preview page is within bounds
  useEffect(() => {
    if (previewPageIndex >= packing.totalPages) {
      setPreviewPageIndex(Math.max(0, packing.totalPages - 1));
    }
  }, [packing.totalPages, previewPageIndex]);

  // Calculate coordinates for any card slot (Front vs Back Duplex Mirroring)
  const getSlotCoordinates = useCallback(
    (slotIndex, isBackSide) => {
      const { cols, rows, startX, startY } = packing;
      const { cardWidthMm, cardHeightMm, gapXMm, gapYMm, duplexFlip, mirrorBack } = layoutConfig;

      let col = slotIndex % cols;
      let row = Math.floor(slotIndex / cols);

      if (isBackSide && mirrorBack) {
        if (duplexFlip === 'long-edge') {
          // Standard Long-Edge Duplex (horizontal column mirroring)
          col = cols - 1 - col;
        } else if (duplexFlip === 'short-edge') {
          // Short-Edge Duplex (vertical row mirroring)
          row = rows - 1 - row;
        }
      }

      const x = startX + col * (cardWidthMm + gapXMm);
      const y = startY + row * (cardHeightMm + gapYMm);

      return { x, y, col, row };
    },
    [packing, layoutConfig]
  );

  // 1-Click Action: Populate N copies of current farmer
  const handleGenerateSingleFarmerCopies = (count) => {
    const target = farmers.find((f) => f.id === singleFarmerId) || activeFarmer;
    if (!target) return;
    const newCards = Array.from({ length: count }, (_, i) => ({
      id: `card_${Date.now()}_${i}`,
      farmerId: target.id,
      farmer: target
    }));
    setSheetCards(newCards);
    if (newCards.length > 0) {
      setSelectedCardId(newCards[0].id);
    }
    setPreviewPageIndex(0);
  };

  // 1-Click Action: Add selected batch farmers to sheet
  const handleAddBatchFarmers = () => {
    const selectedList = farmers.filter((f) => selectedFarmerIds.has(f.id));
    if (selectedList.length === 0) return;

    const newCards = [];
    selectedList.forEach((farmer) => {
      for (let c = 0; c < batchCopiesPerFarmer; c++) {
        newCards.push({
          id: `card_${Date.now()}_${farmer.id}_${c}`,
          farmerId: farmer.id,
          farmer
        });
      }
    });

    setSheetCards((prev) => [...prev, ...newCards]);
  };

  // Duplicate Selected Card
  const handleDuplicateSelected = useCallback(() => {
    if (!selectedCardId) return;
    const idx = sheetCards.findIndex((c) => c.id === selectedCardId);
    if (idx === -1) return;
    const target = sheetCards[idx];
    const duplicated = {
      ...target,
      id: `card_${Date.now()}_copy`
    };
    const next = [...sheetCards];
    next.splice(idx + 1, 0, duplicated);
    setSheetCards(next);
    setSelectedCardId(duplicated.id);
  }, [selectedCardId, sheetCards]);

  // Copy Selected Card
  const handleCopySelected = useCallback(() => {
    if (!selectedCardId) return;
    const target = sheetCards.find((c) => c.id === selectedCardId);
    if (target) {
      setClipboardCard({ ...target });
    }
  }, [selectedCardId, sheetCards]);

  // Paste Card
  const handlePasteCard = useCallback(() => {
    if (!clipboardCard) return;
    const pasted = {
      ...clipboardCard,
      id: `card_${Date.now()}_pasted`
    };
    setSheetCards((prev) => [...prev, pasted]);
    setSelectedCardId(pasted.id);
  }, [clipboardCard]);

  // Delete Selected Card
  const handleDeleteSelected = useCallback(() => {
    if (!selectedCardId) return;
    const next = sheetCards.filter((c) => c.id !== selectedCardId);
    setSheetCards(next);
    setSelectedCardId(next.length > 0 ? next[0].id : null);
  }, [selectedCardId, sheetCards]);

  // Add 1 card of active farmer
  const handleAddOneCard = () => {
    const target = farmers.find((f) => f.id === singleFarmerId) || activeFarmer || farmers[0];
    if (!target) return;
    const card = {
      id: `card_${Date.now()}_one`,
      farmerId: target.id,
      farmer: target
    };
    setSheetCards((prev) => [...prev, card]);
    setSelectedCardId(card.id);
  };

  // Keyboard Shortcuts (Ctrl+D, Ctrl+C, Ctrl+V, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopySelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePasteCard();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDuplicateSelected, handleCopySelected, handlePasteCard, handleDeleteSelected]);

  // Preset Selection
  const handleSelectPreset = (preset) => {
    setLayoutConfig({ ...preset });
  };

  // Save Custom Preset
  const handleSaveCustomPreset = () => {
    if (!customPresetName.trim()) return;
    const newPreset = {
      ...layoutConfig,
      id: `preset_${Date.now()}`,
      name: customPresetName.trim()
    };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    localStorage.setItem(LOCAL_STORAGE_PRESETS_KEY, JSON.stringify(updated));
    setCustomPresetName('');
    setIsSavingPreset(false);
  };

  // Gap & Margin Presets
  const handleApplyMarginPreset = (type) => {
    if (type === 'compact') {
      setLayoutConfig((prev) => ({
        ...prev,
        marginTopMm: 8,
        marginBottomMm: 8,
        marginLeftMm: 8,
        marginRightMm: 8,
        gapXMm: 2.5,
        gapYMm: 2.5
      }));
    } else if (type === 'normal') {
      setLayoutConfig((prev) => ({
        ...prev,
        marginTopMm: 10,
        marginBottomMm: 10,
        marginLeftMm: 10,
        marginRightMm: 10,
        gapXMm: 4,
        gapYMm: 4
      }));
    } else if (type === 'easy-cut') {
      setLayoutConfig((prev) => ({
        ...prev,
        marginTopMm: 12,
        marginBottomMm: 12,
        marginLeftMm: 12,
        marginRightMm: 12,
        gapXMm: 6,
        gapYMm: 6
      }));
    }
  };

  // Reset to Standard CR80 Card Dimensions
  const handleResetStandardCR80 = () => {
    setLayoutConfig((prev) => ({
      ...prev,
      cardWidthMm: 85.6,
      cardHeightMm: 54.0
    }));
  };

  // High-Resolution 300-DPI Multi-Page PDF Export
  const handleExportPDF = async () => {
    if (sheetCards.length === 0) {
      alert('Please add at least one card to the print sheet.');
      return;
    }

    setIsExporting(true);
    setExportProgress('Initializing 300-DPI A4 PDF generator...');

    try {
      const { orientation, pageWidthMm, pageHeightMm, cardWidthMm, cardHeightMm, showCutGuides } = layoutConfig;
      const { capacityPerPage, totalPages } = packing;

      const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
      });

      // Cache rendered canvas data URLs for unique (farmerId + side) pairs
      const cardImageCache = new Map();

      // Render helper with html2canvas
      const renderCardCanvas = async (farmer, side) => {
        const cacheKey = `${farmer.id}_${side}`;
        if (cardImageCache.has(cacheKey)) {
          return cardImageCache.get(cacheKey);
        }

        // Render in hidden container
        const host = document.createElement('div');
        host.style.position = 'fixed';
        host.style.top = '-9999px';
        host.style.left = '-9999px';
        host.style.width = '856px';
        host.style.height = '540px';
        document.body.appendChild(host);

        // Mount CardRenderer in host
        const root = createRoot(host);

        await new Promise((resolve) => {
          root.render(
            <CardRenderer
              template={template}
              side={side}
              farmer={farmer}
              scale={1}
              interactive={false}
              backgroundMode="vector"
            />
          );
          setTimeout(resolve, 80);
        });

        const cardInner = host.querySelector('.card-inner') || host.querySelector('.card-renderer-root') || host;
        const canvas = await html2canvas(cardInner, {
          scale: 3.5, // Crisp 300+ DPI
          useCORS: true,
          logging: false,
          backgroundColor: '#FAF6EC',
          onclone: (clonedDoc) => {
            const card = clonedDoc.querySelector('.card-inner');
            if (card) {
              card.style.transform = 'none';
              card.style.boxShadow = 'none';
            }
          }
        });

        const imgData = canvas.toDataURL('image/png');
        cardImageCache.set(cacheKey, imgData);

        root.unmount();
        document.body.removeChild(host);
        return imgData;
      };

      // Loop over sheets / pages
      let isFirstPdfPage = true;

      for (let p = 0; p < totalPages; p++) {
        const startIdx = p * capacityPerPage;
        const pageCards = sheetCards.slice(startIdx, startIdx + capacityPerPage);

        // --- PAGE 1: FRONTS ---
        if (duplexSide === 'front' || duplexSide === 'both') {
          setExportProgress(`Rendering Sheet ${p + 1} of ${totalPages} (Fronts)...`);
          if (!isFirstPdfPage) {
            pdf.addPage('a4', orientation);
          }
          isFirstPdfPage = false;

          // Render front cards
          for (let s = 0; s < pageCards.length; s++) {
            const item = pageCards[s];
            const coords = getSlotCoordinates(s, false);
            const frontImg = await renderCardCanvas(item.farmer, 'front');
            pdf.addImage(frontImg, 'PNG', coords.x, coords.y, cardWidthMm, cardHeightMm);

            // Draw Cut Guides if enabled
            if (showCutGuides) {
              drawPdfCropMarks(pdf, coords.x, coords.y, cardWidthMm, cardHeightMm);
            }
          }
        }

        // --- PAGE 2: BACKS (with Duplex Mirroring) ---
        if (duplexSide === 'back' || duplexSide === 'both') {
          setExportProgress(`Rendering Sheet ${p + 1} of ${totalPages} (Backs - Mirrored for Duplex)...`);
          if (!isFirstPdfPage) {
            pdf.addPage('a4', orientation);
          }
          isFirstPdfPage = false;

          // Render back cards with duplex alignment
          for (let s = 0; s < pageCards.length; s++) {
            const item = pageCards[s];
            const coords = getSlotCoordinates(s, true);
            const backImg = await renderCardCanvas(item.farmer, 'back');
            pdf.addImage(backImg, 'PNG', coords.x, coords.y, cardWidthMm, cardHeightMm);

            // Draw Cut Guides if enabled
            if (showCutGuides) {
              drawPdfCropMarks(pdf, coords.x, coords.y, cardWidthMm, cardHeightMm);
            }
          }
        }
      }

      setExportProgress('Finalizing PDF download...');
      pdf.save(`farmer-id-sheet-a4-${sheetCards.length}cards.pdf`);
      setExportProgress('Download Complete!');
      setTimeout(() => setExportProgress(''), 2500);
    } catch (err) {
      console.error('Multi-Card PDF Export Error:', err);
      alert('Failed to generate PDF: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper: Draw corner tick cut guides in PDF
  const drawPdfCropMarks = (pdf, x, y, w, h) => {
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.15);
    const markLen = 3;
    const offset = 1;

    // Top-Left
    pdf.line(x - offset - markLen, y, x - offset, y);
    pdf.line(x, y - offset - markLen, x, y - offset);

    // Top-Right
    pdf.line(x + w + offset, y, x + w + offset + markLen, y);
    pdf.line(x + w, y - offset - markLen, x + w, y - offset);

    // Bottom-Left
    pdf.line(x - offset - markLen, y + h, x - offset, y + h);
    pdf.line(x, y + h + offset, x, y + h + offset + markLen);

    // Bottom-Right
    pdf.line(x + w + offset, y + h, x + w + offset + markLen, y + h);
    pdf.line(x + w, y + h + offset, x + w, y + h + offset + markLen);
  };

  // Direct Browser Print Action
  const handleDirectPrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  // Active page cards for on-screen preview
  const startCardIdx = previewPageIndex * packing.capacityPerPage;
  const currentSheetCards = sheetCards.slice(startCardIdx, startCardIdx + packing.capacityPerPage);
  const isBackPreview = previewSide === 'back';

  // Screen scale factor: 1 mm = 3.78 px (Standard 96 DPI CSS scale)
  const mmToPx = 3.7795;
  const previewCardScale = (layoutConfig.cardWidthMm / 85.6) * 0.38 * zoom;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-[96vw] h-[95vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center font-bold">
              <Copy size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  One-Click A4 Multi-Card Print Studio
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 border border-indigo-800/80 px-2 py-0.5 rounded-full">
                  Duplex Print Ready
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                  {sheetCards.length} {sheetCards.length === 1 ? 'Card' : 'Cards'} Queued
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Automatic A4 packing, front/back duplex registration & instant multi-card copy generation.
              </p>
            </div>
          </div>

          {/* Top Quick Actions & Close */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportPDF}
              disabled={isExporting || sheetCards.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg shadow-indigo-950/50 transition active:scale-95 disabled:opacity-50"
              title="Generate 300+ DPI A4 PDF with exact 85.6×54mm physical dimensions"
            >
              <FileDown size={15} />
              {isExporting ? (exportProgress || 'Generating PDF...') : 'Export A4 PDF'}
            </button>

            <button
              onClick={handleDirectPrint}
              disabled={sheetCards.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/50 transition active:scale-95 disabled:opacity-50"
              title="Print directly to connected printer (Ctrl+P)"
            >
              <Printer size={15} />
              Print Directly
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition ml-2"
              title="Close Print Studio"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Studio Workspace Layout */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Controls Drawer */}
          <div className="w-80 bg-slate-950/80 border-r border-slate-800 flex flex-col overflow-y-auto p-4 space-y-4 text-xs">
            {/* 1. Mode Switcher: Single Farmer (Copies) vs Batch Multi-Farmers */}
            <div className="space-y-2">
              <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                Card Source & Quantity
              </div>
              <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSourceMode('single')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    sourceMode === 'single'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Single Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('batch')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition ${
                    sourceMode === 'batch'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Batch Farmers ({farmers.length})
                </button>
              </div>
            </div>

            {/* Mode A: Single Farmer Copies */}
            {sourceMode === 'single' ? (
              <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Select Farmer</label>
                  <select
                    value={singleFarmerId}
                    onChange={(e) => setSingleFarmerId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white text-xs"
                  >
                    {farmers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name_english} ({f.farmer_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Number of Copies</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={singleCopyCount}
                      onChange={(e) => setSingleCopyCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-mono text-center font-bold"
                    />
                    <button
                      type="button"
                      onClick={() => handleGenerateSingleFarmerCopies(singleCopyCount)}
                      className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition shadow"
                    >
                      Fill Sheet ({singleCopyCount})
                    </button>
                  </div>
                </div>

                {/* Quick Presets for Copies */}
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1 font-semibold">Quick Count Presets:</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[1, 2, 4, 8, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setSingleCopyCount(num);
                          handleGenerateSingleFarmerCopies(num);
                        }}
                        className="py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition"
                      >
                        {num} {num === 1 ? 'Copy' : 'Copies'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* Mode B: Batch Multi-Farmers Selection */
              <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-semibold">Farmers to Print:</span>
                  <div className="flex items-center gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setSelectedFarmerIds(new Set(farmers.map((f) => f.id)))}
                      className="text-indigo-400 hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-slate-600">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedFarmerIds(new Set())}
                      className="text-slate-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Farmer Checklist */}
                <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 border border-slate-800 rounded-lg p-2 bg-slate-950/60">
                  {farmers.map((f) => {
                    const isChecked = selectedFarmerIds.has(f.id);
                    return (
                      <div
                        key={f.id}
                        onClick={() => {
                          const next = new Set(selectedFarmerIds);
                          if (isChecked) next.delete(f.id);
                          else next.add(f.id);
                          setSelectedFarmerIds(next);
                        }}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition text-xs ${
                          isChecked ? 'bg-indigo-950/70 text-white' : 'text-slate-400 hover:bg-slate-800/60'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare size={14} className="text-indigo-400 flex-shrink-0" />
                        ) : (
                          <Square size={14} className="text-slate-600 flex-shrink-0" />
                        )}
                        <span className="truncate flex-1">{f.name_english}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {f.land_records?.length ? `${f.land_records.length}P` : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">Copies/Each:</span>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={batchCopiesPerFarmer}
                      onChange={(e) => setBatchCopiesPerFarmer(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-12 bg-slate-900 border border-slate-700 rounded px-1.5 py-1 text-center font-bold text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBatchFarmers}
                    disabled={selectedFarmerIds.size === 0}
                    className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold rounded-lg transition"
                  >
                    Add {selectedFarmerIds.size} to Sheet
                  </button>
                </div>
              </div>
            )}

            {/* 2. Sheet Layout Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <span>Layout & Grid Preset</span>
                <span className="text-indigo-400 font-semibold">{layoutConfig.name}</span>
              </div>
              <div className="space-y-1.5">
                {[...DEFAULT_PRINT_PRESETS, ...customPresets].map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition border flex items-center justify-between ${
                      layoutConfig.id === preset.id
                        ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
                    }`}
                  >
                    <span className="truncate">{preset.name}</span>
                    <span className="text-[10px] opacity-75 font-mono ml-1">
                      {preset.orientation === 'portrait' ? 'Portrait' : 'Landscape'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Duplex & Mirror Alignment (Critical Requirement) */}
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>Duplex Print Options</span>
                <span className="text-emerald-400 font-mono text-[9px] uppercase">
                  {duplexSide}
                </span>
              </div>

              {/* Side Choice */}
              <div className="grid grid-cols-3 gap-1">
                {[
                  { id: 'both', label: 'Front + Back' },
                  { id: 'front', label: 'Front Only' },
                  { id: 'back', label: 'Back Only' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setDuplexSide(s.id)}
                    className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                      duplexSide === s.id
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {/* Duplex Flip Direction */}
              {duplexSide === 'both' && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Printer Flip Direction</label>
                    <select
                      value={layoutConfig.duplexFlip}
                      onChange={(e) => setLayoutConfig((prev) => ({ ...prev, duplexFlip: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
                    >
                      <option value="long-edge">Flip on Long Edge (Standard Portrait)</option>
                      <option value="short-edge">Flip on Short Edge (Standard Landscape)</option>
                      <option value="none">No Flip / Manual non-duplex feed</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300">
                    <input
                      type="checkbox"
                      checked={layoutConfig.mirrorBack}
                      onChange={(e) => setLayoutConfig((prev) => ({ ...prev, mirrorBack: e.target.checked }))}
                      className="rounded accent-emerald-500"
                    />
                    <span>Mirror Back for Duplex Alignment</span>
                  </label>
                  <p className="text-[9px] text-slate-500 leading-normal">
                    When turning paper on duplex print, column positions flip horizontally. Mirroring aligns Front and Back cards back-to-back.
                  </p>
                </div>
              )}
            </div>

            {/* 4. Spacing, Gaps & Cut Guides */}
            <div className="space-y-2 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
              <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center justify-between">
                <span>Margins & Cut Guides</span>
                <button
                  type="button"
                  onClick={handleResetStandardCR80}
                  className="text-[10px] text-indigo-400 hover:underline"
                >
                  Standard CR80
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1 mb-2">
                <button
                  type="button"
                  onClick={() => handleApplyMarginPreset('compact')}
                  className="py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  Compact
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyMarginPreset('normal')}
                  className="py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyMarginPreset('easy-cut')}
                  className="py-1 text-[10px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700"
                >
                  Easy Cut
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <label className="text-slate-500">Margin (mm)</label>
                  <input
                    type="number"
                    value={layoutConfig.marginTopMm}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setLayoutConfig((prev) => ({
                        ...prev,
                        marginTopMm: v,
                        marginBottomMm: v,
                        marginLeftMm: v,
                        marginRightMm: v
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-slate-500">Gap (mm)</label>
                  <input
                    type="number"
                    value={layoutConfig.gapXMm}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setLayoutConfig((prev) => ({
                        ...prev,
                        gapXMm: v,
                        gapYMm: v
                      }));
                    }}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={layoutConfig.showCutGuides}
                  onChange={(e) => setLayoutConfig((prev) => ({ ...prev, showCutGuides: e.target.checked }))}
                  className="rounded accent-emerald-500"
                />
                <span className="flex items-center gap-1">
                  <Scissors size={12} className="text-emerald-400" />
                  Show Cut Guides / Crop Marks
                </span>
              </label>
            </div>

            {/* 5. Save Print Preset */}
            <div className="pt-1">
              {!isSavingPreset ? (
                <button
                  type="button"
                  onClick={() => setIsSavingPreset(true)}
                  className="w-full py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 flex items-center justify-center gap-1.5 transition"
                >
                  <Save size={13} />
                  Save as Custom Print Preset
                </button>
              ) : (
                <div className="space-y-1.5 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <input
                    type="text"
                    value={customPresetName}
                    onChange={(e) => setCustomPresetName(e.target.value)}
                    placeholder="e.g. My Canon PVC Sheet"
                    className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleSaveCustomPreset}
                      disabled={!customPresetName.trim()}
                      className="flex-1 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs disabled:opacity-40"
                    >
                      Save Preset
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSavingPreset(false)}
                      className="px-2 py-1 text-slate-400 hover:text-white text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Interactive A4 Sheet Canvas & Toolbar */}
          <div className="flex-1 flex flex-col bg-slate-950/70 overflow-hidden relative">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950 border-b border-slate-800 text-xs flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Side Toggle: Front vs Back */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPreviewSide('front')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      previewSide === 'front'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Page 1: Front Side</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewSide('back')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      previewSide === 'back'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>Page 2: Back Side {layoutConfig.mirrorBack ? '(Mirrored)' : ''}</span>
                  </button>
                </div>

                {/* Page Navigation */}
                {packing.totalPages > 1 && (
                  <div className="flex items-center gap-1.5 text-slate-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                    <span>Sheet:</span>
                    <button
                      type="button"
                      disabled={previewPageIndex === 0}
                      onClick={() => setPreviewPageIndex((p) => Math.max(0, p - 1))}
                      className="px-1.5 py-0.5 rounded hover:bg-slate-800 disabled:opacity-40"
                    >
                      ◀
                    </button>
                    <span className="font-bold text-white font-mono">
                      {previewPageIndex + 1} / {packing.totalPages}
                    </span>
                    <button
                      type="button"
                      disabled={previewPageIndex >= packing.totalPages - 1}
                      onClick={() => setPreviewPageIndex((p) => Math.min(packing.totalPages - 1, p + 1))}
                      className="px-1.5 py-0.5 rounded hover:bg-slate-800 disabled:opacity-40"
                    >
                      ▶
                    </button>
                  </div>
                )}

                <span className="text-slate-500">|</span>

                {/* Capacity Badge */}
                <span className="text-[11px] text-slate-400">
                  Grid: <span className="text-emerald-400 font-bold font-mono">{packing.cols} × {packing.rows}</span> ({packing.capacityPerPage}/sheet)
                </span>
              </div>

              {/* Card Action Buttons (Add, Duplicate, Delete, Auto-Arrange) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleAddOneCard}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1"
                  title="Add another card to the sheet"
                >
                  <Plus size={13} className="text-emerald-400" />
                  Add Card
                </button>

                <button
                  type="button"
                  onClick={handleDuplicateSelected}
                  disabled={!selectedCardId}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center gap-1 disabled:opacity-40"
                  title="Duplicate selected card (Ctrl+D)"
                >
                  <Copy size={13} />
                  Duplicate
                </button>

                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  disabled={!selectedCardId}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-rose-400 hover:bg-rose-950/40 border border-rose-900/40 transition disabled:opacity-40"
                  title="Remove selected card (Delete)"
                >
                  <Trash2 size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => setSheetCards([])}
                  disabled={sheetCards.length === 0}
                  className="px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition disabled:opacity-40"
                  title="Clear all cards from sheet"
                >
                  Clear
                </button>

                {/* Zoom Controls */}
                <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 ml-2">
                  {[0.5, 0.75, 0.85, 1.0].map((z) => (
                    <button
                      key={z}
                      type="button"
                      onClick={() => setZoom(z)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition ${
                        zoom === z ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Duplex Alignment Explanation Banner */}
            {previewSide === 'back' && layoutConfig.mirrorBack && (
              <div className="bg-amber-950/60 border-b border-amber-800/60 px-6 py-1.5 text-amber-200 text-[11px] flex items-center gap-2">
                <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
                <span>
                  <strong>Duplex Back Alignment:</strong> Cards are automatically positioned in mirrored columns. When the physical A4 sheet is flipped along the {layoutConfig.duplexFlip === 'short-edge' ? 'short edge' : 'long edge'}, each Back card matches its corresponding Front card on the other side.
                </span>
              </div>
            )}

            {/* Interactive A4 Sheet Canvas View */}
            <div className="flex-1 overflow-auto p-8 flex items-center justify-center select-none bg-slate-950/80">
              {sheetCards.length === 0 ? (
                <div className="text-center p-12 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 max-w-md">
                  <CreditCard size={40} className="mx-auto text-slate-600 mb-3" />
                  <h3 className="text-sm font-bold text-slate-300">Print Sheet is Empty</h3>
                  <p className="text-xs text-slate-500 mt-1 mb-4">
                    Choose a farmer on the left and click "Fill Sheet", or batch select multiple farmers to populate cards.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleGenerateSingleFarmerCopies(8)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition"
                  >
                    Generate 8 Cards of {activeFarmer?.name_english || 'Current Farmer'}
                  </button>
                </div>
              ) : (
                /* Physical A4 Sheet Container */
                <div
                  ref={sheetPreviewRef}
                  className="relative bg-white text-slate-900 shadow-2xl rounded-sm transition-all"
                  style={{
                    width: `${layoutConfig.pageWidthMm * mmToPx * zoom}px`,
                    height: `${layoutConfig.pageHeightMm * mmToPx * zoom}px`,
                    minWidth: `${layoutConfig.pageWidthMm * mmToPx * zoom}px`,
                    minHeight: `${layoutConfig.pageHeightMm * mmToPx * zoom}px`
                  }}
                >
                  {/* Subtle Printable Margin Boundary Line */}
                  <div
                    className="absolute border border-dashed border-slate-300 pointer-events-none"
                    style={{
                      left: `${layoutConfig.marginLeftMm * mmToPx * zoom}px`,
                      top: `${layoutConfig.marginTopMm * mmToPx * zoom}px`,
                      right: `${layoutConfig.marginRightMm * mmToPx * zoom}px`,
                      bottom: `${layoutConfig.marginBottomMm * mmToPx * zoom}px`
                    }}
                  />

                  {/* Render Cards on the Grid Slots */}
                  {currentSheetCards.map((cardItem, slotIdx) => {
                    const globalIdx = startCardIdx + slotIdx;
                    const coords = getSlotCoordinates(slotIdx, isBackPreview);
                    const isSelected = selectedCardId === cardItem.id;

                    const cardLeftPx = coords.x * mmToPx * zoom;
                    const cardTopPx = coords.y * mmToPx * zoom;
                    const cardWidthPx = layoutConfig.cardWidthMm * mmToPx * zoom;
                    const cardHeightPx = layoutConfig.cardHeightMm * mmToPx * zoom;

                    return (
                      <div
                        key={cardItem.id}
                        onClick={() => setSelectedCardId(cardItem.id)}
                        className={`absolute group cursor-pointer transition-shadow rounded-[6px] ${
                          isSelected
                            ? 'ring-4 ring-indigo-500 shadow-xl z-20'
                            : 'hover:ring-2 hover:ring-indigo-300/80 shadow-md'
                        }`}
                        style={{
                          left: `${cardLeftPx}px`,
                          top: `${cardTopPx}px`,
                          width: `${cardWidthPx}px`,
                          height: `${cardHeightPx}px`
                        }}
                      >
                        {/* Cut Guides / Crop Marks for this Card */}
                        {layoutConfig.showCutGuides && (
                          <div className="absolute inset-0 pointer-events-none">
                            {/* Top-Left Tick */}
                            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t border-l border-slate-400" />
                            {/* Top-Right Tick */}
                            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t border-r border-slate-400" />
                            {/* Bottom-Left Tick */}
                            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b border-l border-slate-400" />
                            {/* Bottom-Right Tick */}
                            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b border-r border-slate-400" />
                          </div>
                        )}

                        {/* Card Component Scaled to Cell */}
                        <div className="w-full h-full overflow-hidden rounded-[5px] pointer-events-none">
                          <CardRenderer
                            template={template}
                            side={isBackPreview ? 'back' : 'front'}
                            farmer={cardItem.farmer}
                            scale={previewCardScale}
                            interactive={false}
                            backgroundMode="vector"
                          />
                        </div>

                        {/* Slot Badge Indicator */}
                        <div className="absolute top-1 left-1 bg-slate-950/80 text-white font-mono text-[9px] px-1.5 py-0.5 rounded shadow pointer-events-none flex items-center gap-1 opacity-90 group-hover:opacity-100">
                          <span className="font-bold text-emerald-400">#{globalIdx + 1}</span>
                          <span className="truncate max-w-[80px]">
                            {isBackPreview ? `Back: ${cardItem.farmer?.name_english?.split(' ')[0]}` : cardItem.farmer?.name_english?.split(' ')[0]}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
