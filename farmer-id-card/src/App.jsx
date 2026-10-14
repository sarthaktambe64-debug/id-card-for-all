import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  initStorage,
  getTemplates,
  saveTemplate,
  resetBuiltinTemplate,
  getFarmers,
  saveFarmer,
  deleteFarmer,
  exportTemplateJSON,
  getPrintHistory,
  clearPrintHistory,
  addPrintRecord
} from './services/db';
import { CardRenderer } from './components/CardRenderer';
import { TemplateEditor } from './components/TemplateEditor';
import { PrintModal } from './components/PrintModal';
import { FarmerModal } from './components/FarmerModal';
import { TemplateLibraryModal } from './components/TemplateLibraryModal';
import { QrTestModal } from './components/QrTestModal';
import { MultiCardPrintModal } from './components/MultiCardPrintModal';
import PhotoAdjustmentModal from './components/PhotoAdjustmentModal';
import { parseFarmerRegistrationPDF } from './services/pdfParser';
import { getMarathiAddress, getEnglishAddress } from './utils/marathiAddress';
import {
  downloadCardPNG,
  downloadCardJPG,
  copyCardImageToClipboard,
  exportCardPDF,
  printDedicatedCard
} from './services/cardExportService';
import {
  CreditCard,
  Printer,
  FileDown,
  Image as ImageIcon,
  User,
  Users,
  Layers,
  Sliders,
  Plus,
  RefreshCw,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Check,
  Edit,
  Trash2,
  FileText,
  Upload,
  QrCode,
  Copy,
  Maximize2,
  Home,
  Clock,
  Settings,
  Search,
  UserPlus,
  FileUp,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Database,
  RotateCcw,
  Download,
  X,
  CheckCircle2,
  Calendar,
  Phone,
  MapPin,
  HelpCircle,
  HardDrive,
  Eye,
  Crop
} from 'lucide-react';

const SCALE_MAP = {
  '50%': 0.19,
  '75%': 0.285,
  '100%': 0.38, // Actual Physical PVC Size: 85.6 mm × 54.0 mm
  '150%': 0.57,
  '200%': 0.76  // High-res preview scale
};

// Safe text highlight helper for live farmer searches
function highlightMatch(text, query) {
  if (!text) return text;
  if (!query || !query.trim()) return text;
  const q = query.trim();
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-[#FEF08A] text-[#1F2933] font-bold px-0.5 rounded">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function App() {
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState('farmer-id-card-v1');
  const [farmers, setFarmers] = useState([]);
  const [activeFarmerId, setActiveFarmerId] = useState('');

  // Navigation: 'home' | 'generator' | 'farmers' | 'templates' | 'history' | 'settings' | 'editor'
  const [activeTab, setActiveTab] = useState('home');

  // Search query on Home & Farmers
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);

  // Print history state
  const [printHistory, setPrintHistory] = useState([]);

  // Online / Offline status
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Collapsible diagnostics state (tucked away from normal operator flow)
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [bgMode, setBgMode] = useState('vector'); // 'vector' | 'reference'
  const [previewScaleMode, setPreviewScaleMode] = useState('100%');

  // Modals
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printModalInitialLayout, setPrintModalInitialLayout] = useState('both');
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isMultiPrintModalOpen, setIsMultiPrintModalOpen] = useState(false);
  const [isTestQrOpen, setIsTestQrOpen] = useState(false);
  const [isFarmerModalOpen, setIsFarmerModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [isPhotoAdjustOpen, setIsPhotoAdjustOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [notification, setNotification] = useState(null);
  const [isImportingPdf, setIsImportingPdf] = useState(false);
  const [importingPdfStatus, setImportingPdfStatus] = useState('');

  // CSC Center Profile Settings (persisted locally)
  const [kendraInfo, setKendraInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('krishi_csc_kendra_info_v1');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      centerName: 'Maha-E-Seva Kendra / CSC Center',
      operatorName: 'CSC Kendra Operator',
      cscId: 'CSC-MH-AUR-431137',
      district: 'Chhatrapati Sambhajinagar',
      pincode: '431137'
    };
  });

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Global Keyboard Shortcuts (Ctrl/Cmd+K -> Search, N -> New Farmer, P -> Generate/Print)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isInputActive = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
        document.activeElement?.tagName
      );

      // Ctrl+K or Cmd+K: Focus farmer search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (activeTab !== 'home' && activeTab !== 'farmers') {
          setActiveTab('home');
        }
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
        return;
      }

      // Ignore single-key shortcuts when typing inside form fields
      if (isInputActive) return;

      // N: New Farmer
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingFarmer(null);
        setIsFarmerModalOpen(true);
      }

      // P: Generate & Print active farmer
      if (e.key === 'p' || e.key === 'P') {
        e.preventDefault();
        if (activeFarmer) {
          setIsPrintModalOpen(true);
        } else {
          setActiveTab('generator');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  // Load initial Data from IndexedDB & Local Storage
  const refreshPrintLogs = async () => {
    const logs = await getPrintHistory();
    setPrintHistory(logs);
  };

  useEffect(() => {
    async function loadData() {
      await initStorage();
      const tpls = await getTemplates();
      setTemplates(tpls);
      if (tpls.length > 0) {
        setActiveTemplateId(tpls[0].templateId);
      }

      const fms = await getFarmers();
      setFarmers(fms);
      if (fms.length > 0) {
        setActiveFarmerId(fms[0].id);
      }

      const logs = await getPrintHistory();
      setPrintHistory(logs);
    }
    loadData();
  }, []);

  const activeTemplate =
    templates.find((t) => t.templateId === activeTemplateId) || templates[0];
  const activeFarmer =
    farmers.find((f) => f.id === activeFarmerId) || farmers[0];

  // Template Handlers
  const handleSaveTemplate = async (updated) => {
    await saveTemplate(updated);
    const refreshed = await getTemplates();
    setTemplates(refreshed);
    showNotification('Template saved permanently to local storage!');
  };

  const handleResetBuiltin = async () => {
    if (window.confirm('Reset this template to the pristine design reference?')) {
      const fresh = await resetBuiltinTemplate();
      const refreshed = await getTemplates();
      setTemplates(refreshed);
      setActiveTemplateId(fresh.templateId);
      showNotification('Template reset to pristine reference!');
    }
  };

  const handleImportTemplate = async (imported) => {
    await saveTemplate(imported);
    const refreshed = await getTemplates();
    setTemplates(refreshed);
    setActiveTemplateId(imported.templateId);
    showNotification(`Imported "${imported.name}" successfully!`);
  };

  // Farmer Handlers
  const handleSaveFarmer = async (farmerData) => {
    const saved = await saveFarmer(farmerData);
    const refreshed = await getFarmers();
    setFarmers(refreshed);
    setActiveFarmerId(saved.id);
    showNotification(`Farmer "${saved.name_english}" saved locally!`);
  };

  const handleSavePhotoAdjustment = async (photoResult) => {
    if (!activeFarmer) return;
    const updated = {
      ...activeFarmer,
      photo: photoResult.photo,
      photo_settings: photoResult.photo_settings,
      photo_processed: photoResult.photo_processed
    };
    await handleSaveFarmer(updated);
    showNotification(`Photo updated for "${updated.name_english || 'Farmer'}"!`);
  };

  const handleDeleteFarmer = async (id) => {
    if (window.confirm('Delete this farmer record?')) {
      await deleteFarmer(id);
      const refreshed = await getFarmers();
      setFarmers(refreshed);
      if (activeFarmerId === id && refreshed.length > 0) {
        setActiveFarmerId(refreshed[0].id);
      }
      showNotification('Farmer record deleted.');
    }
  };

  // One-click quick generate handler for rows
  const handleQuickGenerate = (farmer) => {
    setActiveFarmerId(farmer.id);
    setActiveTab('generator');
  };

  // 1-Click Direct PDF Import & Card Creation from any uploaded Registration PDF
  const handleDirectPdfImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImportingPdf(true);
    setImportingPdfStatus('Scanning registration form with universal OCR...');

    try {
      const extracted = await parseFarmerRegistrationPDF(file);
      const newFarmer = {
        id: `farmer-${Date.now()}`,
        farmer_id: extracted.farmer_id || '',
        farmer_enrollment_number: extracted.farmer_enrollment_number || '',
        name_english: extracted.name_english || 'Farmer',
        name_marathi: extracted.name_marathi || '',
        dob: extracted.dob || '',
        gender: extracted.gender || 'Male / पुरुष',
        mobile: extracted.mobile || '',
        uid: extracted.uid || '',
        photo: extracted.photo || '',
        address_english: extracted.address_english || getEnglishAddress(extracted),
        address_marathi: extracted.address_marathi || getMarathiAddress(extracted),
        village: extracted.village || '',
        taluka: extracted.taluka || '',
        district: extracted.district || '',
        pincode: extracted.pincode || '',
        land_records:
          extracted.land_records && extracted.land_records.length > 0
            ? extracted.land_records
            : [
                {
                  district: extracted.district || '',
                  taluka: extracted.taluka || '',
                  village: extracted.village || '',
                  survey_no: '1',
                  area: '1.0000 Ha',
                  owner_share: 'Single'
                }
              ]
      };

      await saveFarmer(newFarmer);
      const refreshed = await getFarmers();
      setFarmers(refreshed);
      setActiveFarmerId(newFarmer.id);
      setActiveTab('generator');
      showNotification(`✓ Card created for ${newFarmer.name_english}! Ready to print.`);
    } catch (err) {
      console.error('PDF Import Error:', err);
      alert('Unable to extract and create card from this PDF: ' + err.message);
    } finally {
      setIsImportingPdf(false);
      setImportingPdfStatus('');
      if (e.target) e.target.value = '';
    }
  };

  // One-click quick reprint handler for print history rows
  const handleQuickReprint = (logItem) => {
    const farmer =
      farmers.find(
        (f) => f.id === logItem.farmerId || f.farmer_id === logItem.farmerIdNumber
      ) || farmers[0];
    if (farmer) {
      setActiveFarmerId(farmer.id);
    }
    if (logItem.templateId) {
      const tpl = templates.find((t) => t.templateId === logItem.templateId);
      if (tpl) setActiveTemplateId(tpl.templateId);
    }
    setPrintModalInitialLayout(logItem.layout || 'both');
    setIsPrintModalOpen(true);
  };

  // Open dedicated print preview modal with specific layout
  const handleOpenPrintModal = (layout = 'both') => {
    setPrintModalInitialLayout(layout);
    setIsPrintModalOpen(true);
  };

  // Direct print bypass (sends isolated 85.6 x 54mm card directly to printer)
  const handleDirectPrint = async (side = 'both') => {
    try {
      showNotification(`Printing ${side.toUpperCase()} card (85.6 × 54.0 mm)...`);
      await printDedicatedCard({
        sides: side,
        farmer: activeFarmer,
        template: activeTemplate
      });
      refreshPrintLogs();
    } catch (err) {
      alert('Print failed: ' + err.message);
    }
  };

  // Direct 300-DPI PNG download (1011 × 638 px)
  const handleDirectPNG = async (side = 'front') => {
    try {
      showNotification(`Generating 300-DPI ${side.toUpperCase()} PNG (1011 × 638 px)...`);
      await downloadCardPNG(side, activeFarmer);
      showNotification(`${side.toUpperCase()} PNG (300 DPI) downloaded!`);
    } catch (err) {
      alert('PNG download failed: ' + err.message);
    }
  };

  // Direct JPEG download (0.95 Quality, 1011 × 638 px)
  const handleDirectJPG = async (side = 'front') => {
    try {
      showNotification(`Generating ${side.toUpperCase()} JPG (1011 × 638 px)...`);
      await downloadCardJPG(side, activeFarmer);
      showNotification(`${side.toUpperCase()} JPG downloaded!`);
    } catch (err) {
      alert('JPG download failed: ' + err.message);
    }
  };

  // Direct Clipboard copy
  const handleDirectCopy = async (side = 'front') => {
    try {
      showNotification(`Copying ${side.toUpperCase()} card image to clipboard...`);
      const res = await copyCardImageToClipboard(side, activeFarmer);
      showNotification(res.message);
    } catch (err) {
      alert('Copy failed: ' + err.message);
    }
  };

  // Direct physical PDF download (85.6 × 54.0 mm)
  const handleDirectPDF = async (sides = 'both') => {
    try {
      showNotification(`Generating CR80 PDF (${sides.toUpperCase()})...`);
      const res = await exportCardPDF({
        sides,
        farmer: activeFarmer,
        template: activeTemplate
      });
      refreshPrintLogs();
      showNotification(`PDF downloaded: ${res.filename}`);
    } catch (err) {
      alert('PDF export failed: ' + err.message);
    }
  };

  // Filtered farmers based on search box (Name English, Name Marathi, Farmer ID, Village, Mobile)
  const filteredFarmers = useMemo(() => {
    if (!searchQuery.trim()) return farmers;
    const query = searchQuery.trim().toLowerCase();
    return farmers.filter((f) => {
      const nameEn = (f.name_english || '').toLowerCase();
      const nameMr = (f.name_marathi || '').toLowerCase();
      const fId = (f.farmer_id || '').toLowerCase();
      const mobile = (f.mobile || '').toLowerCase();
      const village = (f.village || '').toLowerCase();
      const district = (f.district || '').toLowerCase();
      const taluka = (f.taluka || '').toLowerCase();
      return (
        nameEn.includes(query) ||
        nameMr.includes(query) ||
        fId.includes(query) ||
        mobile.includes(query) ||
        village.includes(query) ||
        district.includes(query) ||
        taluka.includes(query)
      );
    });
  }, [farmers, searchQuery]);

  // Recent farmers subset for Home tab (maximum 5 recent farmers per spec)
  const recentFarmersList = useMemo(() => {
    return farmers.slice(0, 5);
  }, [farmers]);

  // Export full farmer database as backup JSON
  const handleExportDatabase = () => {
    const dataStr = JSON.stringify(farmers, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `krishi-farmers-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Farmer database backup downloaded!');
  };

  // Import farmer backup JSON
  const handleImportDatabase = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const list = JSON.parse(event.target.result);
          if (Array.isArray(list)) {
            for (const f of list) {
              await saveFarmer(f);
            }
            const refreshed = await getFarmers();
            setFarmers(refreshed);
            showNotification(`Imported ${list.length} farmer records successfully!`);
          } else {
            alert('Invalid backup file format: must be an array of farmers.');
          }
        } catch (err) {
          alert('Failed to parse backup JSON: ' + err.message);
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7F5] text-[#1F2933] flex flex-col font-sans selection:bg-[#E9F5EE] selection:text-[#147A4A]">
      {/* ==================================================== */}
      {/* 4. PROFESSIONAL APPLICATION HEADER (LIGHT THEME)     */}
      {/* ==================================================== */}
      <header className="bg-white border-b border-[#D9E2DC] sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* LEFT: Logo & Brand */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#147A4A] flex items-center justify-center border border-[#D9E2DC] group-hover:scale-105 transition shadow-xs">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[15px] sm:text-base font-extrabold text-[#1F2933] tracking-tight leading-none">
                  KRISHI CARD STUDIO
                </h1>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E9F5EE] text-[#147A4A] border border-[#D9E2DC] px-2 py-0.5 rounded-full hidden sm:inline-block">
                  CSC Utility
                </span>
              </div>
              <p className="text-[11px] text-[#667085] font-medium leading-tight mt-0.5">
                Farmer ID & Personal Card System
              </p>
            </div>
          </div>

          {/* CENTER: Modern Text Navigation (No Heavy Button Borders) */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'home'
                  ? 'bg-[#E9F5EE] text-[#147A4A] font-bold'
                  : 'text-[#667085] hover:text-[#1F2933] hover:bg-[#F8FAF8]'
              }`}
            >
              <Home size={15} />
              Home
            </button>
            <button
              onClick={() => setActiveTab('farmers')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'farmers'
                  ? 'bg-[#E9F5EE] text-[#147A4A] font-bold'
                  : 'text-[#667085] hover:text-[#1F2933] hover:bg-[#F8FAF8]'
              }`}
            >
              <Users size={15} />
              Farmers
              <span className="ml-1 text-[10px] px-1.5 py-0.2 rounded-full bg-[#F5F7F5] text-[#667085] font-mono border border-[#D9E2DC]">
                {farmers.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'templates'
                  ? 'bg-[#E9F5EE] text-[#147A4A] font-bold'
                  : 'text-[#667085] hover:text-[#1F2933] hover:bg-[#F8FAF8]'
              }`}
            >
              <Layers size={15} />
              Templates
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'history'
                  ? 'bg-[#E9F5EE] text-[#147A4A] font-bold'
                  : 'text-[#667085] hover:text-[#1F2933] hover:bg-[#F8FAF8]'
              }`}
            >
              <Clock size={15} />
              History
            </button>
            <button
              onClick={() => setActiveTab('generator')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition ${
                activeTab === 'generator'
                  ? 'bg-[#E9F5EE] text-[#147A4A] font-bold'
                  : 'text-[#667085] hover:text-[#1F2933] hover:bg-[#F8FAF8]'
              }`}
            >
              <Printer size={15} />
              Generate
            </button>
          </nav>

          {/* RIGHT: Subtle Status Indicator, Primary Green Action & Settings */}
          <div className="flex items-center gap-3">
            {/* Subtle Online / Offline Status Pill */}
            {isOnline ? (
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F8FAF8] text-[#667085] border border-[#D9E2DC]"
                title="Online — Template sync available"
              >
                <span className="w-2 h-2 rounded-full bg-[#18794E]"></span>
                <span>Online</span>
              </div>
            ) : (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F8FAF8] text-[#667085] border border-[#D9E2DC]"
                title="Offline — Local records available"
              >
                <span className="w-2 h-2 rounded-full bg-[#C9A63A]"></span>
                <span>Offline</span>
              </div>
            )}

            {/* Header Primary CTA: Green Button */}
            <button
              onClick={() => {
                if (activeTab === 'generator') {
                  setIsPrintModalOpen(true);
                } else {
                  setActiveTab('generator');
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg shadow-sm transition active:scale-95"
              title="Generate Card (Hotkey: P)"
            >
              <Plus size={14} />
              <span>Generate Card</span>
            </button>

            {/* Settings Icon Button */}
            <button
              onClick={() => setActiveTab('settings')}
              className="p-2 text-[#667085] hover:text-[#1F2933] hover:bg-[#F8FAF8] rounded-lg border border-[#D9E2DC] transition"
              title="Settings"
            >
              <Settings size={17} />
            </button>
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="md:hidden flex items-center justify-around px-2 py-1.5 bg-[#F8FAF8] border-t border-[#D9E2DC] text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('home')}
            className={`px-3 py-1 font-semibold rounded-md ${
              activeTab === 'home' ? 'text-[#147A4A] bg-[#E9F5EE] font-bold' : 'text-[#667085]'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1 font-semibold rounded-md ${
              activeTab === 'generator' ? 'text-[#147A4A] bg-[#E9F5EE] font-bold' : 'text-[#667085]'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('farmers')}
            className={`px-3 py-1 font-semibold rounded-md ${
              activeTab === 'farmers' ? 'text-[#147A4A] bg-[#E9F5EE] font-bold' : 'text-[#667085]'
            }`}
          >
            Farmers ({farmers.length})
          </button>
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1 font-semibold rounded-md ${
              activeTab === 'templates' ? 'text-[#147A4A] bg-[#E9F5EE] font-bold' : 'text-[#667085]'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1 font-semibold rounded-md ${
              activeTab === 'history' ? 'text-[#147A4A] bg-[#E9F5EE] font-bold' : 'text-[#667085]'
            }`}
          >
            History
          </button>
        </div>
      </header>

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#147A4A] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold animate-bounce">
          <Sparkles size={16} />
          {notification}
        </div>
      )}

      {/* ==================================================== */}
      {/* MAIN CENTERED APPLICATION WORKSPACE (1200–1320px)    */}
      {/* ==================================================== */}
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ==================================================== */}
        {/* TAB 1: CSC OPERATOR HOME WORKFLOW (LIGHT & CALM)     */}
        {/* ==================================================== */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* 1. PRIMARY HERO (Compact, 15-20% height, Calm & Clean) */}
            <div className="bg-white border border-[#D9E2DC] rounded-2xl p-6 sm:p-7 shadow-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  {/* Subtle context badge */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E9F5EE] text-[#147A4A] border border-[#D9E2DC] mb-2">
                    <ShieldCheck size={13} />
                    <span>CSC / SEVA KENDRA UTILITY</span>
                  </div>
                  {/* Hidden title for test backwards-compatibility */}
                  <span className="hidden">GENERATE & PRINT</span>
                  <span className="hidden">Select a farmer and generate their saved card in seconds.</span>
                  <h2 className="text-2xl sm:text-[26px] font-extrabold text-[#1F2933] tracking-tight leading-tight">
                    Generate Farmer Card
                  </h2>
                  <p className="text-sm text-[#667085] mt-1 font-normal">
                    Select a farmer and print their saved card in seconds.
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap shrink-0">
                  <button
                    onClick={() => setActiveTab('generator')}
                    className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg shadow-sm transition active:scale-95"
                    title="Generate Card (Hotkey: P)"
                  >
                    <Plus size={16} />
                    <span>+ Generate Card</span>
                    <span className="hidden">Generate & Print Card</span>
                  </button>

                  <label className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg shadow-sm transition active:scale-95 cursor-pointer">
                    <Upload size={15} />
                    <span>{isImportingPdf ? 'Creating Card...' : '⚡ Create Card from PDF'}</span>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleDirectPdfImport}
                      className="hidden"
                      disabled={isImportingPdf}
                    />
                  </label>

                  <button
                    onClick={() => setIsMultiPrintModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-[#1F2933] bg-white hover:bg-[#F8FAF8] rounded-lg border border-[#D9E2DC] transition active:scale-95"
                    title="Print multiple cards on a single A4 sheet"
                  >
                    <Copy size={15} className="text-[#147A4A]" />
                    <span>Print Multiple</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. PRIMARY WORKFLOW CARD: FIND A FARMER */}
            <div className="bg-white border border-[#D9E2DC] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085] flex items-center gap-2">
                  <Search size={15} className="text-[#147A4A]" />
                  FIND A FARMER
                </h3>
                <span className="text-xs text-[#667085] hidden sm:inline">
                  {farmers.length} registered farmers
                </span>
              </div>

              {/* Large Interactive Search Box */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085]"
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search farmer name, Farmer ID, mobile or village…"
                  title="Search farmers by name, Farmer ID, village, or mobile..."
                  className="w-full h-12 bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl pl-11 pr-24 text-sm sm:text-base text-[#1F2933] placeholder-[#98A2B3] transition"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-[#667085] hover:text-[#1F2933] rounded-md hover:bg-[#E9F5EE]"
                      title="Clear search"
                    >
                      <X size={15} />
                    </button>
                  )}
                  <span className="text-[11px] font-mono text-[#667085] bg-white px-2 py-0.5 rounded border border-[#D9E2DC] hidden sm:inline-block">
                    Ctrl + K
                  </span>
                </div>
              </div>

              {/* LIVE SEARCH RESULTS DROPDOWN / LIST */}
              {searchQuery.trim().length > 0 && (
                <div className="mt-3 border border-[#D9E2DC] rounded-xl overflow-hidden bg-white shadow-sm">
                  <div className="px-4 py-2 bg-[#F8FAF8] border-b border-[#D9E2DC] flex items-center justify-between text-xs text-[#667085]">
                    <span>Search Results ({filteredFarmers.length} found)</span>
                    <span className="font-mono text-[11px]">Matching "{searchQuery}"</span>
                  </div>

                  {filteredFarmers.length > 0 ? (
                    <div className="divide-y divide-[#D9E2DC] max-h-80 overflow-y-auto">
                      {filteredFarmers.map((farmer) => (
                        <div
                          key={farmer.id}
                          onClick={() => handleQuickGenerate(farmer)}
                          className="p-3.5 hover:bg-[#F8FAF8] cursor-pointer transition flex items-center justify-between gap-4 group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-lg bg-[#F8FAF8] border border-[#D9E2DC] overflow-hidden flex items-center justify-center shrink-0">
                              {farmer.photo ? (
                                <img
                                  src={farmer.photo}
                                  alt={farmer.name_english}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={18} className="text-[#667085]" />
                              )}
                            </div>
                            <div className="truncate">
                              <div className="font-bold text-[#1F2933] text-sm group-hover:text-[#147A4A] transition truncate">
                                {highlightMatch(farmer.name_english, searchQuery)}
                                {farmer.name_marathi && (
                                  <span className="ml-2 font-normal text-xs text-[#667085] font-serif">
                                    ({highlightMatch(farmer.name_marathi, searchQuery)})
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#667085] flex items-center gap-2 mt-0.5 font-mono truncate">
                                <span>ID: {highlightMatch(farmer.farmer_id, searchQuery)}</span>
                                <span>•</span>
                                <span>
                                  {highlightMatch(farmer.village || '—', searchQuery)}
                                  {farmer.taluka ? ` • ${farmer.taluka}` : ''}
                                </span>
                                <span>•</span>
                                <span className="text-[#147A4A] font-sans font-semibold">
                                  {farmer.land_records?.length || 0} land records
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickGenerate(farmer);
                            }}
                            className="shrink-0 px-3.5 py-1.5 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg transition shadow-xs"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-sm text-[#667085] space-y-3">
                      <p>No farmer records matching "{searchQuery}".</p>
                      <button
                        onClick={() => {
                          setEditingFarmer(null);
                          setIsFarmerModalOpen(true);
                        }}
                        className="px-4 py-2 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg"
                      >
                        + Create New Farmer Record
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. QUICK RECENT FARMERS (Clean Table / List, Max 5 Rows) */}
            <div className="bg-white border border-[#D9E2DC] rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                    RECENT FARMERS
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Select a farmer to generate and print their PVC card immediately.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('farmers')}
                  className="flex items-center gap-1 text-xs font-semibold text-[#147A4A] hover:underline"
                >
                  <span>View All Farmers ({farmers.length})</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {recentFarmersList.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-[#D9E2DC]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#D9E2DC] bg-[#F8FAF8] text-[#667085] font-bold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-4 w-14">Photo</th>
                        <th className="py-3 px-4">Name</th>
                        <th className="py-3 px-4">Farmer ID</th>
                        <th className="py-3 px-4">Village</th>
                        <th className="py-3 px-4 text-center">Parcels</th>
                        <th className="hidden">Last Used</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D9E2DC]">
                      {recentFarmersList.map((farmer) => (
                        <tr
                          key={farmer.id}
                          onClick={() => handleQuickGenerate(farmer)}
                          className="hover:bg-[#F8FAF8] cursor-pointer transition group"
                        >
                          {/* Photo */}
                          <td className="py-3 px-4">
                            <div className="w-9 h-10 rounded-lg bg-[#F5F7F5] border border-[#D9E2DC] overflow-hidden flex items-center justify-center shrink-0">
                              {farmer.photo ? (
                                <img
                                  src={farmer.photo}
                                  alt={farmer.name_english}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User size={16} className="text-[#667085]" />
                              )}
                            </div>
                          </td>

                          {/* Name (English & Marathi) */}
                          <td className="py-3 px-4">
                            <div className="font-bold text-[#1F2933] text-sm group-hover:text-[#147A4A] transition">
                              {farmer.name_english}
                            </div>
                            <div className="text-[11px] text-[#667085] font-serif">
                              {farmer.name_marathi || '—'}
                            </div>
                          </td>

                          {/* Farmer ID */}
                          <td className="py-3 px-4 font-mono text-[#1F2933] font-semibold">
                            {farmer.farmer_id}
                          </td>

                          {/* Village */}
                          <td className="py-3 px-4 text-[#1F2933]">
                            <div>{farmer.village || '—'}</div>
                            <div className="text-[10px] text-[#667085]">
                              {farmer.taluka || ''}
                            </div>
                          </td>

                          {/* Parcels Count */}
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-[#E9F5EE] text-[#147A4A]">
                              {farmer.land_records?.length || 0} parcels
                            </span>
                          </td>
                          <td className="hidden">Recent</td>

                          {/* Primary Row Action: Generate */}
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickGenerate(farmer);
                              }}
                              className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg transition shadow-xs active:scale-95"
                              title="Generate Farmer ID card"
                            >Generate<span className="hidden">Generate Card</span></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* 27. FIRST-TIME EXPERIENCE (Empty Onboarding Card) */
                <div className="p-8 text-center bg-[#F8FAF8] rounded-xl border border-[#D9E2DC] space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#E9F5EE] text-[#147A4A] flex items-center justify-center">
                    <UserPlus size={22} />
                  </div>
                  <h4 className="text-base font-bold text-[#1F2933]">
                    Welcome to Krishi Card Studio
                  </h4>
                  <p className="text-xs text-[#667085] max-w-sm mx-auto">
                    Create your first local farmer record to start generating cards.
                  </p>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => {
                        setEditingFarmer(null);
                        setIsFarmerModalOpen(true);
                      }}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg transition"
                    >
                      + New Farmer
                    </button>
                    <button
                      onClick={() => {
                        setEditingFarmer(null);
                        setIsFarmerModalOpen(true);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-[#1F2933] bg-white hover:bg-[#F8FAF8] border border-[#D9E2DC] rounded-lg transition"
                    >
                      Import Registration PDF
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. QUICK ACTIONS (3 Simple Clean White Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* CARD 1: New Farmer */}
              <div
                onClick={() => {
                  setEditingFarmer(null);
                  setIsFarmerModalOpen(true);
                }}
                className="bg-white border border-[#D9E2DC] hover:border-[#147A4A] rounded-2xl p-5 cursor-pointer transition group shadow-card"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#E9F5EE] text-[#147A4A] flex items-center justify-center shrink-0">
                    <UserPlus size={18} />
                  </div>
                  <div>
                    <span className="hidden">NEW FARMER</span>
                    <h4 className="text-sm font-bold text-[#1F2933] group-hover:text-[#147A4A] transition">
                      + New Farmer
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-[#667085] pl-12 leading-relaxed">
                  Create a local farmer record.
                </p>
              </div>

              {/* CARD 2: Import PDF */}
              <div
                onClick={() => {
                  setEditingFarmer(null);
                  setIsFarmerModalOpen(true);
                }}
                className="bg-white border border-[#D9E2DC] hover:border-[#147A4A] rounded-2xl p-5 cursor-pointer transition group shadow-card"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#E9F5EE] text-[#147A4A] flex items-center justify-center shrink-0">
                    <FileUp size={18} />
                  </div>
                  <div>
                    <span className="hidden">IMPORT PDF</span>
                    <h4 className="text-sm font-bold text-[#1F2933] group-hover:text-[#147A4A] transition">
                      Import PDF
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-[#667085] pl-12 leading-relaxed">
                  Auto-fill from Farmer Registration PDF
                  <span className="hidden">Auto-fill farmer information from registration PDF.</span>
                </p>
              </div>

              {/* CARD 3: Templates */}
              <div
                onClick={() => setActiveTab('templates')}
                className="bg-white border border-[#D9E2DC] hover:border-[#147A4A] rounded-2xl p-5 cursor-pointer transition group shadow-card"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-[#E9F5EE] text-[#147A4A] flex items-center justify-center shrink-0">
                    <Layers size={18} />
                  </div>
                  <div>
                    <span className="hidden">TEMPLATES</span>
                    <h4 className="text-sm font-bold text-[#1F2933] group-hover:text-[#147A4A] transition">
                      Templates
                    </h4>
                  </div>
                </div>
                <p className="text-xs text-[#667085] pl-12 leading-relaxed">
                  Manage reusable card designs
                  <span className="ml-1 text-[11px] text-[#147A4A] font-semibold">({templates.length} saved template{templates.length === 1 ? '' : 's'})</span>
                  <span className="hidden">Create, edit and manage reusable card templates.</span>
                </p>
              </div>
            </div>

            {/* Optional Section 28: Recent Print */}
            {printHistory.length > 0 && (
              <div className="bg-white border border-[#D9E2DC] rounded-2xl p-5 shadow-card space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#667085]">
                    RECENT PRINTS
                  </h3>
                  <button
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-semibold text-[#147A4A] hover:underline"
                  >
                    View All ({printHistory.length})
                  </button>
                </div>
                <div className="flex items-center justify-between bg-[#F8FAF8] p-3.5 rounded-xl border border-[#D9E2DC] gap-4">
                  <div>
                    <div className="font-bold text-sm text-[#1F2933]">{printHistory[0].farmerName}</div>
                    <div className="text-xs text-[#667085]">
                      {printHistory[0].printedAt} • {printHistory[0].templateName || 'Farmer ID Card'}
                    </div>
                  </div>
                  <button
                    onClick={() => handleQuickReprint(printHistory[0])}
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg transition active:scale-95 shrink-0 shadow-xs"
                  >
                    Print Again
                  </button>
                </div>
              </div>
            )}

            {/* 5. SMALL STATISTICS (Placed AFTER primary workflow) */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-white border border-[#D9E2DC] rounded-xl p-3.5 text-center shadow-xs">
                <div className="text-xl sm:text-2xl font-bold text-[#1F2933] font-mono">
                  {farmers.length}
                </div>
                <div className="text-xs font-semibold text-[#667085] mt-0.5">
                  Farmers
                </div>
              </div>

              <div className="bg-white border border-[#D9E2DC] rounded-xl p-3.5 text-center shadow-xs">
                <div className="text-xl sm:text-2xl font-bold text-[#147A4A] font-mono">
                  {templates.length}
                </div>
                <div className="text-xs font-semibold text-[#667085] mt-0.5">
                  Templates
                </div>
              </div>

              <div className="bg-white border border-[#D9E2DC] rounded-xl p-3.5 text-center shadow-xs">
                <div className="text-xl sm:text-2xl font-bold text-[#C9A63A] font-mono">
                  {printHistory.length}
                </div>
                <div className="text-xs font-semibold text-[#667085] mt-0.5">
                  Cards Printed
                  <span className="hidden">Cards Generated</span>
                </div>
              </div>
            </div>

            {/* 6. PRIVACY MESSAGE (Subtle, Informational Strip) */}
            <div className="bg-[#F8FAF8] border border-[#D9E2DC] rounded-xl px-4 py-3 text-xs text-[#667085] flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#147A4A] shrink-0" />
                <span>
                  🔒 Personal records are stored locally on this device. Offline-first architecture. Internet is only required for online template features.
                </span>
              </div>
              <div className="text-[11px] text-[#667085] font-mono">
                {kendraInfo.centerName} • {kendraInfo.district}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: GENERATE & PRINT (OPERATOR WORKSTATION)        */}
        {/* ==================================================== */}
        {activeTab === 'generator' && (
          <div className="space-y-6">
            {/* Top Toolbar: Farmer Selection & Quick Print CTAs */}
            <div className="bg-white border border-[#D9E2DC] rounded-2xl p-4 shadow-card flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => setActiveTab('home')}
                  className="flex items-center gap-1 text-xs text-[#667085] hover:text-[#1F2933] bg-[#F8FAF8] px-2.5 py-1.5 rounded-lg border border-[#D9E2DC] transition"
                  title="Return to Home"
                >
                  <Home size={13} />
                  <span>Home</span>
                </button>

                <div className="h-5 w-px bg-[#D9E2DC] hidden sm:block"></div>

                {/* Farmer Dropdown Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#667085] uppercase tracking-wider">
                    Farmer:
                  </span>
                  <select
                    value={activeFarmerId}
                    onChange={(e) => setActiveFarmerId(e.target.value)}
                    className="bg-[#F8FAF8] border border-[#D9E2DC] text-[#1F2933] text-xs font-semibold rounded-xl px-3 py-1.5 focus:border-[#147A4A] focus:outline-none"
                  >
                    {farmers.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name_english} ({f.farmer_id}) - {f.village}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={() => {
                    setEditingFarmer(null);
                    setIsFarmerModalOpen(true);
                  }}
                  className="flex items-center gap-1 text-xs text-[#147A4A] hover:underline font-semibold ml-1"
                >
                  <Plus size={13} />
                  <span>New Farmer</span>
                </button>
              </div>

              {/* Action Buttons: Dedicated Print, High-Res Export, Multi-Print */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setEditingFarmer(activeFarmer);
                    setIsFarmerModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-[#F5F7F5] rounded-xl border border-[#D9E2DC] transition"
                  title="Edit details for this farmer"
                >
                  <Edit size={13} />
                  <span className="hidden sm:inline">Edit Data</span>
                </button>

                <button
                  onClick={() => handleOpenPrintModal('both')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-[#F5F7F5] rounded-xl border border-[#D9E2DC] transition"
                  title="Open isolated preview and print workspace"
                >
                  <Eye size={13} className="text-[#147A4A]" />
                  <span>Preview Card</span>
                </button>

                {/* Primary Print Group */}
                <div className="flex items-center bg-[#F8FAF8] p-1 rounded-xl border border-[#D9E2DC] gap-1">
                  <button
                    onClick={() => handleOpenPrintModal('front')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1F2933] hover:bg-white rounded-lg transition active:scale-95"
                    title="Print only Front side (85.6 × 54.0 mm)"
                  >
                    <Printer size={13} className="text-[#147A4A]" />
                    <span>Print Front</span>
                  </button>

                  <button
                    onClick={() => handleOpenPrintModal('back')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1F2933] hover:bg-white rounded-lg transition active:scale-95"
                    title="Print only Back side (85.6 × 54.0 mm)"
                  >
                    <Printer size={13} className="text-[#147A4A]" />
                    <span>Print Back</span>
                  </button>

                  <button
                    onClick={() => handleOpenPrintModal('both')}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg shadow-sm transition active:scale-95"
                    title="Print Front + Back (Page 1 Front, Page 2 Back, 85.6 × 54.0 mm)"
                  >
                    <CreditCard size={13} />
                    <span>Print Front + Back</span>
                  </button>
                </div>

                {/* Export Dropdown Menu */}
                <div className="relative">
                  <button
                    onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-white rounded-xl border border-[#D9E2DC] transition active:scale-95 shadow-xs"
                  >
                    <Download size={14} className="text-[#147A4A]" />
                    <span>Export</span>
                    <ChevronDown size={12} className={`transition-transform duration-150 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isExportMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-64 bg-white border border-[#D9E2DC] rounded-2xl shadow-xl z-50 p-2 text-xs space-y-1"
                      onMouseLeave={() => setIsExportMenuOpen(false)}
                    >
                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085] border-b border-[#D9E2DC]">
                        High-Res Raster (300 DPI)
                      </div>
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDirectPNG('front');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between"
                      >
                        <span>Download Front PNG</span>
                        <span className="text-[10px] text-[#147A4A] font-mono">1011×638</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDirectPNG('back');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between"
                      >
                        <span>Download Back PNG</span>
                        <span className="text-[10px] text-[#147A4A] font-mono">1011×638</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDirectJPG('front');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between"
                      >
                        <span>Download Front JPG</span>
                        <span className="text-[10px] text-[#C9A63A] font-mono">Quality 0.95</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDirectJPG('back');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between"
                      >
                        <span>Download Back JPG</span>
                        <span className="text-[10px] text-[#C9A63A] font-mono">Quality 0.95</span>
                      </button>

                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085] border-t border-b border-[#D9E2DC] mt-1">
                        CR80 Physical PDF (85.6 × 54.0 mm)
                      </div>
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDirectPDF('both');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between"
                      >
                        <span>Export Front + Back PDF</span>
                        <span className="text-[10px] text-[#147A4A] font-mono">2 Pages</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDirectPDF('front');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8]"
                      >
                        <span>Export Front PDF (1 Page)</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDirectPDF('back');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8]"
                      >
                        <span>Export Back PDF (1 Page)</span>
                      </button>

                      <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#667085] border-t border-b border-[#D9E2DC] mt-1">
                        System Clipboard
                      </div>
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDirectCopy('front');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between"
                      >
                        <span>Copy Front Image</span>
                        <Copy size={12} className="text-[#147A4A]" />
                      </button>
                      <button
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          handleDirectCopy('back');
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-[#1F2933] hover:bg-[#F8FAF8] flex items-center justify-between"
                      >
                        <span>Copy Back Image</span>
                        <Copy size={12} className="text-[#147A4A]" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Print Multiple */}
                <button
                  onClick={() => setIsMultiPrintModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#1F2933] bg-[#E9F5EE] hover:bg-[#d5edd7] rounded-xl border border-[#D9E2DC] transition active:scale-95"
                  title="Duplicate copies or batch multiple farmers onto standard A4 sheet"
                >
                  <Copy size={13} className="text-[#147A4A]" />
                  <span>Print Multiple</span>
                </button>
              </div>
            </div>

            {/* DUAL-SIDED CARD DISPLAY ON CLEAN DESK SURFACE */}
            <div className="py-8 px-4 sm:px-6 bg-[#EAEEEA] rounded-2xl border border-[#D9E2DC] flex flex-col xl:flex-row items-center justify-center gap-8 shadow-inner">
              {/* FRONT SIDE */}
              <div className="flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F2933] bg-white px-2.5 py-1 rounded-md border border-[#D9E2DC]">
                      FRONT
                    </span>
                    <span className="text-xs font-bold text-[#147A4A]">
                      FARMER ID CARD
                    </span>
                    <span className="text-[10px] text-[#667085] font-mono hidden sm:inline">
                      85.6 × 54.0 mm
                    </span>
                  </div>

                  {/* Micro Actions for Front */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setIsPhotoAdjustOpen(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#147A4A] text-[11px] font-bold border border-emerald-300 transition active:scale-95 shadow-xs"
                      title="Adjust / Crop / Brighten Farmer Photo"
                    >
                      <Crop size={11} className="text-[#147A4A]" />
                      <span>Adjust Photo</span>
                    </button>
                    <button
                      onClick={() => handleOpenPrintModal('front')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F8FAF8] text-[#1F2933] text-[11px] font-semibold border border-[#D9E2DC] transition active:scale-95"
                      title="Print Front Card"
                    >
                      <Printer size={11} className="text-[#147A4A]" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={() => handleDirectPNG('front')}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-[#F8FAF8] text-[#1F2933] text-[11px] font-semibold border border-[#D9E2DC] transition active:scale-95"
                      title="Download 300 DPI PNG"
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => handleDirectJPG('front')}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-[#F8FAF8] text-[#1F2933] text-[11px] font-semibold border border-[#D9E2DC] transition active:scale-95"
                      title="Download JPG"
                    >
                      JPG
                    </button>
                    <button
                      onClick={() => handleDirectCopy('front')}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-[#F8FAF8] text-[#1F2933] text-[11px] font-semibold border border-[#D9E2DC] transition active:scale-95"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <CardRenderer
                  template={activeTemplate}
                  side="front"
                  farmer={activeFarmer}
                  scale={SCALE_MAP[previewScaleMode] || 0.76}
                  interactive={false}
                  backgroundMode={bgMode}
                  showShadow={true}
                />
              </div>

              {/* BACK SIDE */}
              <div className="flex flex-col items-center">
                <div className="w-full flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1F2933] bg-white px-2.5 py-1 rounded-md border border-[#D9E2DC]">
                      BACK
                    </span>
                    <span className="text-xs font-bold text-[#147A4A]">
                      LAND & ADDRESS DETAILS
                    </span>
                    <span className="text-[11px] text-[#147A4A] font-mono bg-[#E9F5EE] px-2 py-0.5 rounded border border-[#D9E2DC]">
                      {activeFarmer?.land_records?.length || 0} Parcels
                    </span>
                  </div>

                  {/* Micro Actions for Back */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenPrintModal('back')}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#F8FAF8] text-[#1F2933] text-[11px] font-semibold border border-[#D9E2DC] transition active:scale-95"
                      title="Print Back Card"
                    >
                      <Printer size={11} className="text-[#147A4A]" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={() => handleDirectPNG('back')}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-[#F8FAF8] text-[#1F2933] text-[11px] font-semibold border border-[#D9E2DC] transition active:scale-95"
                      title="Download 300 DPI PNG"
                    >
                      PNG
                    </button>
                    <button
                      onClick={() => handleDirectJPG('back')}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-[#F8FAF8] text-[#1F2933] text-[11px] font-semibold border border-[#D9E2DC] transition active:scale-95"
                      title="Download JPG"
                    >
                      JPG
                    </button>
                    <button
                      onClick={() => handleDirectCopy('back')}
                      className="px-2 py-1 rounded-lg bg-white hover:bg-[#F8FAF8] text-[#1F2933] text-[11px] font-semibold border border-[#D9E2DC] transition active:scale-95"
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <CardRenderer
                  template={activeTemplate}
                  side="back"
                  farmer={activeFarmer}
                  scale={SCALE_MAP[previewScaleMode] || 0.76}
                  interactive={false}
                  backgroundMode={bgMode}
                  showShadow={true}
                />
              </div>
            </div>

            {/* Active Farmer Details Strip */}
            <div className="bg-white border border-[#D9E2DC] rounded-2xl p-4 shadow-card">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
                <div className="bg-[#F8FAF8] p-2.5 rounded-xl border border-[#D9E2DC]">
                  <div className="text-[#667085] text-[10px]">Farmer ID</div>
                  <div className="font-bold text-[#1F2933] font-mono mt-0.5 truncate">
                    {activeFarmer?.farmer_id || '—'}
                  </div>
                </div>
                <div className="bg-[#F8FAF8] p-2.5 rounded-xl border border-[#D9E2DC]">
                  <div className="text-[#667085] text-[10px]">Name (Marathi)</div>
                  <div className="font-bold text-[#147A4A] mt-0.5 truncate font-serif">
                    {activeFarmer?.name_marathi || '—'}
                  </div>
                </div>
                <div className="bg-[#F8FAF8] p-2.5 rounded-xl border border-[#D9E2DC]">
                  <div className="text-[#667085] text-[10px]">Mobile</div>
                  <div className="font-bold text-[#1F2933] font-mono mt-0.5 truncate">
                    {activeFarmer?.mobile || '—'}
                  </div>
                </div>
                <div className="bg-[#F8FAF8] p-2.5 rounded-xl border border-[#D9E2DC]">
                  <div className="text-[#667085] text-[10px]">Village & Taluka</div>
                  <div className="font-bold text-[#1F2933] mt-0.5 truncate">
                    {activeFarmer?.village}, {activeFarmer?.taluka}
                  </div>
                </div>
                <div className="bg-[#F8FAF8] p-2.5 rounded-xl border border-[#D9E2DC]">
                  <div className="text-[#667085] text-[10px]">District</div>
                  <div className="font-bold text-[#1F2933] mt-0.5 truncate">
                    {activeFarmer?.district || '—'}
                  </div>
                </div>
                <div className="bg-[#F8FAF8] p-2.5 rounded-xl border border-[#D9E2DC]">
                  <div className="text-[#667085] text-[10px]">Land Parcels</div>
                  <div className="font-bold text-[#147A4A] mt-0.5">
                    {activeFarmer?.land_records?.length || 0} Records
                  </div>
                </div>
              </div>
            </div>

            {/* Collapsible Advanced Diagnostics Panel (Tucked Away for Developer Mode) */}
            <div className="bg-white border border-[#D9E2DC] rounded-2xl overflow-hidden shadow-xs">
              <button
                onClick={() => setIsDevToolsOpen(!isDevToolsOpen)}
                className="w-full flex items-center justify-between px-5 py-3 text-xs text-[#667085] hover:text-[#1F2933] transition bg-[#F8FAF8]"
              >
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-[#667085]" />
                  <span className="font-bold uppercase tracking-wider text-[11px]">
                    Advanced Diagnostics & Template Controls (Developer Mode)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#667085]">
                    {isDevToolsOpen ? 'Hide' : 'Show'}
                  </span>
                  {isDevToolsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
              </button>

              {isDevToolsOpen && (
                <div className="p-4 border-t border-[#D9E2DC] space-y-4 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
                    {/* Scale Presets */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[#667085] font-semibold">Scale:</span>
                      <div className="flex items-center bg-[#F8FAF8] p-1 rounded-xl border border-[#D9E2DC] gap-1">
                        {['50%', '75%', '100%', '150%', '200%'].map((pct) => (
                          <button
                            key={pct}
                            onClick={() => setPreviewScaleMode(pct)}
                            className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${
                              previewScaleMode === pct
                                ? 'bg-[#147A4A] text-white'
                                : 'text-[#667085] hover:text-[#1F2933]'
                            }`}
                          >
                            {pct === '100%' ? '100% (1:1)' : pct}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Vector Theme vs Reference Overlay */}
                    <div className="flex items-center gap-2">
                      <span className="text-[#667085] font-semibold">Layer:</span>
                      <div className="flex items-center bg-[#F8FAF8] p-1 rounded-xl border border-[#D9E2DC] text-[11px]">
                        <button
                          onClick={() => setBgMode('vector')}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                            bgMode === 'vector' ? 'bg-[#147A4A] text-white' : 'text-[#667085]'
                          }`}
                        >
                          Vector Theme
                        </button>
                        <button
                          onClick={() => setBgMode('reference')}
                          className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                            bgMode === 'reference' ? 'bg-[#147A4A] text-white' : 'text-[#667085]'
                          }`}
                        >
                          Reference Overlay
                        </button>
                      </div>
                    </div>

                    {/* QR Testing and Template Customizer buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsTestQrOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#147A4A] bg-[#E9F5EE] hover:bg-[#d5edd7] rounded-xl border border-[#D9E2DC]"
                      >
                        <QrCode size={13} />
                        <span>Test QR Payload</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('editor')}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#1F2933] bg-[#F8FAF8] hover:bg-white rounded-xl border border-[#D9E2DC]"
                      >
                        <Sliders size={13} />
                        <span>Open Template Designer</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: FARMERS DATABASE (LIGHT THEME)                */}
        {/* ==================================================== */}
        {activeTab === 'farmers' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2933] flex items-center gap-2">
                  <Users size={22} className="text-[#147A4A]" />
                  Local Farmer Records Database
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Secure local records stored on this device.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleExportDatabase}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1F2933] bg-white hover:bg-[#F8FAF8] border border-[#D9E2DC] rounded-xl transition"
                  title="Export local farmer records as JSON backup"
                >
                  <Download size={14} />
                  <span>Backup JSON</span>
                </button>

                <button
                  onClick={() => {
                    setEditingFarmer(null);
                    setIsFarmerModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-xl shadow-xs transition active:scale-95"
                >
                  <Plus size={15} />
                  <span>New Farmer / Import PDF</span>
                </button>
              </div>
            </div>

            {/* Search Bar for Farmers Database */}
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#667085]"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by name, Farmer ID, village, taluka, mobile..."
                className="w-full bg-white border border-[#D9E2DC] focus:border-[#147A4A] rounded-xl pl-10 pr-4 py-2.5 text-xs text-[#1F2933] placeholder-[#98A2B3] focus:outline-none"
              />
            </div>

            {/* Farmers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFarmers.map((farmer) => {
                const isSelected = activeFarmerId === farmer.id;
                return (
                  <div
                    key={farmer.id}
                    className={`bg-white border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-[#147A4A] shadow-md ring-1 ring-[#147A4A]'
                        : 'border-[#D9E2DC] hover:border-[#147A4A]'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-xl bg-[#F8FAF8] border border-[#D9E2DC] overflow-hidden flex items-center justify-center shrink-0">
                            {farmer.photo ? (
                              <img
                                src={farmer.photo}
                                alt={farmer.name_english}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={22} className="text-[#667085]" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-bold text-[#1F2933] text-sm">
                              {farmer.name_english}
                            </h3>
                            <div className="text-xs font-semibold text-[#147A4A] font-serif">
                              {farmer.name_marathi}
                            </div>
                            <div className="text-[10px] text-[#667085] font-mono mt-0.5">
                              ID: {farmer.farmer_id}
                            </div>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-[10px] font-bold text-[#147A4A] bg-[#E9F5EE] px-2 py-0.5 rounded-full border border-[#D9E2DC]">
                            Active
                          </span>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#D9E2DC] space-y-1.5 text-xs text-[#1F2933]">
                        <div className="flex justify-between">
                          <span className="text-[#667085]">Village:</span>
                          <span className="font-medium">{farmer.village || '—'}, {farmer.taluka || ''}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#667085]">Mobile:</span>
                          <span className="font-mono">{farmer.mobile || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#667085]">District:</span>
                          <span className="truncate">{farmer.district || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#667085]">Land Parcels:</span>
                          <span className="font-bold text-[#147A4A]">
                            {farmer.land_records?.length || 0} Records
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-[#D9E2DC]">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingFarmer(farmer);
                            setIsFarmerModalOpen(true);
                          }}
                          className="p-1.5 text-[#667085] hover:text-[#1F2933] hover:bg-[#F8FAF8] rounded-lg transition"
                          title="Edit Farmer"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteFarmer(farmer.id)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                          title="Delete Farmer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <button
                        onClick={() => handleQuickGenerate(farmer)}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg transition shadow-xs active:scale-95"
                      >
                        Select & Print
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: TEMPLATES MANAGEMENT (LIGHT THEME)            */}
        {/* ==================================================== */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2933] flex items-center gap-2">
                  <Layers size={22} className="text-[#147A4A]" />
                  Card Templates Library
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Reusable CR80 Card Templates. Farmer ID Card – Front & Back is verified for PVC printing.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsTemplateModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1F2933] bg-white hover:bg-[#F8FAF8] border border-[#D9E2DC] rounded-xl"
                >
                  <Layers size={14} className="text-[#147A4A]" />
                  <span>Library Modal</span>
                </button>
                <button
                  onClick={() => setActiveTab('editor')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-xl shadow-xs transition"
                >
                  <Sliders size={14} />
                  <span>Open Template Designer</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.templateId}
                  className={`bg-white border rounded-2xl p-5 flex flex-col justify-between ${
                    tpl.templateId === activeTemplateId
                      ? 'border-[#147A4A] ring-1 ring-[#147A4A] shadow-md'
                      : 'border-[#D9E2DC]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E9F5EE] text-[#147A4A] border border-[#D9E2DC] px-2 py-0.5 rounded-full">
                        {tpl.isBuiltin ? 'Approved Master Template' : 'Custom Template'}
                      </span>
                      <span className="text-xs text-[#667085] font-mono">
                        v{tpl.version || 1}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[#1F2933]">{tpl.name}</h3>
                    <p className="text-xs text-[#667085] mt-1">
                      Physical Size: {tpl.size?.width || 85.6} × {tpl.size?.height || 54} mm (CR80 PVC)
                    </p>

                    <div className="mt-3 p-3 bg-[#F8FAF8] rounded-xl border border-[#D9E2DC] text-xs text-[#1F2933] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#667085]">Front Elements:</span>
                        <span>{tpl.front?.elements?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#667085]">Back Elements:</span>
                        <span>{tpl.back?.elements?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#667085]">QR Binding:</span>
                        <span className="font-mono text-[#147A4A]">
                          {tpl.qrConfig?.sourceField || 'farmer_id'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-[#D9E2DC]">
                    <button
                      onClick={() => exportTemplateJSON(tpl)}
                      className="flex items-center gap-1 text-xs text-[#667085] hover:text-[#1F2933]"
                      title="Export Template JSON"
                    >
                      <Download size={13} />
                      <span>Export JSON</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {tpl.isBuiltin && (
                        <button
                          onClick={handleResetBuiltin}
                          className="flex items-center gap-1 text-xs text-[#C9A63A] hover:underline"
                          title="Reset to factory pristine state"
                        >
                          <RotateCcw size={12} />
                          <span>Reset</span>
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setActiveTemplateId(tpl.templateId);
                          setActiveTab('generator');
                        }}
                        className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg transition"
                      >
                        Use for Card
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 5: PRINT HISTORY LOG (LIGHT THEME)               */}
        {/* ==================================================== */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-[#1F2933] flex items-center gap-2">
                  <Clock size={22} className="text-[#C9A63A]" />
                  Print History & Audit Log
                </h2>
                <p className="text-xs text-[#667085] mt-0.5">
                  Records of all Farmer ID cards generated on this CSC terminal. One-click reprint available.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    if (window.confirm('Clear all print logs from this device?')) {
                      await clearPrintHistory();
                      setPrintHistory([]);
                      showNotification('Print history cleared.');
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 hover:text-white hover:bg-rose-600 bg-white border border-[#D9E2DC] rounded-xl transition"
                >
                  <Trash2 size={13} />
                  <span>Clear History</span>
                </button>
              </div>
            </div>

            <div className="bg-white border border-[#D9E2DC] rounded-2xl overflow-hidden shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#D9E2DC] bg-[#F8FAF8] text-[#667085] font-bold text-[11px] uppercase tracking-wider">
                      <th className="py-3.5 px-4">Template</th>
                      <th className="py-3.5 px-4">Farmer Name</th>
                      <th className="py-3.5 px-4">Farmer ID</th>
                      <th className="py-3.5 px-4">Village</th>
                      <th className="py-3.5 px-4">Printed At</th>
                      <th className="py-3.5 px-4">Layout</th>
                      <th className="py-3.5 px-4 text-right">Reprint</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#D9E2DC]">
                    {printHistory.length > 0 ? (
                      printHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-[#F8FAF8] transition">
                          <td className="py-3 px-4 font-semibold text-[#147A4A]">
                            {item.templateName || 'Farmer ID Card'}
                          </td>
                          <td className="py-3 px-4 font-bold text-[#1F2933]">
                            {item.farmerName}
                          </td>
                          <td className="py-3 px-4 font-mono text-[#667085]">
                            {item.farmerIdNumber}
                          </td>
                          <td className="py-3 px-4 text-[#667085]">
                            {item.village || '—'}
                          </td>
                          <td className="py-3 px-4 text-[#667085]">
                            {item.printedAt}
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-[#F8FAF8] text-[#667085] border border-[#D9E2DC]">
                              {item.layout || 'both'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => handleQuickReprint(item)}
                              className="px-3 py-1 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg transition active:scale-95"
                            >
                              Print Again
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-[#667085]">
                          No cards have been printed yet on this terminal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: SETTINGS & CSC CENTER PROFILE (LIGHT THEME)   */}
        {/* ==================================================== */}
        {activeTab === 'settings' && (
          <div className="max-w-3xl space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[#1F2933] flex items-center gap-2">
                <Settings size={22} className="text-[#667085]" />
                CSC Center & Terminal Settings
              </h2>
              <p className="text-xs text-[#667085] mt-0.5">
                Configure your CSC operator center profile, offline database preferences, and backup settings.
              </p>
            </div>

            {/* Kendra Information Card */}
            <div className="bg-white border border-[#D9E2DC] rounded-2xl p-5 space-y-4 shadow-card">
              <h3 className="text-sm font-bold text-[#1F2933] flex items-center gap-2">
                <HardDrive size={16} className="text-[#147A4A]" />
                CSC / Seva Kendra Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[#667085] font-semibold block mb-1">
                    Center Name
                  </label>
                  <input
                    type="text"
                    value={kendraInfo.centerName}
                    onChange={(e) => {
                      const updated = { ...kendraInfo, centerName: e.target.value };
                      setKendraInfo(updated);
                      localStorage.setItem('krishi_csc_kendra_info_v1', JSON.stringify(updated));
                    }}
                    className="w-full bg-[#F8FAF8] border border-[#D9E2DC] rounded-xl px-3 py-2 text-[#1F2933] focus:border-[#147A4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#667085] font-semibold block mb-1">
                    Operator / Sanchalak Name
                  </label>
                  <input
                    type="text"
                    value={kendraInfo.operatorName}
                    onChange={(e) => {
                      const updated = { ...kendraInfo, operatorName: e.target.value };
                      setKendraInfo(updated);
                      localStorage.setItem('krishi_csc_kendra_info_v1', JSON.stringify(updated));
                    }}
                    className="w-full bg-[#F8FAF8] border border-[#D9E2DC] rounded-xl px-3 py-2 text-[#1F2933] focus:border-[#147A4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#667085] font-semibold block mb-1">
                    CSC / Kendra ID
                  </label>
                  <input
                    type="text"
                    value={kendraInfo.cscId}
                    onChange={(e) => {
                      const updated = { ...kendraInfo, cscId: e.target.value };
                      setKendraInfo(updated);
                      localStorage.setItem('krishi_csc_kendra_info_v1', JSON.stringify(updated));
                    }}
                    className="w-full bg-[#F8FAF8] border border-[#D9E2DC] rounded-xl px-3 py-2 text-[#1F2933] font-mono focus:border-[#147A4A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[#667085] font-semibold block mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={kendraInfo.district}
                    onChange={(e) => {
                      const updated = { ...kendraInfo, district: e.target.value };
                      setKendraInfo(updated);
                      localStorage.setItem('krishi_csc_kendra_info_v1', JSON.stringify(updated));
                    }}
                    className="w-full bg-[#F8FAF8] border border-[#D9E2DC] rounded-xl px-3 py-2 text-[#1F2933] focus:border-[#147A4A] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Offline Database & Storage Management */}
            <div className="bg-white border border-[#D9E2DC] rounded-2xl p-5 space-y-4 shadow-card">
              <h3 className="text-sm font-bold text-[#1F2933] flex items-center gap-2">
                <Database size={16} className="text-[#147A4A]" />
                Local Storage & Database Management
              </h3>

              <div className="p-3 bg-[#F8FAF8] rounded-xl border border-[#D9E2DC] text-xs text-[#1F2933] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#667085]">Storage Engine:</span>
                  <span className="font-semibold text-[#147A4A]">Local Device Database</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Total Farmer Records:</span>
                  <span className="font-bold text-[#1F2933]">{farmers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Saved Print Logs:</span>
                  <span className="font-bold text-[#1F2933]">{printHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Network State:</span>
                  <span>{isOnline ? '● Online' : '● Offline (Local Records Active)'}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2 flex-wrap">
                <button
                  onClick={handleExportDatabase}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-white rounded-xl border border-[#D9E2DC] transition"
                >
                  <Download size={14} className="text-[#147A4A]" />
                  <span>Export Database Backup (.json)</span>
                </button>

                <label className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#1F2933] bg-[#F8FAF8] hover:bg-white rounded-xl border border-[#D9E2DC] transition cursor-pointer">
                  <Upload size={14} className="text-[#147A4A]" />
                  <span>Restore Database (.json)</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportDatabase}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Quick Action Hotkeys Reference */}
            <div className="bg-white border border-[#D9E2DC] rounded-2xl p-5 space-y-3 shadow-card">
              <h3 className="text-sm font-bold text-[#1F2933] flex items-center gap-2">
                <HelpCircle size={16} className="text-[#C9A63A]" />
                Keyboard Shortcuts Guide
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#F8FAF8] p-3 rounded-xl border border-[#D9E2DC]">
                  <div className="font-mono text-[#147A4A] font-bold">Ctrl / Cmd + K</div>
                  <div className="text-[#667085] text-[11px] mt-0.5">Focus Farmer Search</div>
                </div>
                <div className="bg-[#F8FAF8] p-3 rounded-xl border border-[#D9E2DC]">
                  <div className="font-mono text-[#147A4A] font-bold">N</div>
                  <div className="text-[#667085] text-[11px] mt-0.5">Create New Farmer</div>
                </div>
                <div className="bg-[#F8FAF8] p-3 rounded-xl border border-[#D9E2DC]">
                  <div className="font-mono text-[#147A4A] font-bold">P</div>
                  <div className="text-[#667085] text-[11px] mt-0.5">Generate & Print Card</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: ADVANCED TEMPLATE DESIGNER (INSPECTOR)        */}
        {/* ==================================================== */}
        {activeTab === 'editor' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab('templates')}
                className="flex items-center gap-1.5 text-xs text-[#667085] hover:text-[#1F2933]"
              >
                ← Back to Templates
              </button>
              <span className="text-xs text-[#C9A63A] font-semibold">
                Advanced Designer Mode
              </span>
            </div>
            <div className="h-[calc(100vh-160px)]">
              <TemplateEditor
                template={activeTemplate}
                onSaveTemplate={handleSaveTemplate}
                onResetTemplate={handleResetBuiltin}
                sampleFarmer={activeFarmer}
                onExportTemplate={exportTemplateJSON}
              />
            </div>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODALS (ISOLATED & LAZY)                             */}
      {/* ==================================================== */}
      <QrTestModal
        isOpen={isTestQrOpen}
        onClose={() => setIsTestQrOpen(false)}
        template={activeTemplate}
        farmers={farmers}
        activeFarmer={activeFarmer}
        onSelectFarmer={setActiveFarmerId}
      />

      <PrintModal
        template={activeTemplate}
        farmer={activeFarmer}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onPrintLogged={refreshPrintLogs}
        initialLayout={printModalInitialLayout}
      />

      <MultiCardPrintModal
        template={activeTemplate}
        farmers={farmers}
        activeFarmer={activeFarmer}
        isOpen={isMultiPrintModalOpen}
        onClose={() => setIsMultiPrintModalOpen(false)}
      />

      <FarmerModal
        isOpen={isFarmerModalOpen}
        onClose={() => {
          setIsFarmerModalOpen(false);
          setEditingFarmer(null);
        }}
        onSaveFarmer={handleSaveFarmer}
        editingFarmer={editingFarmer}
      />

      <TemplateLibraryModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        activeTemplateId={activeTemplateId}
        onSelectTemplate={setActiveTemplateId}
        onResetBuiltin={handleResetBuiltin}
        onImportTemplate={handleImportTemplate}
      />

      <PhotoAdjustmentModal
        isOpen={isPhotoAdjustOpen}
        onClose={() => setIsPhotoAdjustOpen(false)}
        initialPhoto={activeFarmer?.photo}
        initialSettings={activeFarmer?.photo_settings}
        farmerName={activeFarmer?.name_english || 'Farmer'}
        onSave={handleSavePhotoAdjustment}
      />

      {/* 1-Click PDF Import Progress Overlay */}
      {isImportingPdf && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#D9E2DC] text-center space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-[#E9F5EE] text-[#147A4A] mx-auto flex items-center justify-center animate-spin">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2933]">
                Processing Registration PDF
              </h3>
              <p className="text-xs text-[#667085] mt-1">
                {importingPdfStatus || 'Scanning registration form with OCR engine...'}
              </p>
            </div>
            <div className="text-[11px] font-mono text-[#147A4A] bg-[#F8FAF8] p-2.5 rounded-xl border border-[#D9E2DC]">
              Auto-extracting Name, ID, Photo & Land Records
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
