import { createDefaultTemplate, BUILTIN_TEMPLATE_ID } from '../types/defaultTemplate.js';
import { SAMPLE_FARMERS } from './sampleData.js';
import { getMarathiAddress, getEnglishAddress, resolveFarmerLocation, cleanVillageName, cleanTalukaName } from '../utils/marathiAddress.js';

const DB_NAME = 'FarmerIDCardStudioDB';
const DB_VERSION = 1;
const TEMPLATE_STORE = 'templates';
const FARMER_STORE = 'farmers';

// IndexedDB Helper
function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(TEMPLATE_STORE)) {
        db.createObjectStore(TEMPLATE_STORE, { keyPath: 'templateId' });
      }
      if (!db.objectStoreNames.contains(FARMER_STORE)) {
        db.createObjectStore(FARMER_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Fallback to localStorage if IndexedDB fails
const LOCAL_STORAGE_TEMPLATES_KEY = 'farmer_card_templates_v1';
const LOCAL_STORAGE_FARMERS_KEY = 'farmer_card_farmers_v1';

export async function initStorage() {
  try {
    const builtin = createDefaultTemplate();

    // 1. Purge legacy obsolete templates that may contain old 'Government of India' text
    try {
      await deleteTemplate('agristack-card-v1');
    } catch (_) {}

    // 2. Always save fresh pristine builtin template
    await saveTemplate(builtin);

    // 3. For any existing saved templates, sanitize any lingering "Government of India" elements
    try {
      const db = await openDB();
      const tx = db.transaction(TEMPLATE_STORE, 'readonly');
      const allReq = tx.objectStore(TEMPLATE_STORE).getAll();
      allReq.onsuccess = async () => {
        const list = allReq.result || [];
        for (const t of list) {
          if (t.templateId === 'agristack-card-v1') {
            await deleteTemplate('agristack-card-v1');
            continue;
          }
          let changed = false;
          ['front', 'back'].forEach((s) => {
            t[s]?.elements?.forEach((el) => {
              if (el.text && el.text.includes('Government of India')) {
                el.text = s === 'front' ? 'Farmer ID Card' : 'FOR PERSONAL USE';
                changed = true;
              }
            });
          });
          if (changed) {
            await saveTemplate(t);
          }
        }
      };
    } catch (_) {}

    const farmers = await getFarmers();
    // Ensure all sample farmers exist and farmer-001 has the verified extracted photo
    for (const farmer of SAMPLE_FARMERS) {
      const exists = farmers.find(f => f.id === farmer.id || f.farmer_id === farmer.farmer_id);
      if (!exists) {
        await saveFarmer(farmer);
      } else {
        exists.farmer_id = farmer.farmer_id;
        exists.uid = farmer.uid;
        exists.address_english = farmer.address_english;
        exists.address_marathi = farmer.address_marathi;
        exists.village = farmer.village;
        exists.taluka = farmer.taluka;
        exists.district = farmer.district;
        exists.pincode = farmer.pincode;
        exists.land_records = farmer.land_records;
        if (farmer.id === 'farmer-001') {
          exists.photo = exists.photo || '/sample_farmer_photo.jpg';
        } else if (farmer.id === 'farmer-003' || farmer.farmer_id === '65940671942') {
          exists.photo = exists.photo || '/bharat_pawar_photo.jpg';
        } else if (farmer.photo) {
          exists.photo = exists.photo || farmer.photo;
        }
        if (!exists.photo_settings && farmer.photo_settings) {
          exists.photo_settings = farmer.photo_settings;
        }
        if (!exists.photo_processed && farmer.photo_processed) {
          exists.photo_processed = farmer.photo_processed;
        }
        await saveFarmer(exists);
      }
    }
  } catch (err) {
    console.error('Failed to init storage:', err);
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify([createDefaultTemplate()]));
    localStorage.setItem(LOCAL_STORAGE_FARMERS_KEY, JSON.stringify(SAMPLE_FARMERS));
  }
}

export async function getTemplates() {
  const builtin = createDefaultTemplate();
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(TEMPLATE_STORE, 'readonly');
      const store = transaction.objectStore(TEMPLATE_STORE);
      const request = store.getAll();
      request.onsuccess = () => {
        let list = request.result || [];
        // Filter out obsolete legacy templates
        list = list.filter((t) => t.templateId !== 'agristack-card-v1');
        const others = list.filter((t) => t.templateId !== builtin.templateId);
        // Builtin is always first
        resolve([builtin, ...others]);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IDB failed, using localStorage for templates:', err);
    const data = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    if (data) {
      try {
        let list = JSON.parse(data);
        list = list.filter((t) => t.templateId !== 'agristack-card-v1');
        const others = list.filter((t) => t.templateId !== builtin.templateId);
        return [builtin, ...others];
      } catch (e) { /* ignore */ }
    }
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify([builtin]));
    return [builtin];
  }
}

export async function getTemplateById(id) {
  const templates = await getTemplates();
  return templates.find((t) => t.templateId === id) || templates[0] || createDefaultTemplate();
}

export async function saveTemplate(template) {
  template.updatedAt = new Date().toISOString();
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const transaction = db.transaction(TEMPLATE_STORE, 'readwrite');
      const store = transaction.objectStore(TEMPLATE_STORE);
      const request = store.put(template);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IDB save error, fallback to localStorage', err);
  }

  // Also persist in localStorage for multi-layer persistence
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    let list = data ? JSON.parse(data) : [];
    const index = list.findIndex(t => t.templateId === template.templateId);
    if (index >= 0) {
      list[index] = template;
    } else {
      list.push(template);
    }
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('LocalStorage write failed', e);
  }

  return template;
}

export async function resetBuiltinTemplate() {
  const fresh = createDefaultTemplate();
  await saveTemplate(fresh);
  return fresh;
}

export async function deleteTemplate(templateId) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(TEMPLATE_STORE, 'readwrite');
      const store = tx.objectStore(TEMPLATE_STORE);
      const req = store.delete(templateId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB delete error', e);
  }
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    if (data) {
      let list = JSON.parse(data).filter(t => t.templateId !== templateId);
      localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(list));
    }
  } catch (e) {}
}

// Helper to upgrade and complete farmer records
function sanitizeFarmerRecord(f) {
  const loc = resolveFarmerLocation(f);
  let changed = false;

  if (loc.village && (!f.village || /ta\./i.test(f.village))) {
    f.village = loc.village;
    changed = true;
  }
  if (loc.taluka && (!f.taluka || /ta\./i.test(f.taluka))) {
    f.taluka = loc.taluka;
    changed = true;
  }
  if (loc.district && !f.district) {
    f.district = loc.district;
    changed = true;
  }
  if (loc.pincode && !f.pincode) {
    f.pincode = loc.pincode;
    changed = true;
  }

  const completeEnglish = getEnglishAddress(f);
  if (completeEnglish && f.address_english !== completeEnglish) {
    // Only update if existing is missing district or has raw uncleaned strings
    const lower = (f.address_english || '').toLowerCase();
    const hasDist = loc.district && lower.includes(loc.district.toLowerCase());
    if (!hasDist || /ta\./i.test(f.address_english)) {
      f.address_english = completeEnglish;
      changed = true;
    }
  }

  const completeMarathi = getMarathiAddress(f);
  if (completeMarathi && f.address_marathi !== completeMarathi) {
    const existing = f.address_marathi || '';
    if (!existing.includes('जि.') || (loc.districtMarathi && !existing.includes(loc.districtMarathi))) {
      f.address_marathi = completeMarathi;
      changed = true;
    }
  }

  if (Array.isArray(f.land_records)) {
    f.land_records.forEach((l) => {
      if (l.village) {
        const cleanV = cleanVillageName(l.village);
        if (cleanV && cleanV !== l.village) {
          l.village = cleanV;
          changed = true;
        }
      } else if (f.village) {
        l.village = f.village;
        changed = true;
      }
      if (l.taluka) {
        const cleanT = cleanTalukaName(l.taluka);
        if (cleanT && cleanT !== l.taluka) {
          l.taluka = cleanT;
          changed = true;
        }
      } else if (f.taluka) {
        l.taluka = f.taluka;
        changed = true;
      }
      if (!l.district && f.district) {
        l.district = f.district;
        changed = true;
      }
    });
  }

  return { farmer: f, changed };
}

// FARMER CRUD
export async function getFarmers() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(FARMER_STORE, 'readonly');
      const store = tx.objectStore(FARMER_STORE);
      const req = store.getAll();
      req.onsuccess = () => {
        let list = req.result || [];
        if (list.length === 0) {
          list = [...SAMPLE_FARMERS];
          list.forEach((f) => saveFarmer(f));
        } else {
          list = list.map((f) => {
            const { farmer, changed } = sanitizeFarmerRecord(f);
            if (changed) {
              saveFarmer(farmer);
            }
            return farmer;
          });
        }
        resolve(list);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IDB getFarmers error, using localStorage', err);
    const data = localStorage.getItem(LOCAL_STORAGE_FARMERS_KEY);
    if (data) {
      try {
        let list = JSON.parse(data);
        return list.map((f) => {
          const { farmer } = sanitizeFarmerRecord(f);
          return farmer;
        });
      } catch (e) {}
    }
    localStorage.setItem(LOCAL_STORAGE_FARMERS_KEY, JSON.stringify(SAMPLE_FARMERS));
    return [...SAMPLE_FARMERS];
  }
}

export async function saveFarmer(farmer) {
  if (!farmer.id) {
    farmer.id = 'farmer-' + Date.now();
  }

  // Ensure Marathi and English addresses are always populated
  if (!farmer.address_marathi || !/[\u0900-\u097F]/.test(farmer.address_marathi)) {
    farmer.address_marathi = getMarathiAddress(farmer);
  }
  if (!farmer.address_english) {
    farmer.address_english = getEnglishAddress(farmer);
  }

  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(FARMER_STORE, 'readwrite');
      const store = tx.objectStore(FARMER_STORE);
      const req = store.put(farmer);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IDB saveFarmer error', e);
  }

  try {
    const data = localStorage.getItem(LOCAL_STORAGE_FARMERS_KEY);
    let list = data ? JSON.parse(data) : [];
    const index = list.findIndex(f => f.id === farmer.id);
    if (index >= 0) {
      list[index] = farmer;
    } else {
      list.push(farmer);
    }
    localStorage.setItem(LOCAL_STORAGE_FARMERS_KEY, JSON.stringify(list));
  } catch (e) {}

  return farmer;
}

export async function deleteFarmer(farmerId) {
  try {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(FARMER_STORE, 'readwrite');
      const store = tx.objectStore(FARMER_STORE);
      const req = store.delete(farmerId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {}

  try {
    const data = localStorage.getItem(LOCAL_STORAGE_FARMERS_KEY);
    if (data) {
      let list = JSON.parse(data).filter(f => f.id !== farmerId);
      localStorage.setItem(LOCAL_STORAGE_FARMERS_KEY, JSON.stringify(list));
    }
  } catch (e) {}
}

// TEMPLATE EXPORT & IMPORT (Never exports farmer data)
export function exportTemplateJSON(template) {
  const exportData = {
    templateId: template.templateId,
    name: template.name,
    version: template.version || 1,
    size: template.size,
    qrConfig: template.qrConfig,
    front: template.front,
    back: template.back,
    exportedAt: new Date().toISOString()
  };
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${template.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-template.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importTemplateJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString);
    if (!parsed.front || !parsed.back) {
      throw new Error('Invalid template format: missing front or back definition');
    }
    return {
      templateId: 'tpl-custom-' + Date.now(),
      name: parsed.name || 'Imported Farmer Card Template',
      version: (parsed.version || 1) + 1,
      category: 'Custom',
      isBuiltin: false,
      size: parsed.size || { width: 85.6, height: 54, unit: 'mm', canvasWidth: 856, canvasHeight: 540 },
      qrConfig: parsed.qrConfig || { sourceField: 'farmer_id' },
      front: parsed.front,
      back: parsed.back,
      updatedAt: new Date().toISOString()
    };
  } catch (err) {
    throw new Error('Failed to parse template JSON: ' + err.message);
  }
}

// PRINT HISTORY MANAGEMENT
const LOCAL_STORAGE_PRINT_HISTORY_KEY = 'farmer_card_print_history_v1';

export const SAMPLE_PRINT_HISTORY = [
  {
    id: 'print-001',
    farmerId: 'farmer-001',
    farmerName: 'Vilas Sopanrao Tupkari',
    farmerIdNumber: '38533702295',
    village: 'Vihamandwa',
    templateId: 'farmer-id-card-v1',
    templateName: 'Farmer ID Card',
    printedAt: 'Today 4:32 PM',
    timestamp: Date.now() - 1000 * 60 * 45,
    layout: 'both'
  },
  {
    id: 'print-002',
    farmerId: 'farmer-002',
    farmerName: 'Kesarsing Sabarsing Patil',
    farmerIdNumber: '8220502510',
    village: 'Paithan',
    templateId: 'farmer-id-card-v1',
    templateName: 'Farmer ID Card',
    printedAt: 'Yesterday 11:15 AM',
    timestamp: Date.now() - 1000 * 60 * 60 * 26,
    layout: 'both'
  },
  {
    id: 'print-003',
    farmerId: 'farmer-006',
    farmerName: 'Anand Shrirang Jadhav',
    farmerIdNumber: '38533701108',
    village: 'Georai',
    templateId: 'farmer-id-card-v1',
    templateName: 'Farmer ID Card',
    printedAt: '2 days ago',
    timestamp: Date.now() - 1000 * 60 * 60 * 50,
    layout: 'both'
  }
];

export async function getPrintHistory() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_PRINT_HISTORY_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    localStorage.setItem(LOCAL_STORAGE_PRINT_HISTORY_KEY, JSON.stringify(SAMPLE_PRINT_HISTORY));
    return [...SAMPLE_PRINT_HISTORY];
  } catch (err) {
    return [...SAMPLE_PRINT_HISTORY];
  }
}

export async function addPrintRecord(record) {
  try {
    const history = await getPrintHistory();
    const newRecord = {
      id: 'print-' + Date.now(),
      farmerId: record.farmerId || '',
      farmerName: record.farmerName || 'Farmer Record',
      farmerIdNumber: record.farmerIdNumber || '',
      village: record.village || '',
      templateId: record.templateId || 'farmer-id-card-v1',
      templateName: record.templateName || 'Farmer ID Card',
      printedAt: 'Just now',
      timestamp: Date.now(),
      layout: record.layout || 'both',
      ...record
    };
    const updated = [newRecord, ...history.filter(h => h.id !== newRecord.id)].slice(0, 50);
    localStorage.setItem(LOCAL_STORAGE_PRINT_HISTORY_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to add print record:', err);
    return [];
  }
}

export async function clearPrintHistory() {
  try {
    localStorage.removeItem(LOCAL_STORAGE_PRINT_HISTORY_KEY);
    return [];
  } catch (err) {
    return [];
  }
}

