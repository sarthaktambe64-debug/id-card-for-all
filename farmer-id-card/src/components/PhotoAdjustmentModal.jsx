import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sun,
  Contrast,
  Sparkles,
  Move,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Eye,
  Sliders,
  Maximize2,
  Crop
} from 'lucide-react';
import {
  DEFAULT_PHOTO_SETTINGS,
  CARD_PHOTO_FRAME,
  validatePhoto,
  renderProcessedPhoto,
  getCssObjectPosition,
  getCssFilter
} from '../services/photoService.js';

export default function PhotoAdjustmentModal({
  isOpen,
  onClose,
  initialPhoto,
  initialSettings = null,
  farmerName = 'Farmer',
  onSave
}) {
  if (!isOpen) return null;

  // Active pristine original photo
  const [photoSrc, setPhotoSrc] = useState(initialPhoto || '');

  // Settings state
  const [settings, setSettings] = useState(() => ({
    ...DEFAULT_PHOTO_SETTINGS,
    ...(initialSettings || {})
  }));

  // Analysis metadata
  const [analysis, setAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // UI toggles
  const [showGuides, setShowGuides] = useState(true);

  // Mouse dragging for pan
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const previewBoxRef = useRef(null);

  // Analyze photo whenever photoSrc changes
  useEffect(() => {
    let active = true;
    if (photoSrc) {
      setIsAnalyzing(true);
      validatePhoto(photoSrc).then((res) => {
        if (active) {
          setAnalysis(res);
          setIsAnalyzing(false);
        }
      });
    } else {
      setAnalysis(null);
    }
    return () => {
      active = false;
    };
  }, [photoSrc]);

  // Handle Drag to Pan
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: settings.panX,
      panY: settings.panY
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;

      // Sensitivity factor: ~0.2% per pixel
      const newPanX = Math.max(-50, Math.min(50, Math.round(dragStartRef.current.panX - dx * 0.25)));
      const newPanY = Math.max(-50, Math.min(50, Math.round(dragStartRef.current.panY - dy * 0.25)));

      setSettings((prev) => ({
        ...prev,
        panX: newPanX,
        panY: newPanY
      }));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Handle local file replace
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoSrc(event.target.result);
        setSettings(DEFAULT_PHOTO_SETTINGS);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  // Reset to original pristine settings
  const handleReset = () => {
    setSettings(DEFAULT_PHOTO_SETTINGS);
  };

  // Auto-trim preset (zooms in 1.08x to eliminate document scan margins)
  const handleAutoTrim = () => {
    setSettings((prev) => ({
      ...prev,
      zoom: 1.08,
      panX: 0,
      panY: -2,
      brightness: prev.brightness < 105 ? 108 : prev.brightness,
      contrast: prev.contrast < 105 ? 106 : prev.contrast,
      sharpen: prev.sharpen === 0 ? 25 : prev.sharpen
    }));
  };

  // Quick face center nudge
  const nudgePan = (dx, dy) => {
    setSettings((prev) => ({
      ...prev,
      panX: Math.max(-50, Math.min(50, prev.panX + dx)),
      panY: Math.max(-50, Math.min(50, prev.panY + dy))
    }));
  };

  // Compute CSS values for live interactive preview
  const objectPosition = useMemo(() => getCssObjectPosition(settings), [settings]);
  const filterStyle = useMemo(() => getCssFilter(settings), [settings]);
  const zoomScale = settings.zoom || 1.0;

  // Save handler: renders processed high-res photo and returns both
  const handleSave = async () => {
    if (!photoSrc) {
      onSave?.({
        photo: '',
        photo_settings: DEFAULT_PHOTO_SETTINGS,
        photo_processed: ''
      });
      onClose();
      return;
    }

    setIsProcessing(true);
    try {
      // Use lossless PNG and let renderProcessedPhoto maintain full source resolution (up to 850px)
      const result = await renderProcessedPhoto(photoSrc, settings, {
        mimeType: 'image/png'
      });

      onSave?.({
        photo: photoSrc, // Pristine original preserved!
        photo_settings: settings,
        photo_processed: result?.processedDataUrl || photoSrc
      });
      onClose();
    } catch (err) {
      console.error('Failed to process photo:', err);
      // Fallback: save settings with original
      onSave?.({
        photo: photoSrc,
        photo_settings: settings,
        photo_processed: photoSrc
      });
      onClose();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center shadow-md">
              <Crop size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-white tracking-tight">
                  FARMER PHOTO ADJUSTMENT & CROPPING
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                  190 × 242 px Frame
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Crop, center, brighten, and sharpen {farmerName ? `"${farmerName}"` : 'farmer'} portrait to fit the PVC card frame edge-to-edge.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition"
            title="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-900/90">
          {/* Left Column: Interactive Card Frame Live Preview (5 Cols) */}
          <div className="md:col-span-5 flex flex-col items-center justify-start gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800/80">
            <div className="w-full flex items-center justify-between text-xs text-slate-300 font-bold px-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Eye size={14} />
                LIVE CARD FRAME PREVIEW
              </span>
              <button
                type="button"
                onClick={() => setShowGuides(!showGuides)}
                className={`text-[11px] px-2 py-0.5 rounded border transition ${
                  showGuides
                    ? 'bg-emerald-950/80 border-emerald-700 text-emerald-300 font-semibold'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                {showGuides ? 'Guides: ON' : 'Guides: OFF'}
              </button>
            </div>

            {/* Simulated Card Frame Anchor (228 × 290 px, matching exact 190 × 242 aspect ratio) */}
            <div className="relative p-2 bg-[#FBF8EE] rounded-2xl shadow-inner border border-amber-200/40 flex items-center justify-center">
              <div
                ref={previewBoxRef}
                onMouseDown={photoSrc ? handleMouseDown : undefined}
                className={`relative overflow-hidden select-none ${
                  photoSrc ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : ''
                }`}
                style={{
                  width: '210px',
                  height: '267px', // 210 / (190/242) = 267.4 px
                  backgroundColor: '#FAF6ED',
                  borderColor: '#C7D9CD',
                  borderWidth: '1.5px',
                  borderStyle: 'solid',
                  borderRadius: '24px', // 2.4 mm scaled
                  boxSizing: 'border-box'
                }}
                title={photoSrc ? 'Click & drag to reposition face' : 'No photo uploaded'}
              >
                {photoSrc ? (
                  <div className="w-full h-full relative overflow-hidden">
                    <img
                      src={photoSrc}
                      alt="Farmer Portrait Preview"
                      className="w-full h-full object-cover pointer-events-none transition-transform duration-75"
                      style={{
                        objectFit: 'cover',
                        objectPosition: objectPosition,
                        transform: `scale(${zoomScale})`,
                        transformOrigin: objectPosition,
                        filter: filterStyle,
                        width: '100%',
                        height: '100%',
                        display: 'block'
                      }}
                    />

                    {/* Portrait Alignment Guides: Hairline, Eyes, Chin, Shoulders */}
                    {showGuides && (
                      <div className="absolute inset-0 pointer-events-none border border-emerald-500/20">
                        {/* Crown / Hairline clearance line (around 12% from top) */}
                        <div className="absolute top-[12%] left-0 right-0 border-b border-dashed border-emerald-400/40 flex justify-end pr-1">
                          <span className="text-[8.5px] font-mono text-emerald-300 bg-emerald-950/70 px-1 rounded -translate-y-2">
                            Hair / Crown
                          </span>
                        </div>
                        {/* Eye level reference line (around 36% from top) */}
                        <div className="absolute top-[36%] left-0 right-0 border-b border-dashed border-emerald-400/50 flex justify-end pr-1">
                          <span className="text-[8.5px] font-mono text-emerald-300 bg-emerald-950/70 px-1 rounded -translate-y-2">
                            Eye Level
                          </span>
                        </div>
                        {/* Center vertical nose/chin guide */}
                        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-r border-dashed border-emerald-400/40" />
                        {/* Chin level line (around 68% from top) */}
                        <div className="absolute top-[68%] left-0 right-0 border-b border-dashed border-emerald-400/40 flex justify-end pr-1">
                          <span className="text-[8.5px] font-mono text-emerald-300 bg-emerald-950/70 px-1 rounded -translate-y-2">
                            Chin Line
                          </span>
                        </div>
                        {/* Shoulder baseline (around 88% from top) */}
                        <div className="absolute top-[88%] left-0 right-0 border-b border-dashed border-emerald-400/40 flex justify-end pr-1">
                          <span className="text-[8.5px] font-mono text-emerald-300 bg-emerald-950/70 px-1 rounded -translate-y-2">
                            Shoulders
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                    <Crop size={36} className="text-slate-400 mb-2 opacity-50" />
                    <span className="text-xs font-bold text-slate-500">NO PHOTO</span>
                    <span className="text-[10px] text-slate-400 mt-1">
                      Upload an image to start adjusting
                    </span>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
              <Move size={12} className="text-emerald-400 shrink-0" />
              <span>Click & drag inside the box to center face & shoulders naturally</span>
            </p>

            {/* Quality Analysis & Warnings Card */}
            {analysis && (
              <div className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-2">
                <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 pb-1.5 border-b border-slate-800">
                  <span>Source Resolution:</span>
                  <span className={`font-bold ${analysis.width >= 300 && analysis.height >= 400 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {analysis.width} × {analysis.height} px
                  </span>
                </div>

                {analysis.width >= 300 && analysis.height >= 400 ? (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                    <CheckCircle2 size={13} className="shrink-0" />
                    <span>✓ High Resolution (Target: ~300 × 400 px met)</span>
                  </div>
                ) : (
                  <div className="flex items-start gap-1.5 text-amber-400 text-[11px] leading-tight">
                    <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-500" />
                    <span>Low Source Resolution — Print target is ~300 × 400 px or higher for sharp physical cards</span>
                  </div>
                )}

                {analysis.warnings.length > 0 && (
                  <div className="space-y-1 pt-1 border-t border-slate-800/80">
                    {analysis.warnings.map((w, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-1.5 text-amber-400 text-[11px] leading-tight"
                      >
                        <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                        <span>{w}</span>
                      </div>
                    ))}
                    {analysis.hasWhiteBorders && (
                      <button
                        type="button"
                        onClick={handleAutoTrim}
                        className="w-full mt-1.5 py-1 px-2 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] font-bold transition flex items-center justify-center gap-1"
                      >
                        <Crop size={12} />
                        Auto-Trim Scanned Borders (1.08×)
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Test Sample Switcher for Operator Acceptance Testing */}
            <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl p-2.5 text-xs space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Test Sample Portraits (Acceptance QA)
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setPhotoSrc('/sample_farmer_photo_highres.jpg');
                    setSettings(DEFAULT_PHOTO_SETTINGS);
                  }}
                  className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold text-center border border-slate-700 transition"
                  title="Clear, well-lit 896 × 1200 portrait"
                >
                  Clear High-Res
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoSrc('/sample_farmer_photo_dark.jpg');
                    setSettings({ ...DEFAULT_PHOTO_SETTINGS, brightness: 125, contrast: 110 });
                  }}
                  className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold text-center border border-slate-700 transition"
                  title="Dark / underexposed portrait to test brightness"
                >
                  Dark Portrait
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPhotoSrc('/sample_farmer_photo_lowres.jpg');
                    setSettings({ ...DEFAULT_PHOTO_SETTINGS, zoom: 1.08 });
                  }}
                  className="py-1 px-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold text-center border border-slate-700 transition"
                  title="160 × 205 low-resolution scanned portrait"
                >
                  Low-Res Scan
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Adjustment Controls & Sliders (7 Cols) */}
          <div className="md:col-span-7 flex flex-col gap-5 p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80">
            {/* Control Group 1: Zoom / Scaling */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ZoomIn size={14} className="text-emerald-400" />
                  Crop & Zoom
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    {Math.round(settings.zoom * 100)}%
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((p) => ({
                          ...p,
                          zoom: Math.max(1.0, +(p.zoom - 0.05).toFixed(2))
                        }))
                      }
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((p) => ({
                          ...p,
                          zoom: Math.min(3.0, +(p.zoom + 0.05).toFixed(2))
                        }))
                      }
                      className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <input
                type="range"
                min="1.0"
                max="2.2"
                step="0.01"
                value={settings.zoom}
                onChange={(e) =>
                  setSettings({ ...settings, zoom: parseFloat(e.target.value) })
                }
                className="w-full accent-emerald-500 cursor-pointer"
              />

              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => setSettings((p) => ({ ...p, zoom: 1.0 }))}
                  className={`text-[10px] px-2 py-0.5 rounded border transition ${
                    settings.zoom === 1.0
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  100% Fit
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((p) => ({ ...p, zoom: 1.05 }))}
                  className={`text-[10px] px-2 py-0.5 rounded border transition ${
                    Math.abs(settings.zoom - 1.05) < 0.01
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  105% (Border-Trim)
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((p) => ({ ...p, zoom: 1.15 }))}
                  className={`text-[10px] px-2 py-0.5 rounded border transition ${
                    Math.abs(settings.zoom - 1.15) < 0.01
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  115% Portrait Focus
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((p) => ({ ...p, zoom: 1.3 }))}
                  className={`text-[10px] px-2 py-0.5 rounded border transition ${
                    Math.abs(settings.zoom - 1.3) < 0.01
                      ? 'bg-emerald-950 border-emerald-700 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  130% Close-Up
                </button>
              </div>
            </div>

            {/* Control Group 2: Position & Pan */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Move size={14} className="text-emerald-400" />
                  Face Positioning & Centering
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => nudgePan(0, -3)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center font-bold"
                    title="Nudge Up"
                  >
                    ▲
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgePan(0, 3)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center font-bold"
                    title="Nudge Down"
                  >
                    ▼
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgePan(-3, 0)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center font-bold"
                    title="Nudge Left"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => nudgePan(3, 0)}
                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center justify-center font-bold"
                    title="Nudge Right"
                  >
                    ▶
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, panX: 0, panY: 0 }))}
                    className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                    title="Center"
                  >
                    Center
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Horizontal (X):</span>
                    <span className="font-mono text-slate-200">{settings.panX}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={settings.panX}
                    onChange={(e) =>
                      setSettings({ ...settings, panX: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-slate-400 mb-1">
                    <span>Vertical (Y):</span>
                    <span className="font-mono text-slate-200">{settings.panY}%</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={settings.panY}
                    onChange={(e) =>
                      setSettings({ ...settings, panY: parseInt(e.target.value, 10) })
                    }
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>

            {/* Control Group 3: Lighting (Brightness & Contrast) */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sun size={14} className="text-amber-400" />
                  Lighting & Contrast (Restrained)
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((p) => ({ ...p, brightness: 100, contrast: 100 }))
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 font-bold"
                  >
                    Normal (100%)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((p) => ({ ...p, brightness: 108, contrast: 105 }))
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-800/80 text-amber-300 font-bold"
                  >
                    +8% Gentle Lift
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setSettings((p) => ({ ...p, brightness: 115, contrast: 108 }))
                    }
                    className="text-[10px] px-2 py-0.5 rounded bg-amber-950 border border-amber-800/80 text-amber-300 font-bold"
                  >
                    +15% Clear Boost
                  </button>
                </div>
              </div>

              {/* Brightness Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Sun size={11} className="text-amber-400" /> Brightness (80% - 140%)
                  </span>
                  <span className="font-mono text-slate-200">{settings.brightness}%</span>
                </div>
                <input
                  type="range"
                  min="80"
                  max="140"
                  step="1"
                  value={settings.brightness}
                  onChange={(e) =>
                    setSettings({ ...settings, brightness: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Contrast Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Contrast size={11} className="text-indigo-400" /> Contrast (85% - 130%)
                  </span>
                  <span className="font-mono text-slate-200">{settings.contrast}%</span>
                </div>
                <input
                  type="range"
                  min="85"
                  max="130"
                  step="1"
                  value={settings.contrast}
                  onChange={(e) =>
                    setSettings({ ...settings, contrast: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Control Group 4: Mild Sharpening */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-cyan-400" />
                  Mild Detail Sharpening (0% - 50%)
                </label>
                <span className="text-xs font-mono font-bold text-cyan-400">
                  {settings.sharpen}%
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={settings.sharpen}
                onChange={(e) =>
                  setSettings({ ...settings, sharpen: parseInt(e.target.value, 10) })
                }
                className="w-full accent-cyan-500 cursor-pointer"
              />

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-0.5">
                <span>Natural facial contour definition without digital ringing</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, sharpen: 0 }))}
                    className={`px-1.5 py-0.5 rounded ${
                      settings.sharpen === 0
                        ? 'bg-slate-800 text-white font-bold'
                        : 'hover:text-slate-200'
                    }`}
                  >
                    Off (0%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, sharpen: 15 }))}
                    className={`px-1.5 py-0.5 rounded ${
                      settings.sharpen === 15
                        ? 'bg-cyan-950 text-cyan-300 font-bold'
                        : 'hover:text-slate-200'
                    }`}
                  >
                    Subtle (15%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings((p) => ({ ...p, sharpen: 30 }))}
                    className={`px-1.5 py-0.5 rounded ${
                      settings.sharpen === 30
                        ? 'bg-cyan-950 text-cyan-300 font-bold'
                        : 'hover:text-slate-200'
                    }`}
                  >
                    Crisp (30%)
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <label className="text-xs text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer flex items-center gap-1.5">
                <Upload size={14} />
                <span>Replace Photo...</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white font-semibold flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-slate-800 transition"
                title="Reset all crop and adjustment settings to defaults"
              >
                <RotateCcw size={13} />
                Reset to Original
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Original photo is preserved untouched in your database.
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isProcessing}
              className="px-5 py-2 rounded-xl text-xs font-bold text-emerald-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 transition active:scale-95 flex items-center gap-1.5"
            >
              {isProcessing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-emerald-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>Apply & Save to Card</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
