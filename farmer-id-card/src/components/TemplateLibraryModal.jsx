import React, { useRef } from 'react';
import {
  CreditCard,
  Check,
  Download,
  Upload,
  RotateCcw,
  Plus,
  X,
  Sparkles,
  Calendar,
  Layers
} from 'lucide-react';
import { exportTemplateJSON, importTemplateJSON } from '../services/db';

export const TemplateLibraryModal = ({
  isOpen,
  onClose,
  templates,
  activeTemplateId,
  onSelectTemplate,
  onResetBuiltin,
  onImportTemplate
}) => {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = importTemplateJSON(event.target.result);
          onImportTemplate(imported);
        } catch (err) {
          alert('Import failed: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Layers size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Card Template Library
                <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                  {templates.length} Available
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose a preconfigured production template or import custom layouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <Upload size={14} />
              Import Template JSON
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((tpl) => {
            const isActive = tpl.templateId === activeTemplateId;
            return (
              <div
                key={tpl.templateId}
                className={`flex flex-col justify-between p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-1 ring-emerald-500'
                    : 'bg-slate-950/40 border-slate-800 hover:border-slate-700 hover:bg-slate-950/70'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2.5 py-0.5 rounded-full">
                      {tpl.category || 'Agriculture'}
                    </span>
                    {tpl.isBuiltin && (
                      <span className="text-[10px] text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full font-semibold">
                        Built-in Standard
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white mt-3 flex items-center gap-2">
                    {tpl.name}
                  </h3>

                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {tpl.description || 'Production-ready reusable Farmer ID card template.'}
                  </p>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-4 pt-3 border-t border-slate-800/80">
                    <div className="flex items-center gap-1 font-mono">
                      <span>Dimensions:</span>
                      <span className="text-slate-200">
                        {tpl.size?.width} × {tpl.size?.height} {tpl.size?.unit}
                      </span>
                    </div>
                    <div>
                      <span>Front/Back:</span>{' '}
                      <span className="text-emerald-400 font-semibold">Dual Sided</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-800/60">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => exportTemplateJSON(tpl)}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                      title="Export Template JSON (No farmer data)"
                    >
                      <Download size={14} />
                    </button>
                    {tpl.isBuiltin && (
                      <button
                        onClick={onResetBuiltin}
                        className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition"
                        title="Reset to Original Default Reference"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>

                  {isActive ? (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3.5 py-1.5 rounded-xl">
                      <Check size={14} />
                      Currently In Use
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        onSelectTemplate(tpl.templateId);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow active:scale-95"
                    >
                      Use Template
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
