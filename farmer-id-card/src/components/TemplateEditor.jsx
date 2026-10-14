import React, { useState } from 'react';
import { CardRenderer } from './CardRenderer';
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Layers,
  Sliders,
  Type,
  Maximize2,
  QrCode,
  Table as TableIcon,
  Eye,
  EyeOff,
  CheckCircle2,
  FileCode,
  Palette,
  Sparkles,
  AlertTriangle,
  Smartphone,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Check,
  Move,
  UserCheck,
  Phone,
  MapPin,
  ZoomIn,
  ZoomOut,
  Settings
} from 'lucide-react';
import {
  QR_SOURCE_OPTIONS,
  AVAILABLE_MULTIPLE_FIELDS,
  DEFAULT_MULTIPLE_FIELDS,
  DEFAULT_CUSTOM_TEMPLATE,
  DEFAULT_VERIFICATION_URL,
  resolveQrPayload
} from '../services/qrHelper';
import { QrTestModal } from './QrTestModal';

// Categories per Section 25: IDENTITY, CONTACT, IDENTIFIERS, LAND, DESIGN
const CATEGORIES = [
  { id: 'IDENTITY', label: 'IDENTITY', icon: UserCheck, desc: 'Photo, Names, DOB, Gender' },
  { id: 'CONTACT', label: 'CONTACT', icon: Phone, desc: 'Mobile, Address' },
  { id: 'IDENTIFIERS', label: 'IDENTIFIERS', icon: ShieldCheck, desc: 'Farmer ID, UID, Enrollment' },
  { id: 'LAND', label: 'LAND', icon: MapPin, desc: 'Land Details Table' },
  { id: 'DESIGN', label: 'DESIGN', icon: Sparkles, desc: 'Logo, QR, Tagline, Background, Footer' }
];

const getElementCategory = (el) => {
  const id = (el.id || '').toLowerCase();
  const field = (el.field || '').toLowerCase();
  const type = (el.type || '').toLowerCase();

  // IDENTITY
  if (type === 'photo' || id.includes('photo')) return 'IDENTITY';
  if (field === 'name_marathi' || id.includes('name_marathi')) return 'IDENTITY';
  if (field === 'name_english' || id.includes('name_english')) return 'IDENTITY';
  if (field === 'dob' || id.includes('dob')) return 'IDENTITY';
  if (field === 'gender' || id.includes('gender')) return 'IDENTITY';

  // CONTACT
  if (field === 'mobile' || id.includes('mobile')) return 'CONTACT';
  if (type === 'address' || id.includes('address')) return 'CONTACT';

  // IDENTIFIERS
  if (field === 'farmer_id' || id.includes('farmer_id')) return 'IDENTIFIERS';
  if (field === 'aadhaar' || field === 'uid' || id.includes('aadhaar') || id.includes('uid')) return 'IDENTIFIERS';
  if (field === 'enrollment_no' || id.includes('enrollment')) return 'IDENTIFIERS';

  // LAND
  if (type === 'table' || id.includes('land')) return 'LAND';

  // DESIGN
  return 'DESIGN';
};

export const TemplateEditor = ({
  template,
  onSaveTemplate,
  onResetTemplate,
  sampleFarmer,
  onExportTemplate
}) => {
  const [activeSide, setActiveSide] = useState('front');
  const [selectedId, setSelectedId] = useState(null);
  const [localTemplate, setLocalTemplate] = useState(JSON.parse(JSON.stringify(template)));
  const [saveStatus, setSaveStatus] = useState(null);
  const [bgMode, setBgMode] = useState('vector'); // 'vector' | 'reference'
  const [isTestQrOpen, setIsTestQrOpen] = useState(false);
  const [zoomScale, setZoomScale] = useState(0.92);
  const [isActualSize, setIsActualSize] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);

  // Current side elements & background
  const currentSideConfig = activeSide === 'front' ? localTemplate.front : localTemplate.back;
  const elements = currentSideConfig?.elements || [];
  const currentBg = currentSideConfig?.background || {};
  const selectedElement = elements.find((el) => el.id === selectedId);

  // Background & Decorative layer updater
  const handleUpdateBackground = (bgPatch) => {
    setLocalTemplate((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetSide = activeSide === 'front' ? next.front : next.back;
      targetSide.background = {
        ...(targetSide.background || {}),
        ...bgPatch
      };
      return next;
    });
  };

  const handleApplyBackgroundToBothSides = () => {
    setLocalTemplate((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const srcBg = activeSide === 'front' ? next.front.background : next.back.background;
      next.front.background = JSON.parse(JSON.stringify(srcBg));
      next.back.background = JSON.parse(JSON.stringify(srcBg));
      return next;
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      handleUpdateBackground({
        imageUrl: event.target.result,
        type: 'custom-image'
      });
    };
    reader.readAsDataURL(file);
  };

  // Update a specific element
  const handleUpdateElement = (updated) => {
    setLocalTemplate((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetSide = activeSide === 'front' ? next.front : next.back;
      const idx = targetSide.elements.findIndex((el) => el.id === updated.id);
      if (idx !== -1) {
        targetSide.elements[idx] = updated;
      }
      return next;
    });
  };

  // Duplicate selected element
  const handleDuplicate = () => {
    if (!selectedElement) return;
    const newElement = {
      ...JSON.parse(JSON.stringify(selectedElement)),
      id: `${selectedElement.id}_copy_${Date.now()}`,
      name: `${selectedElement.name || selectedElement.type} (Copy)`,
      x: Math.min(750, selectedElement.x + 20),
      y: Math.min(480, selectedElement.y + 20),
      locked: false
    };

    setLocalTemplate((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetSide = activeSide === 'front' ? next.front : next.back;
      targetSide.elements.push(newElement);
      return next;
    });
    setSelectedId(newElement.id);
  };

  // Delete selected element
  const handleDelete = () => {
    if (!selectedElement) return;
    setLocalTemplate((prev) => {
      const next = JSON.parse(JSON.stringify(prev));
      const targetSide = activeSide === 'front' ? next.front : next.back;
      targetSide.elements = targetSide.elements.filter((el) => el.id !== selectedId);
      return next;
    });
    setSelectedId(null);
  };

  // Toggle Lock
  const handleToggleLock = () => {
    if (!selectedElement) return;
    handleUpdateElement({
      ...selectedElement,
      locked: !selectedElement.locked
    });
  };

  // Section 26: 1-Click Size Presets (Small, Medium, Large)
  const handleApplySizePreset = (preset) => {
    if (!selectedElement) return;
    const isTextLike = ['text', 'field', 'badge', 'field_container'].includes(selectedElement.type);
    let updated = { ...selectedElement, sizePreset: preset };

    if (isTextLike) {
      const currentValSize = selectedElement.style?.valueFontSize || selectedElement.style?.fontSize || 14;
      let newValSize = currentValSize;
      if (preset === 'small') newValSize = Math.max(9, Math.round(currentValSize * 0.85));
      if (preset === 'medium') newValSize = currentValSize;
      if (preset === 'large') newValSize = Math.min(36, Math.round(currentValSize * 1.25));

      updated.style = {
        ...(selectedElement.style || {}),
        fontSize: newValSize,
        valueFontSize: newValSize
      };
    } else if (selectedElement.type === 'photo') {
      if (preset === 'small') { updated.width = 165; updated.height = 210; }
      if (preset === 'medium') { updated.width = 188; updated.height = 240; }
      if (preset === 'large') { updated.width = 210; updated.height = 265; }
    } else if (selectedElement.type === 'qr') {
      if (preset === 'small') { updated.width = 150; updated.height = 150; }
      if (preset === 'medium') { updated.width = 180; updated.height = 180; }
      if (preset === 'large') { updated.width = 210; updated.height = 210; }
    } else if (selectedElement.type === 'image' || selectedElement.type === 'logo') {
      if (preset === 'small') { updated.width = 100; updated.height = 28; }
      if (preset === 'medium') { updated.width = 126; updated.height = 35; }
      if (preset === 'large') { updated.width = 150; updated.height = 42; }
    } else if (selectedElement.type === 'address') {
      if (preset === 'small') {
        updated.style = { ...(selectedElement.style || {}), fontSize: 10.5, englishFontSize: 10.5, marathiFontSize: 11.5 };
      } else if (preset === 'medium') {
        updated.style = { ...(selectedElement.style || {}), fontSize: 12, englishFontSize: 12, marathiFontSize: 13 };
      } else if (preset === 'large') {
        updated.style = { ...(selectedElement.style || {}), fontSize: 14, englishFontSize: 14, marathiFontSize: 15 };
      }
    } else if (selectedElement.type === 'table') {
      if (preset === 'small') {
        updated.style = { ...(selectedElement.style || {}), rowHeight: 26, fontSize: 10 };
      } else if (preset === 'medium') {
        updated.style = { ...(selectedElement.style || {}), rowHeight: 30, fontSize: 11.5 };
      } else if (preset === 'large') {
        updated.style = { ...(selectedElement.style || {}), rowHeight: 36, fontSize: 13 };
      }
    }

    handleUpdateElement(updated);
  };

  // Save changes
  const handleSave = async () => {
    await onSaveTemplate(localTemplate);
    setSaveStatus('Template saved successfully to persistent storage!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 rounded-xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between px-6 py-3.5 bg-slate-950 border-b border-slate-800 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            <Sliders size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Template Designer & Visual Customizer
              <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full font-mono">
                {localTemplate.name}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Edit positions, typography, colors, dynamic QR binding, and layout parameters.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {saveStatus && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1.5 rounded-lg animate-pulse">
              <CheckCircle2 size={14} />
              {saveStatus}
            </div>
          )}

          <button
            onClick={() => onResetTemplate()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            title="Reset to original design reference"
          >
            <RotateCcw size={14} />
            Reset Reference
          </button>

          <button
            onClick={() => onExportTemplate(localTemplate)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            title="Export Template JSON (No farmer data)"
          >
            <Download size={14} />
            Export JSON
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-lg shadow-emerald-900/40 transition active:scale-95"
          >
            <Save size={16} />
            Save Template
          </button>
        </div>
      </div>

      {/* Main Studio Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Layer Hierarchy Panel (Organized by 5 Section Categories) */}
        <div className="w-64 bg-slate-950/70 border-r border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-300 uppercase tracking-wider">
            <span className="flex items-center gap-1.5">
              <Layers size={14} className="text-emerald-400" />
              Card Layers ({elements.length})
            </span>
            <span className="text-[10px] text-slate-500 font-mono capitalize">
              {activeSide}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-3">
            {CATEGORIES.map((cat) => {
              const catElements = elements.filter((el) => getElementCategory(el) === cat.id);
              const isDesignCat = cat.id === 'DESIGN';
              if (catElements.length === 0 && !isDesignCat) return null;

              return (
                <div key={cat.id} className="bg-slate-900/40 rounded-xl p-1.5 border border-slate-800/70">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <cat.icon size={11} className="text-emerald-400" />
                      {cat.label}
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono bg-slate-800 px-1.5 py-0.2 rounded">
                      {catElements.length + (isDesignCat ? 1 : 0)}
                    </span>
                  </div>

                  <div className="space-y-1 mt-1">
                    {/* Background & Styling inside DESIGN group */}
                    {isDesignCat && (
                      <div
                        onClick={() => setSelectedId('__background__')}
                        className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                          selectedId === '__background__' || (!selectedElement && selectedId === null)
                            ? 'bg-emerald-600 text-white font-semibold shadow-md'
                            : 'bg-slate-900/80 text-amber-300 hover:bg-slate-800 border border-amber-900/30'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <Palette size={12} className="text-amber-400 flex-shrink-0" />
                          <span className="truncate">Background Theme</span>
                        </div>
                        <span className="text-[9px] px-1 py-0.5 rounded font-mono bg-amber-950/60 text-amber-300 border border-amber-800/40">
                          BG
                        </span>
                      </div>
                    )}

                    {catElements.map((el) => {
                      const isSelected = selectedId === el.id;
                      return (
                        <div
                          key={el.id}
                          onClick={() => setSelectedId(el.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                            isSelected
                              ? 'bg-emerald-600 text-white font-semibold shadow-md'
                              : 'text-slate-300 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate flex-1 min-w-0 mr-1.5">
                            {el.locked ? (
                              <Lock size={12} className="text-amber-400 flex-shrink-0" />
                            ) : (
                              <Move size={12} className="opacity-40 flex-shrink-0" />
                            )}
                            <span className={`truncate ${el.hidden ? 'line-through opacity-60' : ''}`}>
                              {el.name || el.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateElement({ ...el, hidden: !el.hidden });
                              }}
                              className="p-1 text-slate-400 hover:text-white rounded transition"
                              title={el.hidden ? 'Show element' : 'Hide element'}
                            >
                              {el.hidden ? (
                                <EyeOff size={12} className="text-amber-400" />
                              ) : (
                                <Eye size={12} className="opacity-40 hover:opacity-100" />
                              )}
                            </button>
                            <span
                              className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                                isSelected ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {el.type}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side Toggle Bar */}
          <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
            <button
              onClick={() => {
                setActiveSide('front');
                setSelectedId(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeSide === 'front'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Front Side
            </button>
            <button
              onClick={() => {
                setActiveSide('back');
                setSelectedId(null);
              }}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                activeSide === 'back'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Back Side
            </button>
          </div>
        </div>

        {/* Center: Interactive Canvas */}
        <div className="flex-1 flex flex-col bg-slate-900/90 overflow-hidden relative">
          {/* Canvas Toolbar with Zoom & Actual Size Controls */}
          <div className="flex items-center justify-between px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/60 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-medium">Viewing:</span>
              <span className="font-bold text-white capitalize bg-slate-800 px-2 py-0.5 rounded">
                {activeSide} Side (85.6mm × 54mm)
              </span>
              <span className="text-slate-500">|</span>
              <span className="text-slate-400">Preview Farmer:</span>
              <span className="font-semibold text-emerald-400 truncate max-w-[140px]">
                {sampleFarmer?.name_english || 'Sample Farmer'}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Actual Size Preview Toggle (Section 27) */}
              <button
                type="button"
                onClick={() => setIsActualSize(!isActualSize)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border ${
                  isActualSize
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                }`}
                title="View at actual 85.6mm × 54mm physical card dimensions (1:1 PVC Scale)"
              >
                <Maximize2 size={13} />
                <span>{isActualSize ? 'Actual Size (85.6×54mm) ON' : 'Actual Size Preview'}</span>
              </button>

              {/* Zoom Controls (50%, 75%, 100%, 150%, 200%) */}
              {!isActualSize && (
                <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 px-1.5 font-semibold">Zoom:</span>
                  {[0.5, 0.75, 1.0, 1.5, 2.0].map((z) => (
                    <button
                      key={z}
                      onClick={() => setZoomScale(z)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                        zoomScale === z
                          ? 'bg-emerald-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {Math.round(z * 100)}%
                    </button>
                  ))}
                </div>
              )}

              {/* Background Mode Switch */}
              <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/50">
                <button
                  onClick={() => setBgMode('vector')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    bgMode === 'vector'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Vector Theme
                </button>
                <button
                  onClick={() => setBgMode('reference')}
                  className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                    bgMode === 'reference'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Overlay
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Card Canvas Container */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto bg-slate-950/50 select-none relative">
            {isActualSize && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 bg-amber-500 text-slate-950 font-bold px-3 py-1 rounded-full text-[11px] shadow-lg border border-amber-300 flex items-center gap-1.5 pointer-events-none">
                <Check size={13} />
                <span>Actual Physical Size Preview: 85.6 mm × 54.0 mm</span>
              </div>
            )}
            <div className="relative p-6 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-2xl backdrop-blur-sm">
              <CardRenderer
                template={localTemplate}
                side={activeSide}
                farmer={sampleFarmer}
                scale={isActualSize ? 0.38 : zoomScale}
                interactive={true}
                selectedElementId={selectedId}
                onSelectElement={setSelectedId}
                onUpdateElement={handleUpdateElement}
                backgroundMode={bgMode}
              />
            </div>
          </div>
        </div>

        {/* Right: Property Inspector Panel */}
        <div className="w-80 bg-slate-950/80 border-l border-slate-800 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Sliders size={14} className="text-emerald-400" />
              Property Inspector
            </h3>
            {selectedElement && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleUpdateElement({ ...selectedElement, hidden: !selectedElement.hidden })}
                  className={`p-1.5 rounded transition ${
                    selectedElement.hidden
                      ? 'bg-amber-600/20 text-amber-400'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={selectedElement.hidden ? 'Show Element' : 'Hide Element'}
                >
                  {selectedElement.hidden ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  onClick={handleToggleLock}
                  className={`p-1.5 rounded transition ${
                    selectedElement.locked
                      ? 'bg-amber-600/20 text-amber-400'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  title={selectedElement.locked ? 'Unlock Element' : 'Lock Element'}
                >
                  {selectedElement.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
                <button
                  onClick={handleDuplicate}
                  className="p-1.5 rounded text-slate-400 hover:bg-slate-800 hover:text-white transition"
                  title="Duplicate Element"
                >
                  <Copy size={14} />
                </button>
                <button
                  onClick={handleDelete}
                  className="p-1.5 rounded text-rose-400 hover:bg-rose-950/50 transition"
                  title="Delete Element"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {selectedElement ? (
            <div className="p-4 space-y-4 text-xs">
              {/* Element Header */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="text-slate-400 text-[11px]">Selected:</div>
                <div className="font-bold text-white text-sm">{selectedElement.name || selectedElement.type}</div>
                <div className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  ID: {selectedElement.id}
                </div>
              </div>

              {/* Section 26: 1-Click Size Presets (Small, Medium, Large) */}
              <div className="space-y-1.5 bg-slate-900 p-3 rounded-lg border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    Quick Size Preset
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">1-Click Scale</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {['small', 'medium', 'large'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleApplySizePreset(preset)}
                      className={`py-1.5 text-xs font-bold rounded capitalize transition border ${
                        selectedElement.sizePreset === preset
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Address Style Options (Section 15) */}
              {(selectedElement.type === 'address' || selectedElement.id === 'back_address') && (
                <div className="space-y-2 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center justify-between">
                    <span>Address Style</span>
                    <span className="text-[10px] text-emerald-400 font-semibold capitalize">
                      {selectedElement.addressStyle || 'compact'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateElement({
                          ...selectedElement,
                          addressStyle: 'compact'
                        })
                      }
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-0.5 border ${
                        (selectedElement.addressStyle || 'compact') === 'compact'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      <span>Compact</span>
                      <span className="text-[9px] font-normal opacity-80 text-center">Dual-Language 2-Line</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateElement({
                          ...selectedElement,
                          addressStyle: 'detailed'
                        })
                      }
                      className={`py-2 px-2 rounded-lg text-xs font-bold transition flex flex-col items-center gap-0.5 border ${
                        selectedElement.addressStyle === 'detailed'
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      <span>Detailed</span>
                      <span className="text-[9px] font-normal opacity-80 text-center">2×2 Grid Breakdown</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Land Table Options (Sections 16 & 17) */}
              {(selectedElement.type === 'table' || selectedElement.id === 'back_land_table') && (
                <div className="space-y-2.5 bg-slate-900 p-3 rounded-lg border border-slate-800">
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <TableIcon size={12} className="text-emerald-400" />
                    Dynamic Land Table Options
                  </div>
                  <div>
                    <div className="flex justify-between text-slate-400 text-[10px] mb-1">
                      <span>Max Visible Rows</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {selectedElement.tableConfig?.maxRows || 5} Rows
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="6"
                      value={selectedElement.tableConfig?.maxRows || 5}
                      onChange={(e) =>
                        handleUpdateElement({
                          ...selectedElement,
                          tableConfig: {
                            ...(selectedElement.tableConfig || {}),
                            maxRows: parseInt(e.target.value) || 5
                          }
                        })
                      }
                      className="w-full accent-emerald-500"
                    />
                    <p className="text-[9px] text-slate-400 mt-1">
                      Automatically sizes for 1, 2, 3, 4, 5+ records. Overflow rows show controlled notice.
                    </p>
                  </div>
                </div>
              )}

              {/* Advanced Mode Toggle for Precise Coordinates */}
              <div>
                <button
                  type="button"
                  onClick={() => setAdvancedMode(!advancedMode)}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
                >
                  <span className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider">
                    <Settings size={12} className="text-emerald-400" />
                    Advanced Coordinates (X/Y, W/H)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {advancedMode ? 'Hide' : 'Show'}
                  </span>
                </button>
              </div>

              {/* Geometry: X, Y, Width, Height (Advanced) */}
              {advancedMode && (
                <div className="space-y-3 p-3 bg-slate-900/70 rounded-lg border border-slate-800/80">
                  <div className="space-y-2">
                    <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      Position & Dimensions
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-[10px]">X (px)</label>
                        <input
                          type="number"
                          value={selectedElement.x || 0}
                          disabled={selectedElement.locked}
                          onChange={(e) =>
                            handleUpdateElement({
                              ...selectedElement,
                              x: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px]">Y (px)</label>
                        <input
                          type="number"
                          value={selectedElement.y || 0}
                          disabled={selectedElement.locked}
                          onChange={(e) =>
                            handleUpdateElement({
                              ...selectedElement,
                              y: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px]">Width (px)</label>
                        <input
                          type="number"
                          value={selectedElement.width || 0}
                          disabled={selectedElement.locked}
                          onChange={(e) =>
                            handleUpdateElement({
                              ...selectedElement,
                              width: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px]">Height (px)</label>
                        <input
                          type="number"
                          value={selectedElement.height || 0}
                          disabled={selectedElement.locked}
                          onChange={(e) =>
                            handleUpdateElement({
                              ...selectedElement,
                              height: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Rotation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Rotation</span>
                      <span className="font-mono text-white">{selectedElement.rotation || 0}°</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={selectedElement.rotation || 0}
                      disabled={selectedElement.locked}
                      onChange={(e) =>
                        handleUpdateElement({
                          ...selectedElement,
                          rotation: parseInt(e.target.value) || 0
                        })
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>
                </div>
              )}

              {/* Image / Logo Controls */}
              {(selectedElement.type === 'image' || selectedElement.type === 'logo') && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Sparkles size={12} className="text-emerald-400" />
                    Logo / Image Properties
                  </div>

                  {/* Logo Preview */}
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 flex items-center justify-center min-h-[50px]">
                    <img
                      src={selectedElement.src || selectedElement.imageUrl || '/agristack_logo.png'}
                      alt="Logo Preview"
                      className="max-h-12 max-w-full object-contain"
                    />
                  </div>

                  {/* Opacity Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400 text-[10px]">
                      <span>Opacity</span>
                      <span className="font-mono text-white">
                        {Math.round((selectedElement.style?.opacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={selectedElement.style?.opacity ?? 1}
                      onChange={(e) =>
                        handleUpdateElement({
                          ...selectedElement,
                          style: {
                            ...selectedElement.style,
                            opacity: parseFloat(e.target.value)
                          }
                        })
                      }
                      className="w-full accent-emerald-500"
                    />
                  </div>

                  {/* Upload / Replace Logo Asset */}
                  <div className="space-y-1.5">
                    <label className="text-slate-400 text-[10px] block">Replace Logo Image</label>
                    <label className="flex items-center justify-center gap-2 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer text-xs font-semibold border border-slate-700 transition">
                      <Upload size={13} />
                      Upload Logo Asset
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            handleUpdateElement({
                              ...selectedElement,
                              src: event.target.result,
                              imageUrl: event.target.result
                            });
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Reset to Default AgriStack Logo */}
                  <button
                    type="button"
                    onClick={() =>
                      handleUpdateElement({
                        ...selectedElement,
                        assetId: 'agristack-logo',
                        src: '/agristack_logo.png',
                        imageUrl: '/agristack_logo.png'
                      })
                    }
                    className="w-full py-1 text-[11px] text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-800/50 rounded transition"
                  >
                    Reset to AgriStack Asset
                  </button>
                </div>
              )}

              {/* Text / Tagline Content */}
              {selectedElement.type === 'text' && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Type size={12} className="text-emerald-400" />
                    {selectedElement.role === 'tagline' || selectedElement.id === 'front_farmer_tagline'
                      ? 'Farmer Tagline (मराठी Quote)'
                      : 'Text Content'}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-slate-400 text-[10px]">
                        {selectedElement.role === 'tagline' || selectedElement.id === 'front_farmer_tagline'
                          ? 'Tagline Text'
                          : 'Text Content'}
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {(selectedElement.text || '').length} chars
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      value={selectedElement.text || ''}
                      onChange={(e) =>
                        handleUpdateElement({
                          ...selectedElement,
                          text: e.target.value
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-xs font-medium focus:border-emerald-500 resize-y"
                      placeholder="Enter text..."
                    />
                  </div>

                  {/* Tagline Quick Presets for Marathi Quotes */}
                  {(selectedElement.role === 'tagline' || selectedElement.id === 'front_farmer_tagline' || /[\u0900-\u097F]/.test(selectedElement.text || '')) && (
                    <div className="space-y-1.5 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                        Marathi Tagline Presets
                      </span>
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateElement({
                              ...selectedElement,
                              text: 'शेतकरी जगाचा पोशिंदा, बळीराजा आमचा अभिमान!'
                            })
                          }
                          className="w-full text-left p-2 rounded bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-700 text-xs text-emerald-300 transition"
                        >
                          <span className="font-semibold block">१. शेतकरी जगाचा पोशिंदा, बळीराजा आमचा अभिमान!</span>
                          <span className="text-[9px] text-slate-400">Default agricultural tribute</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateElement({
                              ...selectedElement,
                              text: 'शेतकऱ्यांशिवाय जग अपूर्ण, कष्टाला आमच्या मानाची पूर्ण!'
                            })
                          }
                          className="w-full text-left p-2 rounded bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-700 text-xs text-amber-300 transition"
                        >
                          <span className="font-semibold block">२. शेतकऱ्यांशिवाय जग अपूर्ण, कष्टाला आमच्या मानाची पूर्ण!</span>
                          <span className="text-[9px] text-slate-400">Alternative farmer appreciation quote</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Typography / Styling Controls */}
              {selectedElement.style && (selectedElement.type === 'text' || selectedElement.type === 'badge' || selectedElement.type === 'field' || selectedElement.type === 'field_container') && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <Sliders size={12} className="text-emerald-400" />
                    Typography & Styling
                  </div>

                  {/* Font Size */}
                  {(selectedElement.style.fontSize !== undefined ||
                    selectedElement.style.valueFontSize !== undefined) && (
                    <div>
                      <label className="text-slate-400 text-[10px]">Font Size (px)</label>
                      <input
                        type="number"
                        value={
                          selectedElement.style.fontSize ??
                          selectedElement.style.valueFontSize ??
                          16
                        }
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 12;
                          handleUpdateElement({
                            ...selectedElement,
                            style: {
                              ...selectedElement.style,
                              fontSize: val,
                              valueFontSize: val
                            }
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  )}

                  {/* Font Family */}
                  {(selectedElement.style.fontFamily || selectedElement.style.valueFontFamily) && (
                    <div>
                      <label className="text-slate-400 text-[10px]">Font Family</label>
                      <select
                        value={
                          selectedElement.style.fontFamily ||
                          selectedElement.style.valueFontFamily ||
                          "'Outfit', sans-serif"
                        }
                        onChange={(e) => {
                          handleUpdateElement({
                            ...selectedElement,
                            style: {
                              ...selectedElement.style,
                              fontFamily: e.target.value,
                              valueFontFamily: e.target.value
                            }
                          });
                        }}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
                      >
                        <option value="'Noto Sans Devanagari', 'Mukta', sans-serif">Noto Sans Devanagari (Marathi)</option>
                        <option value="'Mukta', sans-serif">Mukta (Marathi / Devanagari)</option>
                        <option value="'Outfit', sans-serif">Outfit (Modern Clean)</option>
                        <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                        <option value="'Courier New', monospace">Courier (Monospace ID)</option>
                      </select>
                    </div>
                  )}

                  {/* Font Weight */}
                  <div>
                    <label className="text-slate-400 text-[10px]">Font Weight</label>
                    <select
                      value={
                        selectedElement.style.fontWeight ||
                        selectedElement.style.valueFontWeight ||
                        700
                      }
                      onChange={(e) => {
                        const w = parseInt(e.target.value);
                        handleUpdateElement({
                          ...selectedElement,
                          style: {
                            ...selectedElement.style,
                            fontWeight: w,
                            valueFontWeight: w
                          }
                        });
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-white"
                    >
                      <option value="400">Regular (400)</option>
                      <option value="600">SemiBold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">ExtraBold (800)</option>
                    </select>
                  </div>

                  {/* Text Alignment */}
                  <div>
                    <label className="text-slate-400 text-[10px]">Alignment</label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {['left', 'center', 'right'].map((align) => (
                        <button
                          key={align}
                          type="button"
                          onClick={() =>
                            handleUpdateElement({
                              ...selectedElement,
                              style: {
                                ...selectedElement.style,
                                textAlign: align
                              }
                            })
                          }
                          className={`py-1 text-xs font-semibold rounded capitalize transition ${
                            (selectedElement.style?.textAlign || 'left') === align
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                          }`}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color Picker & Preset Chips */}
                  <div>
                    <label className="text-slate-400 text-[10px]">Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={
                          selectedElement.style.color ||
                          selectedElement.style.valueColor ||
                          '#0F172A'
                        }
                        onChange={(e) => {
                          handleUpdateElement({
                            ...selectedElement,
                            style: {
                              ...selectedElement.style,
                              color: e.target.value,
                              valueColor: e.target.value
                            }
                          });
                        }}
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={
                          selectedElement.style.color ||
                          selectedElement.style.valueColor ||
                          '#0F172A'
                        }
                        onChange={(e) => {
                          handleUpdateElement({
                            ...selectedElement,
                            style: {
                              ...selectedElement.style,
                              color: e.target.value,
                              valueColor: e.target.value
                            }
                          });
                        }}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white font-mono uppercase"
                      />
                    </div>
                    {/* Color Quick Preset Chips */}
                    <div className="flex items-center gap-2 pt-1.5">
                      {[
                        { label: 'Agri Green', color: '#225C37' },
                        { label: 'Forest Green', color: '#1F5C3A' },
                        { label: 'Muted Brown', color: '#4A3E31' },
                        { label: 'Dark Slate', color: '#0F172A' },
                        { label: 'Notice Sand', color: '#7E6B5A' }
                      ].map((c) => (
                        <button
                          key={c.color}
                          type="button"
                          onClick={() =>
                            handleUpdateElement({
                              ...selectedElement,
                              style: {
                                ...selectedElement.style,
                                color: c.color,
                                valueColor: c.color
                              }
                            })
                          }
                          className="w-5 h-5 rounded-full border border-slate-700 transition hover:scale-110 shadow-sm"
                          style={{ backgroundColor: c.color }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* QR Code Configuration */}
              {selectedElement.type === 'qr' && (() => {
                const elementQrConfig = {
                  sourceType: selectedElement.sourceType || (selectedElement.sourceField === 'custom' ? 'custom' : selectedElement.sourceField === 'multiple' ? 'multiple' : selectedElement.sourceField === 'url' ? 'url' : 'field'),
                  sourceField: selectedElement.sourceField || localTemplate.qrConfig?.sourceField || 'farmer_id',
                  errorCorrection: selectedElement.errorCorrection || selectedElement.errorCorrectionLevel || localTemplate.qrConfig?.errorCorrection || localTemplate.qrConfig?.errorCorrectionLevel || 'Q',
                  size: selectedElement.size || localTemplate.qrConfig?.size || 20,
                  margin: selectedElement.margin ?? localTemplate.qrConfig?.margin ?? 4,
                  foregroundColor: selectedElement.foregroundColor || selectedElement.style?.foregroundColor || localTemplate.qrConfig?.foregroundColor || '#000000',
                  backgroundColor: selectedElement.backgroundColor || selectedElement.style?.backgroundColor || localTemplate.qrConfig?.backgroundColor || '#FFFFFF',
                  caption: selectedElement.caption !== undefined ? selectedElement.caption : (selectedElement.style?.caption ?? localTemplate.qrConfig?.caption ?? ''),
                  captionFontSize: selectedElement.captionFontSize || selectedElement.style?.captionFontSize || localTemplate.qrConfig?.captionFontSize || 10.5,
                  multipleFields: selectedElement.multipleFields || localTemplate.qrConfig?.multipleFields || DEFAULT_MULTIPLE_FIELDS,
                  customText: selectedElement.customText || localTemplate.qrConfig?.customText || DEFAULT_CUSTOM_TEMPLATE,
                  urlPattern: selectedElement.urlPattern || localTemplate.qrConfig?.urlPattern || DEFAULT_VERIFICATION_URL
                };

                const updateQrConfig = (patch) => {
                  const merged = { ...elementQrConfig, ...patch };
                  if (patch.sourceField) {
                    if (patch.sourceField === 'custom') merged.sourceType = 'custom';
                    else if (patch.sourceField === 'multiple') merged.sourceType = 'multiple';
                    else if (patch.sourceField === 'url') merged.sourceType = 'url';
                    else merged.sourceType = 'field';
                  }

                  handleUpdateElement({
                    ...selectedElement,
                    ...merged,
                    style: {
                      ...selectedElement.style,
                      caption: merged.caption,
                      captionFontSize: merged.captionFontSize,
                      backgroundColor: merged.backgroundColor,
                      foregroundColor: merged.foregroundColor
                    }
                  });

                  setLocalTemplate((prev) => ({
                    ...prev,
                    qrConfig: {
                      ...prev.qrConfig,
                      ...merged
                    }
                  }));
                };

                const livePreview = resolveQrPayload(elementQrConfig, sampleFarmer);

                return (
                  <div className="space-y-3.5 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="text-slate-300 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                        <QrCode size={13} className="text-emerald-400" />
                        QR Code Configuration
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsTestQrOpen(true)}
                        className="flex items-center gap-1 px-2 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 text-[10px] font-bold rounded transition"
                      >
                        <Smartphone size={11} />
                        Test QR
                      </button>
                    </div>

                    {/* QR Data Source Selector */}
                    <div>
                      <label className="text-slate-400 text-[10px] block mb-1 font-medium">QR Data Source</label>
                      <select
                        value={elementQrConfig.sourceField}
                        onChange={(e) => updateQrConfig({ sourceField: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white text-xs font-medium focus:border-emerald-500"
                      >
                        {QR_SOURCE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Conditional Source: Custom Text */}
                    {elementQrConfig.sourceField === 'custom' && (
                      <div className="space-y-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                        <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider block">
                          Custom Text Template
                        </label>
                        <textarea
                          rows={3}
                          value={elementQrConfig.customText}
                          onChange={(e) => updateQrConfig({ customText: e.target.value })}
                          placeholder="FARMER CARD&#10;Farmer ID: {{farmer_id}}"
                          className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-[11px] resize-y"
                        />
                        <div className="space-y-1">
                          <span className="text-slate-400 text-[9px] block">Click to insert field tag:</span>
                          <div className="flex flex-wrap gap-1">
                            {['farmer_id', 'name_english', 'name_marathi', 'farmer_enrollment_number', 'mobile', 'uid', 'dob', 'village', 'taluka', 'district'].map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  const placeholder = `{{${tag}}}`;
                                  updateQrConfig({
                                    customText: (elementQrConfig.customText || '') + (elementQrConfig.customText?.endsWith(' ') || elementQrConfig.customText?.endsWith('\n') ? '' : ' ') + placeholder
                                  });
                                }}
                                className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] rounded font-mono transition"
                              >
                                + {tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Conditional Source: Multiple Fields */}
                    {elementQrConfig.sourceField === 'multiple' && (
                      <div className="space-y-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between">
                          <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                            Select Encoded Fields
                          </label>
                          <span className="text-[9px] text-emerald-400 font-mono">
                            {elementQrConfig.multipleFields?.length || 0} selected
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Only explicitly selected fields are encoded into the QR payload.
                        </p>
                        <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
                          {AVAILABLE_MULTIPLE_FIELDS.map((f) => {
                            const isChecked = elementQrConfig.multipleFields?.includes(f.key);
                            return (
                              <label
                                key={f.key}
                                className={`flex items-center gap-1.5 p-1.5 rounded text-[10px] cursor-pointer transition border ${
                                  isChecked
                                    ? 'bg-emerald-950/50 border-emerald-800/80 text-emerald-200'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const currentList = elementQrConfig.multipleFields || [];
                                    const nextList = e.target.checked
                                      ? [...currentList, f.key]
                                      : currentList.filter((k) => k !== f.key);
                                    updateQrConfig({ multipleFields: nextList });
                                  }}
                                  className="rounded border-slate-700 text-emerald-500 focus:ring-0 w-3 h-3"
                                />
                                <span className="truncate">{f.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Conditional Source: Verification URL */}
                    {elementQrConfig.sourceField === 'url' && (
                      <div className="space-y-2 bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
                        <label className="text-slate-300 text-[10px] font-bold uppercase tracking-wider block">
                          Verification URL Pattern
                        </label>
                        <input
                          type="text"
                          value={elementQrConfig.urlPattern}
                          onChange={(e) => updateQrConfig({ urlPattern: e.target.value })}
                          placeholder="https://krishiseva.gov.in/verify/{{farmer_id}}"
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-white font-mono text-[11px] focus:border-emerald-500"
                        />
                        {/* Requirement 6 Explicit Warning */}
                        <div className="p-2 bg-amber-950/40 border border-amber-800/60 rounded flex items-start gap-1.5">
                          <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="text-[10px] text-amber-200 leading-tight">
                            <strong>Warning:</strong> Verification URL requires an online verification service.
                            <div className="text-[9px] text-amber-300/80 mt-0.5">
                              For the current offline MVP, direct local data encoding (e.g. Farmer ID) is recommended.
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Live Sample Payload Preview */}
                    <div className="bg-slate-950 p-2 rounded border border-slate-800 space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                        Live Payload Preview (Sample Farmer)
                      </span>
                      <pre className="text-[10px] text-emerald-400 font-mono whitespace-pre-wrap break-all max-h-20 overflow-y-auto bg-slate-900 p-1.5 rounded">
                        {livePreview.isMissing ? `[${livePreview.message}]` : livePreview.payload}
                      </pre>
                    </div>

                    {/* QR Appearance Properties (Requirement 10) */}
                    <div className="space-y-2.5 pt-1">
                      <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                        Appearance & Print Settings
                      </div>

                      {/* Physical Size & Margin */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 text-[10px]">Physical Size (mm)</label>
                          <input
                            type="number"
                            min="15"
                            max="35"
                            value={elementQrConfig.size || 20}
                            onChange={(e) => updateQrConfig({ size: parseFloat(e.target.value) || 20 })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px]">Quiet Zone (modules)</label>
                          <input
                            type="number"
                            min="4"
                            max="8"
                            value={elementQrConfig.margin ?? 4}
                            onChange={(e) => updateQrConfig({ margin: parseInt(e.target.value) || 4 })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Error Correction Level */}
                      <div>
                        <label className="text-slate-400 text-[10px]">Error Correction Level</label>
                        <select
                          value={elementQrConfig.errorCorrection}
                          onChange={(e) => updateQrConfig({ errorCorrection: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs"
                        >
                          <option value="L">L – Low (7% recovery)</option>
                          <option value="M">M – Medium (15% recovery)</option>
                          <option value="Q">Q – Quartile (25% recovery - Recommended)</option>
                          <option value="H">H – High (30% recovery)</option>
                        </select>
                      </div>

                      {/* Foreground & Background Colors */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-slate-400 text-[10px]">Foreground</label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="color"
                              value={elementQrConfig.foregroundColor || '#000000'}
                              onChange={(e) => updateQrConfig({ foregroundColor: e.target.value })}
                              className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={elementQrConfig.foregroundColor || '#000000'}
                              onChange={(e) => updateQrConfig({ foregroundColor: e.target.value })}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-[10px] uppercase"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px]">Background</label>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <input
                              type="color"
                              value={elementQrConfig.backgroundColor || '#FFFFFF'}
                              onChange={(e) => updateQrConfig({ backgroundColor: e.target.value })}
                              className="w-6 h-6 rounded border border-slate-700 bg-transparent cursor-pointer"
                            />
                            <input
                              type="text"
                              value={elementQrConfig.backgroundColor || '#FFFFFF'}
                              onChange={(e) => updateQrConfig({ backgroundColor: e.target.value })}
                              className="flex-1 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white font-mono text-[10px] uppercase"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Caption & Caption Font Size */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <label className="text-slate-400 text-[10px]">Caption</label>
                          <input
                            type="text"
                            value={elementQrConfig.caption || ''}
                            onChange={(e) => updateQrConfig({ caption: e.target.value })}
                            placeholder="Optional caption"
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs mt-0.5"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-[10px]">Font Size</label>
                          <input
                            type="number"
                            min="8"
                            max="16"
                            step="0.5"
                            value={elementQrConfig.captionFontSize || 10.5}
                            onChange={(e) => updateQrConfig({ captionFontSize: parseFloat(e.target.value) || 10.5 })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs font-mono mt-0.5"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Table Column Configuration */}
              {selectedElement.type === 'table' && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <TableIcon size={12} className="text-emerald-400" />
                    Table Columns & Rows
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Configured Columns:
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {selectedElement.tableConfig?.columns?.map((col, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 bg-slate-900 p-2 rounded border border-slate-800 text-[11px]"
                      >
                        <input
                          type="text"
                          value={col.label}
                          onChange={(e) => {
                            const newCols = [...selectedElement.tableConfig.columns];
                            newCols[idx] = { ...newCols[idx], label: e.target.value };
                            handleUpdateElement({
                              ...selectedElement,
                              tableConfig: {
                                ...selectedElement.tableConfig,
                                columns: newCols
                              }
                            });
                          }}
                          className="flex-1 bg-slate-800 border border-slate-700 rounded px-1.5 py-0.5 text-white"
                        />
                        <span className="text-slate-400 text-[10px] font-mono">{col.width}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 space-y-5 text-xs">
              {/* Header */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">Active Layer:</div>
                  <div className="font-bold text-white text-sm flex items-center gap-1.5 mt-0.5">
                    <Palette size={15} className="text-amber-400" />
                    Background & Styling
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-0.5 capitalize">
                    {activeSide} Side • 85.6 × 54 mm
                  </div>
                </div>
                <button
                  onClick={() =>
                    handleUpdateBackground({
                      locked: !currentBg.locked
                    })
                  }
                  className={`p-1.5 rounded transition ${
                    currentBg.locked
                      ? 'bg-amber-600/20 text-amber-400'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                  title={currentBg.locked ? 'Unlock Background' : 'Lock Background'}
                >
                  {currentBg.locked ? <Lock size={14} /> : <Unlock size={14} />}
                </button>
              </div>

              {/* 1. Base Color & Presets */}
              <div className="space-y-2">
                <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  Paper / Card Base Color
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: 'Ivory', color: '#FAF8EE' },
                    { label: 'Cream', color: '#F4F0DC' },
                    { label: 'Sage', color: '#E5EEDC' },
                    { label: 'White', color: '#FFFFFF' }
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      onClick={() => handleUpdateBackground({ color: preset.color })}
                      className={`px-2 py-1.5 rounded text-[10px] font-bold border transition ${
                        currentBg.color === preset.color
                          ? 'border-emerald-400 text-white bg-slate-800'
                          : 'border-slate-800 text-slate-300 hover:bg-slate-850'
                      }`}
                      style={{ borderLeftColor: preset.color, borderLeftWidth: '4px' }}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="color"
                    value={currentBg.color || '#FAF8EE'}
                    onChange={(e) => handleUpdateBackground({ color: e.target.value })}
                    className="w-7 h-7 rounded border border-slate-700 cursor-pointer bg-slate-900"
                  />
                  <input
                    type="text"
                    value={currentBg.color || '#FAF8EE'}
                    onChange={(e) => handleUpdateBackground({ color: e.target.value })}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* 2. Custom Background Image Upload */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center justify-between">
                  <span>Custom Image Layer</span>
                  {currentBg.imageUrl && (
                    <span className="text-[9px] text-emerald-400 font-normal">Active Image</span>
                  )}
                </div>

                {currentBg.imageUrl ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border border-slate-700 max-h-24 bg-slate-900">
                      <img
                        src={currentBg.imageUrl}
                        alt="Background Preview"
                        className="w-full h-24 object-cover"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex-1 text-center py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer text-[11px] font-semibold border border-slate-700 transition">
                        Replace Image
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                      </label>
                      <button
                        onClick={() =>
                          handleUpdateBackground({
                            imageUrl: '',
                            type: 'agricultural-vector'
                          })
                        }
                        className="py-1.5 px-2.5 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 rounded text-[11px] font-semibold transition"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Image Scaling & Positioning */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-slate-400 text-[10px]">
                        <span>Image Scale</span>
                        <span className="font-mono text-white">
                          {Math.round((currentBg.imageScale || 1) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={currentBg.imageScale || 1}
                        onChange={(e) =>
                          handleUpdateBackground({
                            imageScale: parseFloat(e.target.value) || 1
                          })
                        }
                        className="w-full accent-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-slate-400 text-[10px]">Position X</label>
                        <input
                          type="number"
                          value={currentBg.imagePositionX || 0}
                          onChange={(e) =>
                            handleUpdateBackground({
                              imagePositionX: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[10px]">Position Y</label>
                        <input
                          type="number"
                          value={currentBg.imagePositionY || 0}
                          onChange={(e) =>
                            handleUpdateBackground({
                              imagePositionY: parseInt(e.target.value) || 0
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-700 hover:border-emerald-500 rounded-lg cursor-pointer bg-slate-900/50 hover:bg-slate-900 transition text-center group">
                    <Upload size={18} className="text-slate-500 group-hover:text-emerald-400 mb-1" />
                    <span className="text-slate-300 text-[11px] font-semibold">
                      Upload Custom Background
                    </span>
                    <span className="text-slate-500 text-[9px] mt-0.5">PNG, JPG up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>

              {/* 3. Image Filters: Opacity, Brightness, Contrast */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  Base Tone & Contrast
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Background Opacity</span>
                    <span className="font-mono text-white">
                      {Math.round((currentBg.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentBg.opacity ?? 1}
                    onChange={(e) =>
                      handleUpdateBackground({
                        opacity: parseFloat(e.target.value)
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Brightness</span>
                    <span className="font-mono text-white">
                      {currentBg.brightness ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={currentBg.brightness ?? 100}
                    onChange={(e) =>
                      handleUpdateBackground({
                        brightness: parseInt(e.target.value)
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Contrast</span>
                    <span className="font-mono text-white">
                      {currentBg.contrast ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    step="5"
                    value={currentBg.contrast ?? 100}
                    onChange={(e) =>
                      handleUpdateBackground({
                        contrast: parseInt(e.target.value)
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>
              </div>

              {/* 4. Decorative Agricultural Artwork */}
              <div className="space-y-2.5 pt-2 border-t border-slate-800">
                <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center justify-between">
                  <span>Decorative Vector Layer</span>
                  <button
                    onClick={() =>
                      handleUpdateBackground({
                        showDecorative: currentBg.showDecorative === false ? true : false
                      })
                    }
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentBg.showDecorative !== false
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {currentBg.showDecorative !== false ? 'Visible' : 'Hidden'}
                  </button>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Artwork Opacity</span>
                    <span className="font-mono text-white">
                      {Math.round((currentBg.decorativeOpacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={currentBg.decorativeOpacity ?? 1}
                    onChange={(e) =>
                      handleUpdateBackground({
                        decorativeOpacity: parseFloat(e.target.value)
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-slate-400 text-[10px]">
                    <span>Landscape Watermark Opacity</span>
                    <span className="font-mono text-white">
                      {Math.round((currentBg.watermarkOpacity ?? 0.12) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.02"
                    value={currentBg.watermarkOpacity ?? 0.12}
                    onChange={(e) =>
                      handleUpdateBackground({
                        watermarkOpacity: parseFloat(e.target.value)
                      })
                    }
                    className="w-full accent-emerald-500"
                  />
                </div>

                {/* Header & Gold Accent Colors */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Header Green</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={currentBg.headerColor || '#1B4D2E'}
                        onChange={(e) =>
                          handleUpdateBackground({ headerColor: e.target.value })
                        }
                        className="w-6 h-6 rounded border border-slate-700 bg-slate-900 cursor-pointer"
                      />
                      <span className="text-slate-300 font-mono text-[10px]">
                        {currentBg.headerColor || '#1B4D2E'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-slate-400 text-[10px] block mb-1">Gold Accent Line</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="color"
                        value={currentBg.goldAccentColor || '#D8B84A'}
                        onChange={(e) =>
                          handleUpdateBackground({ goldAccentColor: e.target.value })
                        }
                        className="w-6 h-6 rounded border border-slate-700 bg-slate-900 cursor-pointer"
                      />
                      <span className="text-slate-300 font-mono text-[10px]">
                        {currentBg.goldAccentColor || '#D8B84A'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Border Accent Toggle */}
                <div className="flex items-center justify-between pt-1 text-[11px] text-slate-300">
                  <span>Subtle Bottom Border</span>
                  <input
                    type="checkbox"
                    checked={currentBg.showBottomAccent !== false}
                    onChange={(e) =>
                      handleUpdateBackground({ showBottomAccent: e.target.checked })
                    }
                    className="accent-emerald-500 rounded"
                  />
                </div>
              </div>

              {/* 5. Synchronize Both Sides Action */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  onClick={handleApplyBackgroundToBothSides}
                  className="w-full py-2 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={14} />
                  Apply Styling to Both Sides
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QR Test Inspector Modal */}
      {isTestQrOpen && (
        <QrTestModal
          isOpen={isTestQrOpen}
          onClose={() => setIsTestQrOpen(false)}
          template={localTemplate}
          farmers={sampleFarmer ? [sampleFarmer] : []}
          activeFarmer={sampleFarmer}
        />
      )}
    </div>
  );
};
