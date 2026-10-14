import React, { useState, useEffect, useRef } from 'react';
import { parseFarmerRegistrationPDF } from '../services/pdfParser';
import { getMarathiAddress, getEnglishAddress } from '../utils/marathiAddress';
import {
  User,
  Upload,
  Plus,
  Trash2,
  Copy,
  X,
  Check,
  CheckCircle2,
  Sparkles,
  MapPin,
  Layers,
  AlertCircle,
  RotateCcw,
  ShieldCheck,
  Crop,
  AlertTriangle
} from 'lucide-react';
import PhotoAdjustmentModal from './PhotoAdjustmentModal.jsx';
import { validatePhoto } from '../services/photoService.js';

export const FarmerModal = ({
  isOpen,
  onClose,
  onSaveFarmer,
  editingFarmer = null
}) => {
  const DRAFT_KEY = 'krishi_farmer_modal_draft_v1';

  const defaultEmptyFarmer = {
    id: '',
    farmer_id: '',
    farmer_enrollment_number: '',
    name_english: '',
    name_marathi: '',
    dob: '',
    gender: 'Male / पुरुष',
    mobile: '',
    uid: '',
    photo: '',
    photo_settings: null,
    photo_processed: '',
    address_english: '',
    address_marathi: '',
    village: '',
    taluka: '',
    district: '',
    pincode: '',
    land_records: [
      {
        district: '',
        taluka: '',
        village: '',
        survey_no: '',
        area: '',
        owner_share: 'Single'
      }
    ]
  };

  const [formData, setFormData] = useState(defaultEmptyFarmer);
  const [initialDataSnapshot, setInitialDataSnapshot] = useState('');
  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [isPhotoAdjustOpen, setIsPhotoAdjustOpen] = useState(false);
  const [photoValidation, setPhotoValidation] = useState(null);

  // Initialize data on modal open
  useEffect(() => {
    if (isOpen) {
      if (editingFarmer) {
        setFormData({ ...editingFarmer });
        setInitialDataSnapshot(JSON.stringify(editingFarmer));
        setHasDraftNotice(false);
        if (editingFarmer.photo) {
          validatePhoto(editingFarmer.photo).then((res) => setPhotoValidation(res)).catch(() => {});
        } else {
          setPhotoValidation(null);
        }
      } else {
        // Check if there is an uncompleted local draft
        try {
          const savedDraft = localStorage.getItem(DRAFT_KEY);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed && (parsed.farmer_id || parsed.name_english)) {
              setHasDraftNotice(true);
            }
          }
        } catch (_) {}

        setFormData(defaultEmptyFarmer);
        setInitialDataSnapshot(JSON.stringify(defaultEmptyFarmer));
        setPhotoValidation(null);
      }
      setPdfSuccess(false);
      setTouched({});
      setErrors({});
    }
  }, [isOpen, editingFarmer]);

  // Draft auto-save in localStorage when creating a new record
  useEffect(() => {
    if (isOpen && !editingFarmer) {
      const isFilled = formData.farmer_id || formData.name_english || formData.mobile;
      if (isFilled) {
        try {
          localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
        } catch (_) {}
      }
    }
  }, [formData, isOpen, editingFarmer]);

  // Inline Validation Computation
  useEffect(() => {
    const errs = {};
    if (!formData.farmer_id?.trim()) {
      errs.farmer_id = 'Farmer ID is required';
    }
    if (!formData.name_english?.trim()) {
      errs.name_english = 'English name is required';
    }
    if (formData.mobile?.trim()) {
      const cleanMobile = formData.mobile.replace(/\D/g, '');
      if (cleanMobile.length !== 10) {
        errs.mobile = 'Enter a valid 10-digit mobile number';
      }
    }
    if (formData.pincode?.trim()) {
      const cleanPin = formData.pincode.replace(/\D/g, '');
      if (cleanPin.length !== 6) {
        errs.pincode = 'Enter a valid 6-digit PIN';
      }
    }
    setErrors(errs);
  }, [formData]);

  // Check if form has unsaved edits
  const isDirty = initialDataSnapshot && JSON.stringify(formData) !== initialDataSnapshot;

  // Safe dismiss with unsaved changes prompt
  const handleSafeClose = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm('Discard unsaved changes?');
      if (!confirmDiscard) return;
    }
    onClose();
  };

  // Keyboard shortcut: Escape closes modal safely
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        handleSafeClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isDirty]);

  if (!isOpen) return null;

  // Resume local draft
  const handleResumeDraft = () => {
    try {
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        setFormData(parsed);
        setHasDraftNotice(false);
      }
    } catch (_) {}
  };

  // Discard draft
  const handleDiscardDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (_) {}
    setHasDraftNotice(false);
  };

  // Handle Photo File Upload
  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const photoData = event.target.result;
        setFormData((prev) => ({
          ...prev,
          photo: photoData,
          photo_settings: null,
          photo_processed: ''
        }));
        try {
          const val = await validatePhoto(photoData);
          setPhotoValidation(val);
        } catch (_) {}
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setFormData((prev) => ({
      ...prev,
      photo: '',
      photo_settings: null,
      photo_processed: ''
    }));
    setPhotoValidation(null);
  };

  // Handle Registration PDF Upload & Auto-fill
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingPdf(true);
    setPdfSuccess(false);

    try {
      const extracted = await parseFarmerRegistrationPDF(file);
      setFormData((prev) => ({
        id: prev.id || `farmer-${Date.now()}`,
        farmer_id: extracted.farmer_id || '',
        farmer_enrollment_number: extracted.farmer_enrollment_number || '',
        name_english: extracted.name_english || '',
        name_marathi: extracted.name_marathi || '',
        dob: extracted.dob || '',
        gender: extracted.gender || 'Male / पुरुष',
        mobile: extracted.mobile || '',
        uid: extracted.uid || '',
        photo: extracted.photo || '',
        photo_settings: null,
        photo_processed: '',
        address_english: extracted.address_english || '',
        address_marathi: extracted.address_marathi || '',
        village: extracted.village || '',
        taluka: extracted.taluka || '',
        district: extracted.district || '',
        pincode: extracted.pincode || '',
        land_records:
          extracted.land_records && extracted.land_records.length > 0
            ? extracted.land_records
            : [emptyLandRecord()]
      }));

      if (extracted.photo) {
        validatePhoto(extracted.photo).then((val) => setPhotoValidation(val)).catch(() => {});
      } else {
        setPhotoValidation(null);
      }

      const summary = `Auto-extracted: ${extracted.name_english || extracted.farmer_id || 'Farmer'} • ${extracted.land_records?.length || 0} Land Parcels`;
      setPdfSuccess(summary);
    } catch (err) {
      console.error('PDF Parse Error:', err);
      alert('Unable to extract data from this PDF: ' + err.message);
    } finally {
      setIsParsingPdf(false);
      // Reset input so same file can be re-selected if desired
      if (e.target) e.target.value = '';
    }
  };

  // Land Records Management
  const handleAddLandRow = () => {
    setFormData((prev) => ({
      ...prev,
      land_records: [
        ...prev.land_records,
        {
          district: prev.district || (prev.land_records[0]?.district || ''),
          taluka: prev.taluka || (prev.land_records[0]?.taluka || ''),
          village: prev.village || (prev.land_records[0]?.village || ''),
          survey_no: '',
          area: '',
          owner_share: 'Single'
        }
      ]
    }));
  };

  const handleDuplicateLandRow = (index) => {
    setFormData((prev) => {
      const source = prev.land_records[index];
      const cloned = { ...source, survey_no: '' };
      const nextRecords = [...prev.land_records];
      nextRecords.splice(index + 1, 0, cloned);
      return { ...prev, land_records: nextRecords };
    });
  };

  const handleRemoveLandRow = (index) => {
    if (formData.land_records.length <= 1) {
      // Clear values instead of removing only row
      setFormData((prev) => ({
        ...prev,
        land_records: [
          {
            district: '',
            taluka: '',
            village: '',
            survey_no: '',
            area: '',
            owner_share: 'Single'
          }
        ]
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      land_records: prev.land_records.filter((_, idx) => idx !== index)
    }));
  };

  const handleUpdateLandRecord = (index, field, value) => {
    setFormData((prev) => {
      const nextRecords = [...prev.land_records];
      nextRecords[index] = { ...nextRecords[index], [field]: value };
      return { ...prev, land_records: nextRecords };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setTouched({
      farmer_id: true,
      name_english: true,
      mobile: true,
      pincode: true
    });

    if (errors.farmer_id || errors.name_english || errors.mobile || errors.pincode) {
      return;
    }

    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (_) {}

    const finalData = { ...formData };
    if (!finalData.address_marathi || !finalData.address_marathi.includes('जि.')) {
      finalData.address_marathi = getMarathiAddress(finalData);
    }
    if (!finalData.address_english || /ta\./i.test(finalData.address_english) || !finalData.address_english.toLowerCase().includes('dist')) {
      finalData.address_english = getEnglishAddress(finalData);
    }

    onSaveFarmer({
      ...finalData,
      id: finalData.id || `farmer-${Date.now()}`
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 animate-in fade-in duration-150"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.55)'
      }}
    >
      <div
        className="relative w-full max-w-[1060px] bg-white border border-[#D9E2DC] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-48px)]"
        style={{
          width: 'min(1060px, calc(100vw - 32px))',
          maxWidth: '1060px',
          maxHeight: 'calc(100vh - 48px)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* ==================================================== */}
        {/* 1. STICKY HEADER                                     */}
        {/* ==================================================== */}
        <div className="px-6 py-4 bg-[#F8FAF8] border-b border-[#D9E2DC] flex items-center justify-between sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E9F5EE] text-[#147A4A] border border-[#D9E2DC] flex items-center justify-center shadow-xs shrink-0">
              <User size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#1F2933]">
                  {editingFarmer ? 'Edit Farmer Record' : 'Register New Farmer'}
                </h2>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#E9F5EE] text-[#147A4A] border border-[#D9E2DC] px-2 py-0.5 rounded-full font-mono">
                  Local Records
                </span>
              </div>
              <p className="text-xs text-[#667085] mt-0.5">
                {editingFarmer ? 'Update saved farmer record details' : 'Add farmer information for instant card generation'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSafeClose}
            className="p-2 text-[#667085] hover:text-[#1F2933] hover:bg-[#E9F5EE] rounded-lg transition"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Draft Resume Banner */}
        {hasDraftNotice && (
          <div className="px-6 py-2.5 bg-[#FEF08A]/60 border-b border-[#D9E2DC] flex items-center justify-between text-xs text-[#1F2933]">
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-[#147A4A]" />
              <span>You have an uncompleted draft from your previous session.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResumeDraft}
                className="px-2.5 py-1 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-md transition"
              >
                Resume Draft
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-2 py-1 text-xs font-semibold text-[#667085] hover:text-[#1F2933]"
              >
                Discard
              </button>
            </div>
          </div>
        )}

        {/* PDF Auto-Fill Action Banner */}
        <div className="px-6 py-2.5 bg-[#F8FAF8] border-b border-[#D9E2DC] flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#1F2933]">
            <Upload size={15} className="text-[#147A4A]" />
            <span className="font-medium">
              Have a Farmer Registration Form PDF? Auto-extract fields in 1 click:
            </span>
          </div>

          <label className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#147A4A] bg-[#E9F5EE] hover:bg-[#d5edd7] border border-[#D9E2DC] rounded-lg cursor-pointer transition">
            <Upload size={13} />
            <span>{isParsingPdf ? 'Parsing Document...' : 'Upload Registration PDF'}</span>
            <input
              type="file"
              accept=".pdf"
              onChange={handlePdfUpload}
              className="hidden"
              disabled={isParsingPdf}
            />
          </label>
        </div>

        {pdfSuccess && (
          <div className="px-6 py-2.5 bg-[#E9F5EE] text-[#147A4A] text-xs font-semibold flex items-center gap-2 border-b border-[#D9E2DC]">
            <CheckCircle2 size={15} className="shrink-0" />
            <span>{pdfSuccess}</span>
          </div>
        )}

        {/* ==================================================== */}
        {/* 2. SCROLLABLE FORM BODY                              */}
        {/* ==================================================== */}
        <form id="farmerForm" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-white modal-body">
          {/* SECTION 1: Identification & Photograph */}
          <div className="bg-white p-5 rounded-2xl border border-[#D9E2DC] shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2933]">
                1. Identification & Photograph
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                Farmer registration IDs, Aadhaar reference, and card portrait photograph.
              </p>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-6">
              {/* Photo Area (20–25% width) */}
              <div
                className="w-full md:w-52 shrink-0 flex flex-col items-center gap-2.5 p-3.5 bg-[#F8FAF8] rounded-xl border border-[#D9E2DC]"
                style={{ width: '190px', minWidth: '190px', maxWidth: '210px' }}
              >
                <div
                  onClick={() => formData.photo && setIsPhotoAdjustOpen(true)}
                  className={`w-28 h-32 rounded-lg border-2 ${
                    formData.photo
                      ? 'border-solid border-[#A4CBB0] cursor-pointer hover:ring-2 hover:ring-emerald-500/40'
                      : 'border-dashed border-[#D9E2DC]'
                  } bg-white overflow-hidden flex items-center justify-center relative group shadow-xs`}
                  title={formData.photo ? 'Click to adjust, crop, or brighten photo' : 'Upload a photo'}
                >
                  {formData.photo ? (
                    <>
                      <img
                        src={formData.photo_processed || formData.photo}
                        alt="Farmer Portrait"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1">
                        <Crop size={16} />
                        <span>Adjust Photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-[#667085] p-2 text-center">
                      <User size={30} />
                      <span className="text-[10px] mt-1 font-semibold">No Photo</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-2 w-full">
                  {formData.photo && (
                    <button
                      type="button"
                      onClick={() => setIsPhotoAdjustOpen(true)}
                      className="w-full py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#147A4A] border border-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5"
                    >
                      <Crop size={13} />
                      <span>Adjust / Crop Photo</span>
                    </button>
                  )}

                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[#147A4A] hover:underline font-bold cursor-pointer">
                      {formData.photo ? 'Change' : 'Choose Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                    {formData.photo && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-xs text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Photo Quality Guidance & Validation Warnings */}
                  {photoValidation?.warnings?.length > 0 && (
                    <div className="w-full mt-1 p-2 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 space-y-1 text-left">
                      <div className="font-bold flex items-center gap-1 text-amber-900">
                        <AlertTriangle size={11} className="shrink-0 text-amber-600" />
                        <span>Photo Quality Advice</span>
                      </div>
                      <p className="leading-tight text-amber-700">
                        {photoValidation.warnings[0]}
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsPhotoAdjustOpen(true)}
                        className="text-[10px] text-emerald-800 font-bold underline block pt-0.5"
                      >
                        Click to crop / brighten
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Identification Fields Grid (75–80% width) */}
              <div
                className="flex-1 w-full min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
                style={{ minWidth: 0, flex: '1 1 auto' }}
              >
                {/* Farmer ID (Required, Full Value Visible) */}
                <div>
                  <label className="text-[#1F2933] font-bold block mb-1">
                    Main Farmer ID <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.farmer_id}
                    onChange={(e) => setFormData({ ...formData, farmer_id: e.target.value })}
                    onBlur={() => setTouched((p) => ({ ...p, farmer_id: true }))}
                    placeholder="e.g. 38533702295"
                    className={`w-full bg-[#F8FAF8] focus:bg-white border rounded-xl px-3.5 py-2.5 text-[#1F2933] font-mono text-sm ${
                      touched.farmer_id && errors.farmer_id ? 'border-rose-500 bg-rose-50/30' : 'border-[#D9E2DC]'
                    }`}
                  />
                  {touched.farmer_id && errors.farmer_id && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.farmer_id}
                    </p>
                  )}
                </div>

                {/* Enrollment Number (Full Value Visible) */}
                <div>
                  <label className="text-[#1F2933] font-semibold block mb-1">
                    Farmer Enrollment Number
                  </label>
                  <input
                    type="text"
                    value={formData.farmer_enrollment_number}
                    onChange={(e) =>
                      setFormData({ ...formData, farmer_enrollment_number: e.target.value })
                    }
                    placeholder="e.g. 27_469_4141_549554_005672"
                    className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2.5 text-[#1F2933] font-mono text-sm"
                  />
                </div>

                {/* UID / Masked Aadhaar */}
                <div>
                  <label className="text-[#1F2933] font-semibold block mb-1">
                    UID / Masked Aadhaar
                  </label>
                  <input
                    type="text"
                    value={formData.uid}
                    onChange={(e) => setFormData({ ...formData, uid: e.target.value })}
                    placeholder="e.g. XXXX XXXX 1098"
                    className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2.5 text-[#1F2933] font-mono text-sm"
                  />
                </div>

                {/* Mobile Number */}
                <div>
                  <label className="text-[#1F2933] font-semibold block mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={formData.mobile}
                    onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                    onBlur={() => setTouched((p) => ({ ...p, mobile: true }))}
                    placeholder="e.g. 9423455585"
                    className={`w-full bg-[#F8FAF8] focus:bg-white border rounded-xl px-3.5 py-2.5 text-[#1F2933] font-mono text-sm ${
                      touched.mobile && errors.mobile ? 'border-rose-500 bg-rose-50/30' : 'border-[#D9E2DC]'
                    }`}
                  />
                  {touched.mobile && errors.mobile && (
                    <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.mobile}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Personal Details */}
          <div className="bg-white p-5 rounded-2xl border border-[#D9E2DC] shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2933]">
                2. Personal Details (Bilingual)
              </h3>
              <p className="text-xs text-[#667085] mt-0.5">
                English and Marathi / Devanagari names printed directly on the front of the card.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-[#1F2933] font-bold block mb-1">
                  Name (English) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name_english}
                  onChange={(e) => setFormData({ ...formData, name_english: e.target.value })}
                  onBlur={() => setTouched((p) => ({ ...p, name_english: true }))}
                  placeholder="e.g. Vilas Sopanrao Tupkari"
                  className={`w-full bg-[#F8FAF8] focus:bg-white border rounded-xl px-3.5 py-2.5 text-[#1F2933] font-semibold text-sm ${
                    touched.name_english && errors.name_english ? 'border-rose-500 bg-rose-50/30' : 'border-[#D9E2DC]'
                  }`}
                />
                {touched.name_english && errors.name_english && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.name_english}
                  </p>
                )}
              </div>

              <div>
                <label className="text-[#1F2933] font-semibold block mb-1">
                  Name (Marathi / स्थानिक भाषा)
                </label>
                <input
                  type="text"
                  value={formData.name_marathi}
                  onChange={(e) => setFormData({ ...formData, name_marathi: e.target.value })}
                  placeholder="e.g. विलास सोपानराव तुपकरी"
                  className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2.5 text-[#1F2933] font-serif font-bold text-sm"
                />
              </div>

              <div>
                <label className="text-[#1F2933] font-semibold block mb-1">
                  Date of Birth (DD/MM/YYYY)
                </label>
                <input
                  type="text"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  placeholder="10/10/1977"
                  className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2.5 text-[#1F2933] font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-[#1F2933] font-semibold block mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2.5 text-[#1F2933] text-sm"
                >
                  <option value="Male / पुरुष">Male / पुरुष</option>
                  <option value="Female / स्त्री">Female / स्त्री</option>
                  <option value="Other / इतर">Other / इतर</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 3: Address & Location */}
          <div className="bg-white p-5 rounded-2xl border border-[#D9E2DC] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <MapPin size={15} className="text-[#147A4A]" />
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2933]">
                  3. Address & Location
                </h3>
                <p className="text-xs text-[#667085] mt-0.5">
                  Village, administrative taluka, district, and full physical address.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <label className="text-[#1F2933] font-semibold block mb-1">
                  Village / गाव
                </label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  placeholder="Vihamandwa"
                  className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2 text-[#1F2933]"
                />
              </div>

              <div>
                <label className="text-[#1F2933] font-semibold block mb-1">
                  Taluka / तालुका
                </label>
                <input
                  type="text"
                  value={formData.taluka}
                  onChange={(e) => setFormData({ ...formData, taluka: e.target.value })}
                  placeholder="Paithan"
                  className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2 text-[#1F2933]"
                />
              </div>

              <div>
                <label className="text-[#1F2933] font-semibold block mb-1">
                  District / जिल्हा
                </label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="Chhatrapati Sambhajinagar"
                  className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2 text-[#1F2933]"
                />
              </div>

              <div>
                <label className="text-[#1F2933] font-semibold block mb-1">
                  Pincode / पिनकोड
                </label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  onBlur={() => setTouched((p) => ({ ...p, pincode: true }))}
                  placeholder="431137"
                  className={`w-full bg-[#F8FAF8] focus:bg-white border rounded-xl px-3.5 py-2 text-[#1F2933] font-mono ${
                    touched.pincode && errors.pincode ? 'border-rose-500 bg-rose-50/30' : 'border-[#D9E2DC]'
                  }`}
                />
                {touched.pincode && errors.pincode && (
                  <p className="text-[11px] text-rose-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} />
                    {errors.pincode}
                  </p>
                )}
              </div>

              {/* Full Addresses Spanning Rows */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#1F2933] font-semibold block">
                    Full Address (English)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = getEnglishAddress(formData);
                      if (auto) setFormData((p) => ({ ...p, address_english: auto }));
                    }}
                    className="text-[11px] font-semibold text-[#147A4A] hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>Auto-generate English Address</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.address_english}
                  onChange={(e) => setFormData({ ...formData, address_english: e.target.value })}
                  placeholder="At. Vihamandwa, Tal. Paithan, Dist. Chhatrapati Sambhajinagar - 431137"
                  className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2 text-[#1F2933]"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[#1F2933] font-semibold block">
                    Full Address (Marathi / स्थानिक भाषा)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const auto = getMarathiAddress(formData);
                      if (auto) setFormData((p) => ({ ...p, address_marathi: auto }));
                    }}
                    className="text-[11px] font-semibold text-[#147A4A] hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={12} />
                    <span>Auto-generate Marathi Address</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={formData.address_marathi}
                  onChange={(e) => setFormData({ ...formData, address_marathi: e.target.value })}
                  placeholder="मु. पो. विहामांडवा, तालुका पैठण, छत्रपती संभाजीनगर"
                  className="w-full bg-[#F8FAF8] focus:bg-white border border-[#D9E2DC] rounded-xl px-3.5 py-2 text-[#1F2933] font-serif"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Land Ownership Details */}
          <div className="bg-white p-5 rounded-2xl border border-[#D9E2DC] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-[#147A4A]" />
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#1F2933]">
                    4. Land Details ({formData.land_records?.length || 0} parcels)
                  </h3>
                  <p className="text-xs text-[#667085] mt-0.5">
                    Dynamic table rendered on the back of the card. Supports 1, 2, 3, 4, 5 or more land records.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddLandRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg shadow-xs transition"
              >
                <Plus size={14} />
                <span>+ Add Land Record</span>
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#D9E2DC]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F8FAF8] text-[#667085] font-bold text-[11px] uppercase tracking-wider border-b border-[#D9E2DC]">
                  <tr>
                    <th className="py-2.5 px-3">District</th>
                    <th className="py-2.5 px-3">Taluka</th>
                    <th className="py-2.5 px-3">Village</th>
                    <th className="py-2.5 px-3">Survey No.</th>
                    <th className="py-2.5 px-3">Area</th>
                    <th className="py-2.5 px-3">Owner / Share</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D9E2DC]">
                  {formData.land_records?.map((rec, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAF8]/60 transition">
                      <td className="p-2">
                        <input
                          type="text"
                          value={rec.district}
                          onChange={(e) => handleUpdateLandRecord(idx, 'district', e.target.value)}
                          placeholder="District"
                          className="w-full bg-white border border-[#D9E2DC] rounded-lg px-2.5 py-1.5 text-[#1F2933]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rec.taluka}
                          onChange={(e) => handleUpdateLandRecord(idx, 'taluka', e.target.value)}
                          placeholder="Taluka"
                          className="w-full bg-white border border-[#D9E2DC] rounded-lg px-2.5 py-1.5 text-[#1F2933]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rec.village}
                          onChange={(e) => handleUpdateLandRecord(idx, 'village', e.target.value)}
                          placeholder="Village"
                          className="w-full bg-white border border-[#D9E2DC] rounded-lg px-2.5 py-1.5 text-[#1F2933]"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rec.survey_no}
                          onChange={(e) => handleUpdateLandRecord(idx, 'survey_no', e.target.value)}
                          placeholder="79"
                          className="w-full bg-white border border-[#D9E2DC] rounded-lg px-2.5 py-1.5 text-[#1F2933] font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rec.area}
                          onChange={(e) => handleUpdateLandRecord(idx, 'area', e.target.value)}
                          placeholder="0.0400 Ha"
                          className="w-full bg-white border border-[#D9E2DC] rounded-lg px-2.5 py-1.5 text-[#1F2933] font-mono"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={rec.owner_share}
                          onChange={(e) => handleUpdateLandRecord(idx, 'owner_share', e.target.value)}
                          placeholder="Single / Joint"
                          className="w-full bg-white border border-[#D9E2DC] rounded-lg px-2.5 py-1.5 text-[#1F2933]"
                        />
                      </td>
                      <td className="p-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDuplicateLandRow(idx)}
                            className="p-1.5 text-[#147A4A] hover:bg-[#E9F5EE] rounded-lg transition"
                            title="Duplicate Row"
                          >
                            <Copy size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveLandRow(idx)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </form>

        {/* ==================================================== */}
        {/* 3. STICKY FOOTER (ALWAYS VISIBLE, NEVER SCROLLED OFF)*/}
        {/* ==================================================== */}
        <div className="px-6 py-4 bg-[#F8FAF8] border-t border-[#D9E2DC] flex items-center justify-between sticky bottom-0 z-20 shrink-0">
          <button
            type="button"
            onClick={handleSafeClose}
            className="px-5 py-2.5 text-xs font-semibold text-[#1F2933] bg-white hover:bg-[#F5F7F5] border border-[#D9E2DC] rounded-lg transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-3">
            {(errors.farmer_id || errors.name_english) && (
              <span className="text-xs text-rose-600 font-semibold hidden sm:inline">
                * Please fill required fields
              </span>
            )}
            <button
              type="submit"
              form="farmerForm"
              className="flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#147A4A] hover:bg-[#155A3A] rounded-lg shadow-sm transition active:scale-95"
            >
              <Check size={16} />
              <span>Save Farmer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Photo Adjustment & Cropping Modal */}
      <PhotoAdjustmentModal
        isOpen={isPhotoAdjustOpen}
        onClose={() => setIsPhotoAdjustOpen(false)}
        initialPhoto={formData.photo}
        initialSettings={formData.photo_settings}
        farmerName={formData.name_english || 'Farmer'}
        onSave={(res) => {
          setFormData((prev) => ({
            ...prev,
            photo: res.photo,
            photo_settings: res.photo_settings,
            photo_processed: res.photo_processed
          }));
          if (res.photo) {
            validatePhoto(res.photo).then((val) => setPhotoValidation(val)).catch(() => {});
          }
        }}
      />
    </div>
  );
};
