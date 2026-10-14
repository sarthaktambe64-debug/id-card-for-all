import React, { useState, useEffect, useRef, useMemo } from 'react';
import { CardRenderer } from './CardRenderer';
import {
  Printer,
  FileDown,
  X,
  CreditCard,
  Copy,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';
import {
  printDedicatedCard,
  exportCardPDF,
  downloadCardPNG,
  downloadCardJPG,
  copyCardImageToClipboard
} from '../services/cardExportService';

/**
 * PrintModal (Preview & Export Workspace)
 *
 * Dedicated isolated print & preview workspace:
 * - Solid calm light background (#F3F5F3), zero dashboard blur behind
 * - Clear header: Farmer ID Card, Farmer Name, [ Back to Farmer ]
 * - Front and Back displayed side-by-side with 32–48px gap (stacked on mobile)
 * - Viewport-responsive "Fit" scale calculation by default
 * - Clean badges: FRONT and BACK (with 85.6 × 54 mm), no technical render strings
 * - No floating micro-buttons on the card itself
 * - Sticky bottom toolbar with distinct PRINT and EXPORT groups
 * - Escape key support
 */
export const PrintModal = ({
  template,
  farmer,
  isOpen,
  onClose,
  onPrintLogged
}) => {
  const containerRef = useRef(null);

  // Scaling modes: 'Fit' (default) | '75%' | '100%' | '150%'
  const [scaleMode, setScaleMode] = useState('Fit');
  const [computedFitScale, setComputedFitScale] = useState(0.5);

  const [isBusy, setIsBusy] = useState(false);
  const [busyMessage, setBusyMessage] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Dropdown states for multi-option export actions
  const [isPngMenuOpen, setIsPngMenuOpen] = useState(false);
  const [isJpgMenuOpen, setIsJpgMenuOpen] = useState(false);
  const [isCopyMenuOpen, setIsCopyMenuOpen] = useState(false);

  // Dynamic Fit Scale Calculation
  useEffect(() => {
    if (!isOpen) return;

    const calculateFit = () => {
      if (!containerRef.current) return;
      const { clientWidth: w, clientHeight: h } = containerRef.current;
      if (w <= 0 || h <= 0) return;

      // Card logical size: 856 × 540 px. Header badge is ~36px.
      // Side-by-side mode on desktop (w >= 960px)
      const isSideBySide = w >= 960;
      let targetScale;

      if (isSideBySide) {
        const availableW = Math.max(w - 80, 320);
        const availableH = Math.max(h - 70, 240);
        // 2 cards + 40px gap
        const scaleW = availableW / (856 * 2 + 40);
        const scaleH = availableH / (540 + 36);
        targetScale = Math.min(scaleW, scaleH);
      } else {
        // Stacked vertically
        const availableW = Math.max(w - 48, 260);
        const availableH = Math.max(h - 80, 320);
        const scaleW = availableW / 856;
        const scaleH = availableH / ((540 + 36) * 2 + 32);
        targetScale = Math.min(scaleW, scaleH);
      }

      // Clamp scale to a comfortable, crisp range
      const clamped = Math.max(0.25, Math.min(targetScale, 0.65));
      setComputedFitScale(Number(clamped.toFixed(3)));
    };

    calculateFit();
    const timer = setTimeout(calculateFit, 50);
    window.addEventListener('resize', calculateFit);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateFit);
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Active rendered scale
  const activeScale = useMemo(() => {
    if (scaleMode === 'Fit') return computedFitScale;
    if (scaleMode === '75%') return 0.285;
    if (scaleMode === '100%') return 0.38; // 1:1 physical size (85.6mm at 96 DPI)
    if (scaleMode === '150%') return 0.57;
    return computedFitScale;
  }, [scaleMode, computedFitScale]);

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Close menus when clicking elsewhere
  const closeAllMenus = () => {
    setIsPngMenuOpen(false);
    setIsJpgMenuOpen(false);
    setIsCopyMenuOpen(false);
  };

  // ==========================================
  // PRINT WORKFLOWS
  // ==========================================
  const handlePrint = async (sides = 'both') => {
    closeAllMenus();
    try {
      setIsBusy(true);
      const sideLabel = sides === 'both' ? 'Front + Back' : sides.toUpperCase();
      setBusyMessage(`Preparing physical 85.6 × 54 mm ${sideLabel} print...`);
      await printDedicatedCard({
        sides,
        farmer,
        template
      });
      onPrintLogged?.();
      showToast(`Print dialog opened for ${sideLabel}. Output set to exact 85.6 × 54 mm PVC size.`);
    } catch (err) {
      console.error('Print error:', err);
      alert('Printing failed: ' + err.message);
    } finally {
      setIsBusy(false);
      setBusyMessage('');
    }
  };

  // ==========================================
  // EXPORT WORKFLOWS
  // ==========================================
  const handlePdfExport = async () => {
    closeAllMenus();
    try {
      setIsBusy(true);
      setBusyMessage('Generating physical 85.6 × 54.0 mm CR80 PDF...');
      const res = await exportCardPDF({
        sides: 'both',
        farmer,
        template
      });
      onPrintLogged?.();
      showToast(`PDF downloaded: ${res.filename}`);
    } catch (err) {
      console.error('PDF error:', err);
      alert('PDF generation failed: ' + err.message);
    } finally {
      setIsBusy(false);
      setBusyMessage('');
    }
  };

  const handlePngExport = async (side) => {
    closeAllMenus();
    try {
      setIsBusy(true);
      if (side === 'both') {
        setBusyMessage('Rendering 300-DPI FRONT & BACK PNGs (1011 × 638 px)...');
        await downloadCardPNG('front', farmer);
        await new Promise((r) => setTimeout(r, 250));
        await downloadCardPNG('back', farmer);
        showToast('Both Front and Back 300-DPI PNGs downloaded!');
      } else {
        setBusyMessage(`Rendering 300-DPI ${side.toUpperCase()} PNG (1011 × 638 px)...`);
        await downloadCardPNG(side, farmer);
        showToast(`${side.toUpperCase()} PNG (300 DPI) downloaded!`);
      }
    } catch (err) {
      console.error('PNG error:', err);
      alert('PNG download failed: ' + err.message);
    } finally {
      setIsBusy(false);
      setBusyMessage('');
    }
  };

  const handleJpgExport = async (side) => {
    closeAllMenus();
    try {
      setIsBusy(true);
      if (side === 'both') {
        setBusyMessage('Rendering high-quality FRONT & BACK JPGs...');
        await downloadCardJPG('front', farmer);
        await new Promise((r) => setTimeout(r, 250));
        await downloadCardJPG('back', farmer);
        showToast('Both Front and Back JPGs downloaded!');
      } else {
        setBusyMessage(`Rendering high-quality ${side.toUpperCase()} JPG...`);
        await downloadCardJPG(side, farmer);
        showToast(`${side.toUpperCase()} JPG downloaded!`);
      }
    } catch (err) {
      console.error('JPG error:', err);
      alert('JPG download failed: ' + err.message);
    } finally {
      setIsBusy(false);
      setBusyMessage('');
    }
  };

  const handleCopyClipboard = async (side) => {
    closeAllMenus();
    try {
      setIsBusy(true);
      setBusyMessage(`Rendering ${side.toUpperCase()} card image to clipboard...`);
      const result = await copyCardImageToClipboard(side, farmer);
      showToast(result.message);
    } catch (err) {
      console.error('Clipboard copy error:', err);
      alert('Clipboard copy failed: ' + err.message);
    } finally {
      setIsBusy(false);
      setBusyMessage('');
    }
  };

  return (
    <div
      onClick={closeAllMenus}
      className="fixed inset-0 z-50 flex flex-col bg-[#F3F5F3] text-[#1F2933] overflow-hidden animate-in fade-in duration-150"
    >
      {/* ============================================================ */}
      {/* 1. HEADER: Calm, professional, isolated workspace */}
      {/* ============================================================ */}
      <header className="sticky top-0 z-30 w-full bg-white border-b border-[#D9E2DC] px-4 sm:px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-[#EAEEEA] rounded-xl border border-[#D9E2DC] transition active:scale-95"
            title="Return to farmer record (Esc)"
          >
            <ArrowLeft size={14} className="text-[#147A4A]" />
            <span>Back to Farmer</span>
          </button>

          <div className="h-5 w-px bg-[#D9E2DC] hidden sm:block" />

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-[#1F2933] tracking-tight">
                Farmer ID Card
              </h1>
              <span className="text-xs sm:text-sm font-semibold text-[#147A4A]">
                {farmer?.name_en || 'Card Preview'}
              </span>
            </div>
            {farmer?.farmer_id && (
              <p className="text-[11px] text-[#667085] font-mono mt-0.5">
                ID: {farmer.farmer_id}
              </p>
            )}
          </div>
        </div>

        {/* Right Header Controls: Scaling and Close */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Scale Selector */}
          <div className="flex items-center bg-[#F8FAF8] p-1 rounded-xl border border-[#D9E2DC]">
            <span className="text-[10px] font-bold text-[#667085] uppercase tracking-wider px-2 hidden md:inline">
              Preview:
            </span>
            {[
              { id: 'Fit', label: 'Fit' },
              { id: '75%', label: '75%' },
              { id: '100%', label: '100%' },
              { id: '150%', label: '150%' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setScaleMode(item.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                  scaleMode === item.id
                    ? 'bg-[#147A4A] text-white shadow-xs'
                    : 'text-[#667085] hover:text-[#1F2933]'
                }`}
                title={item.id === 'Fit' ? 'Fit both cards to viewport' : `Zoom ${item.label}`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[#667085] hover:text-[#1F2933] hover:bg-[#F8FAF8] rounded-xl border border-transparent hover:border-[#D9E2DC] transition"
            title="Close Preview (Esc)"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Notification / Toast Banner */}
      {(toastMessage || busyMessage) && (
        <div className="sticky top-[57px] z-20 w-full bg-[#E9F5EE] border-b border-[#B8DEC8] px-6 py-2 text-xs text-[#147A4A] flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="animate-pulse" />
            <span className="font-semibold">{busyMessage || toastMessage}</span>
          </div>
          {toastMessage && (
            <button onClick={() => setToastMessage('')} className="text-[#147A4A] hover:text-[#155A3A]">
              <X size={14} />
            </button>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. PREVIEW BODY: FRONT & BACK SIDE-BY-SIDE ON CALM SURFACE */}
      {/* ============================================================ */}
      <main
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[380px]"
      >
        <div className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-10 xl:gap-12 my-auto">
          {/* FRONT CARD CONTAINER */}
          <section className="flex flex-col items-center">
            {/* Clean Non-Technical Card Label */}
            <div className="w-full flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F2933] bg-white px-2.5 py-0.5 rounded-md border border-[#D9E2DC] shadow-2xs">
                  FRONT
                </span>
                <span className="text-[11px] text-[#667085] font-mono">
                  85.6 × 54 mm
                </span>
              </div>
            </div>

            <div className="p-0.5 bg-transparent transition-transform duration-100 ease-out">
              <CardRenderer
                template={template}
                side="front"
                farmer={farmer}
                scale={activeScale}
                interactive={false}
                showShadow={true}
              />
            </div>
          </section>

          {/* BACK CARD CONTAINER */}
          <section className="flex flex-col items-center">
            {/* Clean Non-Technical Card Label */}
            <div className="w-full flex items-center justify-between mb-2.5 px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1F2933] bg-white px-2.5 py-0.5 rounded-md border border-[#D9E2DC] shadow-2xs">
                  BACK
                </span>
                <span className="text-[11px] text-[#667085] font-mono">
                  85.6 × 54 mm
                </span>
                {farmer?.land_records?.length > 0 && (
                  <span className="text-[11px] text-[#147A4A] font-semibold bg-[#E9F5EE] px-2 py-0.5 rounded border border-[#B8DEC8]">
                    {farmer.land_records.length} {farmer.land_records.length === 1 ? 'Record' : 'Records'}
                  </span>
                )}
              </div>
            </div>

            <div className="p-0.5 bg-transparent transition-transform duration-100 ease-out">
              <CardRenderer
                template={template}
                side="back"
                farmer={farmer}
                scale={activeScale}
                interactive={false}
                showShadow={true}
              />
            </div>
          </section>
        </div>
      </main>

      {/* ============================================================ */}
      {/* 3. STICKY BOTTOM ACTION TOOLBAR */}
      {/* ============================================================ */}
      <footer className="sticky bottom-0 z-30 w-full bg-white border-t border-[#D9E2DC] shadow-md px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* PRINT ACTIONS GROUP */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] mr-1 hidden sm:inline">
            PRINT
          </span>

          {/* Secondary: Print Front */}
          <button
            onClick={() => handlePrint('front')}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1F2933] bg-white hover:bg-[#F8FAF8] border border-[#D9E2DC] rounded-xl transition active:scale-95 disabled:opacity-50"
            title="Print only the front side at exact 85.6 × 54 mm"
          >
            <Printer size={13} className="text-[#147A4A]" />
            <span>Print Front</span>
          </button>

          {/* Secondary: Print Back */}
          <button
            onClick={() => handlePrint('back')}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1F2933] bg-white hover:bg-[#F8FAF8] border border-[#D9E2DC] rounded-xl transition active:scale-95 disabled:opacity-50"
            title="Print only the back side at exact 85.6 × 54 mm"
          >
            <Printer size={13} className="text-[#147A4A]" />
            <span>Print Back</span>
          </button>

          {/* PRIMARY GREEN ACTION: Print Front + Back */}
          <button
            onClick={() => handlePrint('both')}
            disabled={isBusy}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-xl transition shadow-sm active:scale-95 disabled:opacity-50"
            title="Direct print both Front and Back sides at exact physical 85.6 × 54 mm"
          >
            <CreditCard size={14} />
            <span>Print Front + Back</span>
          </button>
        </div>

        {/* EXPORT ACTIONS GROUP */}
        <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] mr-1 hidden sm:inline">
            EXPORT
          </span>

          {/* PDF EXPORT (CR80) */}
          <button
            onClick={handlePdfExport}
            disabled={isBusy}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-white border border-[#D9E2DC] rounded-xl transition active:scale-95 disabled:opacity-50"
            title="Export exact 85.6 × 54.0 mm physical CR80 PDF document"
          >
            <FileDown size={14} className="text-[#147A4A]" />
            <span>PDF</span>
          </button>

          {/* PNG EXPORT (300 DPI) */}
          <div className="relative">
            <button
              onClick={() => {
                setIsPngMenuOpen(!isPngMenuOpen);
                setIsJpgMenuOpen(false);
                setIsCopyMenuOpen(false);
              }}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-white border border-[#D9E2DC] rounded-xl transition active:scale-95 disabled:opacity-50"
              title="Download 300 DPI high-resolution PNG"
            >
              <Download size={14} className="text-[#147A4A]" />
              <span>PNG</span>
              <ChevronDown size={12} className={`transition-transform ${isPngMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPngMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-[#D9E2DC] rounded-xl shadow-xl z-50 p-1.5 text-xs space-y-1 animate-in fade-in">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085] border-b border-[#D9E2DC]">
                  300 DPI Raster PNG
                </div>
                <button
                  onClick={() => handlePngExport('front')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between font-medium"
                >
                  <span>Front PNG</span>
                  <span className="text-[10px] text-[#667085] font-mono">1011×638</span>
                </button>
                <button
                  onClick={() => handlePngExport('back')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between font-medium"
                >
                  <span>Back PNG</span>
                  <span className="text-[10px] text-[#667085] font-mono">1011×638</span>
                </button>
                <button
                  onClick={() => handlePngExport('both')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#147A4A] bg-[#E9F5EE] hover:bg-[#ddf0e4] flex items-center justify-between font-semibold"
                >
                  <span>Both Sides</span>
                  <span className="text-[10px] font-mono">2 Files</span>
                </button>
              </div>
            )}
          </div>

          {/* JPG EXPORT */}
          <div className="relative">
            <button
              onClick={() => {
                setIsJpgMenuOpen(!isJpgMenuOpen);
                setIsPngMenuOpen(false);
                setIsCopyMenuOpen(false);
              }}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-white border border-[#D9E2DC] rounded-xl transition active:scale-95 disabled:opacity-50"
              title="Download high-quality JPEG"
            >
              <ImageIcon size={14} className="text-[#147A4A]" />
              <span>JPG</span>
              <ChevronDown size={12} className={`transition-transform ${isJpgMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isJpgMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-[#D9E2DC] rounded-xl shadow-xl z-50 p-1.5 text-xs space-y-1 animate-in fade-in">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085] border-b border-[#D9E2DC]">
                  JPEG Export (0.95 Quality)
                </div>
                <button
                  onClick={() => handleJpgExport('front')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between font-medium"
                >
                  <span>Front JPG</span>
                  <span className="text-[10px] text-[#667085] font-mono">1011×638</span>
                </button>
                <button
                  onClick={() => handleJpgExport('back')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between font-medium"
                >
                  <span>Back JPG</span>
                  <span className="text-[10px] text-[#667085] font-mono">1011×638</span>
                </button>
                <button
                  onClick={() => handleJpgExport('both')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#147A4A] bg-[#E9F5EE] hover:bg-[#ddf0e4] flex items-center justify-between font-semibold"
                >
                  <span>Both Sides</span>
                  <span className="text-[10px] font-mono">2 Files</span>
                </button>
              </div>
            )}
          </div>

          {/* COPY IMAGE */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCopyMenuOpen(!isCopyMenuOpen);
                setIsPngMenuOpen(false);
                setIsJpgMenuOpen(false);
              }}
              disabled={isBusy}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-white border border-[#D9E2DC] rounded-xl transition active:scale-95 disabled:opacity-50"
              title="Copy card image to system clipboard"
            >
              <Copy size={14} className="text-[#147A4A]" />
              <span>Copy Image</span>
              <ChevronDown size={12} className={`transition-transform ${isCopyMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCopyMenuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-[#D9E2DC] rounded-xl shadow-xl z-50 p-1.5 text-xs space-y-1 animate-in fade-in">
                <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085] border-b border-[#D9E2DC]">
                  Copy Card to Clipboard
                </div>
                <button
                  onClick={() => handleCopyClipboard('front')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between font-medium"
                >
                  <span>Copy Front Card</span>
                  <Copy size={12} className="text-[#147A4A]" />
                </button>
                <button
                  onClick={() => handleCopyClipboard('back')}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between font-medium"
                >
                  <span>Copy Back Card</span>
                  <Copy size={12} className="text-[#147A4A]" />
                </button>
              </div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
