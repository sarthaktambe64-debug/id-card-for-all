/**
 * Comprehensive Marathi / Devanagari Address Translation & Transliteration Utility
 * Specifically crafted for Maharashtra CSC Farmer ID Card generation.
 */

// All 36 Maharashtra Districts in English and Marathi
export const MAHARASHTRA_DISTRICTS = {
  'chhatrapati sambhajinagar': 'छत्रपती संभाजीनगर',
  'sambhajinagar': 'छत्रपती संभाजीनगर',
  'aurangabad': 'छत्रपती संभाजीनगर',
  'ahilyanagar': 'अहिल्यानगर',
  'ahmednagar': 'अहिल्यानगर',
  'akola': 'अकोला',
  'amravati': 'अमरावती',
  'beed': 'बीड',
  'bhandara': 'भंडारा',
  'buldhana': 'बुलढाणा',
  'chandrapur': 'चंद्रपूर',
  'dhule': 'धुळे',
  'gadchiroli': 'गडचिरोली',
  'gondia': 'गोंदिया',
  'hingoli': 'हिंगोली',
  'jalgaon': 'जळगाव',
  'jalna': 'जालना',
  'kolhapur': 'कोल्हापूर',
  'latur': 'लातूर',
  'mumbai city': 'मुंबई शहर',
  'mumbai suburban': 'मुंबई उपनगर',
  'nagpur': 'नागपूर',
  'nanded': 'नांदेड',
  'nandurbar': 'नंदुरबार',
  'nashik': 'नाशिक',
  'dharashiv': 'धाराशिव',
  'osmanabad': 'धाराशिव',
  'palghar': 'पालघर',
  'parbhani': 'परभणी',
  'pune': 'पुणे',
  'raigad': 'रायगड',
  'ratnagiri': 'रत्नागिरी',
  'sangli': 'सांगली',
  'satara': 'सातारा',
  'sindhudurg': 'सिंधुदुर्ग',
  'solapur': 'सोलापूर',
  'thane': 'ठाणे',
  'wardha': 'वर्धा',
  'washim': 'वाशिम',
  'yavatmal': 'यवतमाळ'
};

// Common Talukas in Maharashtra
export const MAHARASHTRA_TALUKAS = {
  'paithan': 'पैठण',
  'gangapur': 'गंगापूर',
  'vaijapur': 'वैजापूर',
  'kannad': 'कन्नड',
  'sillod': 'सिल्लोड',
  'phulambri': 'फुलंब्री',
  'khuldabad': 'खुलताबाद',
  'soygaon': 'सोयगाव',
  'aurangabad': 'छत्रपती संभाजीनगर',
  'shevgaon': 'शेवगाव',
  'newasa': 'नेवासा',
  'pathardi': 'पाथर्डी',
  'rahuri': 'राहुरी',
  'sangamner': 'संगमनेर',
  'shrirampur': 'श्रीरामपूर',
  'kopargaon': 'कोपरगाव',
  'parner': 'पारनेर',
  'karjat': 'कर्जत',
  'jamkhed': 'जामखेड',
  'nagar': 'अहिल्यानगर',
  'bhadgaon': 'भडगाव',
  'chalisgaon': 'चाळीसगाव',
  'pachora': 'पाचोरा',
  'jamner': 'जामनेर',
  'erandol': 'एरंडोल',
  'dharangaon': 'धरणगाव',
  'chopda': 'चोपडा',
  'raver': 'रावेर',
  'yawal': 'यावल',
  'amalner': 'अमळनेर',
  'parola': 'पारोळा',
  'bodwad': 'बोदवड',
  'muktainagar': 'मुक्ताईनगर',
  'baramati': 'बारामती',
  'haveli': 'हवेली',
  'shirur': 'शिरूर',
  'khed': 'खेड',
  'daund': 'दौंड',
  'indapur': 'इंदापूर',
  'ambegaon': 'आंबेगाव',
  'junar': 'जुन्नर',
  'maval': 'मावळ',
  'mulshi': 'मुळशी',
  'velhe': 'वेल्हे',
  'bhor': 'भोर',
  'purandar': 'पुरंदर',
  'malegaon': 'मालेगाव',
  'niphad': 'निफाड',
  'sinnar': 'सिन्नर',
  'yeola': 'येवला',
  'dindori': 'दिंडोरी',
  'satana': 'सटाणा',
  'baglan': 'बागलाण',
  'chandwad': 'चांदवड',
  'nandgaon': 'नांदगाव',
  'kalwan': 'कळवण',
  'surgana': 'सुरगाणा',
  'peint': 'पेठ',
  'trimbak': 'त्र्यंबक',
  'trimbakeshwar': 'त्र्यंबकेश्वर',
  'igatpuri': 'इगतपुरी',
  'deola': 'देवळा'
};

// Common Villages
export const COMMON_VILLAGES = {
  'vihamandwa': 'विहामांडवा',
  'vihamandawa': 'विहामांडवा',
  'mirkheda': 'मिरखेडा',
  'mirakheda': 'मिरखेडा',
  'pimprala': 'पिंप्राळा',
  'pimpalgaon': 'पिंपळगाव',
  'nimgaon': 'निमगाव',
  'shekta': 'शेकटा',
  'bidkin': 'बिडकीन',
  'wadji': 'वडजी',
  'apegaon': 'आपेगाव',
  'bhadji': 'भादजी',
  'dahigaon': 'दहिगाव',
  'navgaon': 'नवगाव',
  'balanagar': 'बालानगर',
  'chittegaon': 'चित्तेगाव',
  'wahegaon': 'वाहेगाव',
  'pategaon': 'पाटेगाव',
  'georai': 'गेवराई',
  'adul': 'आडूल',
  'pachod': 'पाचोड',
  'dhakephal': 'ढाकेफळ',
  'kaigaon': 'कायगाव',
  'bhenda': 'भेंडा',
  'kukana': 'कुकणा',
  'sonai': 'सोनाई'
};

/**
 * Phonetic transliterator for general English words into Devanagari script
 */
export function transliterateEnglishToMarathi(text) {
  if (!text) return '';
  if (/[\u0900-\u097F]/.test(text)) return text; // Already in Devanagari

  const lower = text.toLowerCase().trim();

  // 1. Direct dictionary matches
  if (COMMON_VILLAGES[lower]) return COMMON_VILLAGES[lower];
  if (MAHARASHTRA_TALUKAS[lower]) return MAHARASHTRA_TALUKAS[lower];
  if (MAHARASHTRA_DISTRICTS[lower]) return MAHARASHTRA_DISTRICTS[lower];

  // 2. Multi-word phrases
  const words = lower.split(/[\s,.-]+/).filter(Boolean);
  const marathiWords = words.map((w) => {
    if (COMMON_VILLAGES[w]) return COMMON_VILLAGES[w];
    if (MAHARASHTRA_TALUKAS[w]) return MAHARASHTRA_TALUKAS[w];
    if (MAHARASHTRA_DISTRICTS[w]) return MAHARASHTRA_DISTRICTS[w];

    // Standard address prefixes
    if (w === 'at' || w === 'mu') return 'मु.';
    if (w === 'po' || w === 'post') return 'पो.';
    if (w === 'ta' || w === 'tal' || w === 'taluka') return 'ता.';
    if (w === 'dist' || w === 'district') return 'जि.';

    // Rule-based phonetic conversion
    return convertWordToDevanagari(w);
  });

  return marathiWords.join(' ');
}

/**
 * Basic phonetic converter for unmapped Marathi names
 */
function convertWordToDevanagari(word) {
  let s = word.toLowerCase();

  // Multi-char replacements
  s = s.replace(/kh/g, 'ख')
       .replace(/gh/g, 'घ')
       .replace(/ch/g, 'च')
       .replace(/chh/g, 'छ')
       .replace(/jh/g, 'झ')
       .replace(/th/g, 'थ')
       .replace(/dh/g, 'ध')
       .replace(/ph/g, 'फ')
       .replace(/bh/g, 'भ')
       .replace(/sh/g, 'श')
       .replace(/zh/g, 'झ')
       .replace(/aa/g, 'ा')
       .replace(/ee/g, 'ी')
       .replace(/oo/g, 'ू')
       .replace(/ai/g, 'ै')
       .replace(/au/g, 'ौ')
       .replace(/k/g, 'क')
       .replace(/g/g, 'ग')
       .replace(/c/g, 'क')
       .replace(/j/g, 'ज')
       .replace(/t/g, 'त')
       .replace(/d/g, 'द')
       .replace(/n/g, 'न')
       .replace(/p/g, 'प')
       .replace(/b/g, 'ब')
       .replace(/m/g, 'म')
       .replace(/y/g, 'य')
       .replace(/r/g, 'र')
       .replace(/l/g, 'ल')
       .replace(/v/g, 'व')
       .replace(/w/g, 'व')
       .replace(/s/g, 'स')
       .replace(/h/g, 'ह')
       .replace(/a/g, '')
       .replace(/i/g, 'ि')
       .replace(/u/g, 'ु')
       .replace(/e/g, 'े')
       .replace(/o/g, 'ो');

  return s;
}

// Comprehensive Taluka to District Mapping for Maharashtra
export const TALUKA_TO_DISTRICT = {
  // Chhatrapati Sambhajinagar (Aurangabad)
  'paithan': 'Chhatrapati Sambhajinagar',
  'gangapur': 'Chhatrapati Sambhajinagar',
  'vaijapur': 'Chhatrapati Sambhajinagar',
  'kannad': 'Chhatrapati Sambhajinagar',
  'sillod': 'Chhatrapati Sambhajinagar',
  'phulambri': 'Chhatrapati Sambhajinagar',
  'khuldabad': 'Chhatrapati Sambhajinagar',
  'soygaon': 'Chhatrapati Sambhajinagar',
  'aurangabad': 'Chhatrapati Sambhajinagar',
  // Ahilyanagar (Ahmednagar)
  'shevgaon': 'Ahilyanagar',
  'newasa': 'Ahilyanagar',
  'pathardi': 'Ahilyanagar',
  'rahuri': 'Ahilyanagar',
  'sangamner': 'Ahilyanagar',
  'shrirampur': 'Ahilyanagar',
  'kopargaon': 'Ahilyanagar',
  'parner': 'Ahilyanagar',
  'karjat': 'Ahilyanagar',
  'jamkhed': 'Ahilyanagar',
  'nagar': 'Ahilyanagar',
  'ahmednagar': 'Ahilyanagar',
  'ahilyanagar': 'Ahilyanagar',
  // Jalgaon
  'bhadgaon': 'Jalgaon',
  'chalisgaon': 'Jalgaon',
  'pachora': 'Jalgaon',
  'jamner': 'Jalgaon',
  'erandol': 'Jalgaon',
  'dharangaon': 'Jalgaon',
  'chopda': 'Jalgaon',
  'raver': 'Jalgaon',
  'yawal': 'Jalgaon',
  'amalner': 'Jalgaon',
  'parola': 'Jalgaon',
  'bodwad': 'Jalgaon',
  'muktainagar': 'Jalgaon',
  'jalgaon': 'Jalgaon',
  // Pune
  'baramati': 'Pune',
  'haveli': 'Pune',
  'shirur': 'Pune',
  'khed': 'Pune',
  'daund': 'Pune',
  'indapur': 'Pune',
  'ambegaon': 'Pune',
  'junar': 'Pune',
  'maval': 'Pune',
  'mulshi': 'Pune',
  'velhe': 'Pune',
  'bhor': 'Pune',
  'purandar': 'Pune',
  'pune': 'Pune',
  // Nashik
  'malegaon': 'Nashik',
  'niphad': 'Nashik',
  'sinnar': 'Nashik',
  'yeola': 'Nashik',
  'dindori': 'Nashik',
  'satana': 'Nashik',
  'baglan': 'Nashik',
  'chandwad': 'Nashik',
  'nandgaon': 'Nashik',
  'kalwan': 'Nashik',
  'surgana': 'Nashik',
  'peint': 'Nashik',
  'trimbak': 'Nashik',
  'trimbakeshwar': 'Nashik',
  'igatpuri': 'Nashik',
  'deola': 'Nashik',
  'nashik': 'Nashik',
  // Jalna
  'jalna': 'Jalna',
  'ambad': 'Jalna',
  'bhokardan': 'Jalna',
  'badnapur': 'Jalna',
  'jafrabad': 'Jalna',
  'partur': 'Jalna',
  'ghansawangi': 'Jalna',
  'mantha': 'Jalna',
  // Beed
  'beed': 'Beed',
  'georai': 'Beed',
  'patoda': 'Beed',
  'ashti': 'Beed',
  'kaij': 'Beed',
  'ambajogai': 'Beed',
  'majalgaon': 'Beed',
  'parli': 'Beed',
  'dharur': 'Beed',
  'wadwani': 'Beed'
};

// Village reference info (Taluka, District, Postal Code)
export const VILLAGE_INFO = {
  'vihamandwa': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431137' },
  'vihamandawa': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431137' },
  'mirkheda': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431137' },
  'mirakheda': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431137' },
  'shekta': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431148' },
  'bidkin': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431105' },
  'pachod': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431121' },
  'adul': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431121' },
  'apegaon': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431107' },
  'wadji': { taluka: 'Paithan', district: 'Chhatrapati Sambhajinagar', pincode: '431107' }
};

/**
 * Cleans village strings that might contain merged prefixes or attached talukas
 * (e.g. "At.vihamandwa ta.paithan" -> "Vihamandwa")
 */
export function cleanVillageName(rawVillage) {
  if (!rawVillage) return '';
  let v = String(rawVillage).trim();
  v = v.replace(/^at[.,\s]*/i, '')
       .replace(/^mu[.,\s]*/i, '')
       .replace(/^po[.,\s]*/i, '')
       .replace(/\s*ta[.,\s].*$/i, '')
       .replace(/\s*tal[.,\s].*$/i, '')
       .replace(/[,;].*$/, '')
       .trim();

  if (!v) return '';
  return v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
}

/**
 * Cleans taluka strings (e.g. "ta.paithan", "paithan" -> "Paithan")
 */
export function cleanTalukaName(rawTaluka) {
  if (!rawTaluka) return '';
  let t = String(rawTaluka).trim();
  t = t.replace(/^ta[.,\s]*/i, '')
       .replace(/^tal[.,\s]*/i, '')
       .replace(/^taluka[.,\s]*/i, '')
       .replace(/[,;].*$/, '')
       .trim();

  if (!t) return '';
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

/**
 * Converts English digits to Devanagari numerals (e.g. 431137 -> ४३११३७)
 */
export function toMarathiDigits(str) {
  if (!str) return '';
  const digits = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  return String(str).replace(/[0-9]/g, (d) => digits[parseInt(d, 10)]);
}

/**
 * Resolves all administrative location elements for a farmer record with robust fallbacks.
 */
export function resolveFarmerLocation(farmer) {
  if (!farmer) {
    return {
      village: '',
      taluka: '',
      district: '',
      pincode: '',
      villageMarathi: '',
      talukaMarathi: '',
      districtMarathi: '',
      pincodeMarathi: ''
    };
  }

  // 1. Resolve Raw Village
  let rawVillage = cleanVillageName(farmer.village || farmer.land_records?.[0]?.village || '');
  if (!rawVillage && farmer.address_english) {
    const vMatch = farmer.address_english.match(/(?:at\.?|mu\.?)\s*([A-Za-z]+)/i);
    if (vMatch) rawVillage = cleanVillageName(vMatch[1]);
  }

  // 2. Resolve Raw Taluka
  let rawTaluka = cleanTalukaName(farmer.taluka || farmer.land_records?.[0]?.taluka || '');
  if (!rawTaluka) {
    const fullText = `${farmer.village || ''} ${farmer.address_english || ''} ${farmer.land_records?.[0]?.village || ''}`;
    const tMatch = fullText.match(/(?:ta\.?|tal\.?|taluka)\s*([A-Za-z]+)/i);
    if (tMatch) rawTaluka = cleanTalukaName(tMatch[1]);
  }
  if (!rawTaluka && rawVillage && VILLAGE_INFO[rawVillage.toLowerCase()]) {
    rawTaluka = VILLAGE_INFO[rawVillage.toLowerCase()].taluka;
  }

  // 3. Resolve Raw District
  let rawDistrict = (farmer.district || farmer.land_records?.[0]?.district || '').trim();
  if (!rawDistrict && rawTaluka && TALUKA_TO_DISTRICT[rawTaluka.toLowerCase()]) {
    rawDistrict = TALUKA_TO_DISTRICT[rawTaluka.toLowerCase()];
  }
  if (!rawDistrict && rawVillage && VILLAGE_INFO[rawVillage.toLowerCase()]) {
    rawDistrict = VILLAGE_INFO[rawVillage.toLowerCase()].district;
  }
  if (!rawDistrict && farmer.address_english) {
    for (const distKey of Object.keys(MAHARASHTRA_DISTRICTS)) {
      if (farmer.address_english.toLowerCase().includes(distKey)) {
        rawDistrict = distKey.charAt(0).toUpperCase() + distKey.slice(1);
        break;
      }
    }
  }
  if (rawDistrict.toLowerCase() === 'aurangabad') {
    rawDistrict = 'Chhatrapati Sambhajinagar';
  }

  // 4. Resolve Pincode
  let rawPincode = (farmer.pincode || '').trim();
  if (!rawPincode && farmer.address_english) {
    const pinM = farmer.address_english.match(/\b(4\d{5})\b/);
    if (pinM) rawPincode = pinM[1];
  }
  if (!rawPincode && rawVillage && VILLAGE_INFO[rawVillage.toLowerCase()]) {
    rawPincode = VILLAGE_INFO[rawVillage.toLowerCase()].pincode;
  }
  if (!rawPincode && rawTaluka && rawTaluka.toLowerCase() === 'paithan') {
    rawPincode = '431137';
  }

  // 5. Devanagari Conversions
  const vLower = rawVillage.toLowerCase();
  const tLower = rawTaluka.toLowerCase();
  const dLower = rawDistrict.toLowerCase();

  const villageMarathi =
    COMMON_VILLAGES[vLower] ||
    (farmer.village && /[\u0900-\u097F]/.test(farmer.village)
      ? farmer.village.trim()
      : transliterateEnglishToMarathi(rawVillage));

  const talukaMarathi =
    MAHARASHTRA_TALUKAS[tLower] ||
    (farmer.taluka && /[\u0900-\u097F]/.test(farmer.taluka)
      ? farmer.taluka.trim()
      : transliterateEnglishToMarathi(rawTaluka));

  const districtMarathi =
    MAHARASHTRA_DISTRICTS[dLower] ||
    (farmer.district && /[\u0900-\u097F]/.test(farmer.district)
      ? farmer.district.trim()
      : transliterateEnglishToMarathi(rawDistrict));

  const pincodeMarathi = toMarathiDigits(rawPincode);

  return {
    village: rawVillage,
    taluka: rawTaluka,
    district: rawDistrict,
    pincode: rawPincode,
    villageMarathi,
    talukaMarathi,
    districtMarathi,
    pincodeMarathi
  };
}

/**
 * Generates an accurate, standard Marathi Address line for a farmer.
 * Guarantees that District and Village are included, and Devanagari formatting is complete.
 */
export function getMarathiAddress(farmer) {
  if (!farmer) return '';

  const loc = resolveFarmerLocation(farmer);

  // If farmer already has an explicit Devanagari address:
  if (farmer.address_marathi && /[\u0900-\u097F]/.test(farmer.address_marathi)) {
    let existing = farmer.address_marathi.trim();
    // Check if it's already a complete address (has district indicated by 'जि.' or district name)
    const hasDistrict =
      existing.includes('जि.') ||
      existing.includes('जिल्हा') ||
      (loc.districtMarathi && existing.includes(loc.districtMarathi)) ||
      existing.includes('संभाजीनगर') ||
      existing.includes('पुणे') ||
      existing.includes('नाशिक');

    if (hasDistrict) {
      return existing;
    }

    // Existing address is missing District: append District and Pincode
    if (loc.districtMarathi) {
      existing = `${existing}, जि. ${loc.districtMarathi}`;
    }
    if (loc.pincodeMarathi && !existing.includes(loc.pincodeMarathi)) {
      existing = `${existing} - ${loc.pincodeMarathi}`;
    }
    return existing;
  }

  // Construct complete standardized Devanagari postal address
  const parts = [];

  if (loc.villageMarathi && loc.villageMarathi.trim()) {
    parts.push(`मु. ${loc.villageMarathi.trim()}`);
  }

  if (loc.talukaMarathi && loc.talukaMarathi.trim() && loc.talukaMarathi !== loc.villageMarathi) {
    parts.push(`ता. ${loc.talukaMarathi.trim()}`);
  }

  if (loc.districtMarathi && loc.districtMarathi.trim()) {
    parts.push(`जि. ${loc.districtMarathi.trim()}`);
  }

  if (loc.pincodeMarathi) {
    if (parts.length > 0) {
      return `${parts.join(', ')} - ${loc.pincodeMarathi}`;
    }
    return `पिनकोड - ${loc.pincodeMarathi}`;
  }

  return parts.join(', ') || 'महाराष्ट्र';
}

/**
 * Generates an accurate, complete English Address line for a farmer.
 * Guarantees standard Postal format: At. [Village], Tal. [Taluka], Dist. [District] - [Pincode]
 */
export function getEnglishAddress(farmer) {
  if (!farmer) return '';

  const loc = resolveFarmerLocation(farmer);

  // If farmer already has an address, check if it's truly complete
  if (farmer.address_english && farmer.address_english.trim().length > 5) {
    const existing = farmer.address_english.trim();
    const lower = existing.toLowerCase();

    // Check if existing address already has district
    const hasDistrict =
      lower.includes('dist') ||
      (loc.district && lower.includes(loc.district.toLowerCase())) ||
      lower.includes('sambhajinagar') ||
      lower.includes('aurangabad') ||
      lower.includes('pune') ||
      lower.includes('nashik');

    // Also verify it isn't raw unpunctuated text like "At.vihamandwa ta.paithan"
    const isRawConcat = /^at\.[a-z0-9]+\s+ta\.[a-z0-9]+/i.test(existing);

    if (hasDistrict && !isRawConcat) {
      return existing;
    }
  }

  // Construct complete standardized English postal address
  const parts = [];

  if (loc.village) {
    parts.push(`At. ${loc.village}`);
  }

  if (loc.taluka && loc.taluka.toLowerCase() !== loc.village.toLowerCase()) {
    parts.push(`Tal. ${loc.taluka}`);
  }

  if (loc.district) {
    parts.push(`Dist. ${loc.district}`);
  }

  let result = parts.join(', ');
  if (loc.pincode) {
    result += ` - ${loc.pincode}`;
  }

  return result || 'Maharashtra';
}
