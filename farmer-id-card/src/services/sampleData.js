/**
 * Sample Farmer Records
 * Includes real-world references from AgriStack and Maharashtra Farmer Registry.
 * Fully supports 1, 2, 3, 4, 5+ land records per farmer and compact dual-language addresses.
 */

export const SAMPLE_FARMERS = [
  {
    id: 'farmer-001',
    farmer_id: '38533702295',
    farmer_enrollment_number: '27_469_4141_549554_005672',
    name_english: 'Vilas Sopanrao Tupkari',
    name_marathi: 'विलास सोपान तुपकरी',
    dob: '10/10/1977',
    gender: 'Male / पुरुष',
    mobile: '9423455585',
    uid: 'XXXX XXXX 1098',
    photo: '/sample_farmer_photo.jpg',
    photo_settings: {
      zoom: 1.08,
      panX: 0,
      panY: -2,
      brightness: 112,
      contrast: 108,
      sharpen: 30,
      objectPosition: '50% 48%'
    },
    address_english: 'Vihamandwa, Paithan, Chhatrapati Sambhajinagar - 431137',
    address_marathi: 'विहामांडवा, पैठण, छत्रपती संभाजीनगर - ४३११३७',
    village: 'Vihamandwa',
    taluka: 'Paithan',
    district: 'Chhatrapati Sambhajinagar',
    pincode: '431137',
    land_records: [
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Vihamandwa',
        survey_no: '79',
        area: '0.0400 Ha',
        owner_share: 'Joint'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Vihamandwa',
        survey_no: '426',
        area: '0.8800 Ha',
        owner_share: 'Single'
      }
    ]
  },
  {
    id: 'farmer-003',
    farmer_id: '65940671942',
    farmer_enrollment_number: '27_469_4141_549551_005301',
    name_english: 'Bharat Rajabhau Pawar',
    name_marathi: 'भरत राजाभाऊ पवार',
    dob: '01/01/1958',
    gender: 'Male / पुरुष',
    mobile: '9422529424',
    uid: '36495715884',
    photo: '/bharat_pawar_photo.jpg',
    photo_settings: {
      zoom: 1.06,
      panX: 0,
      panY: -1,
      brightness: 106,
      contrast: 105,
      sharpen: 25,
      objectPosition: '50% 49%'
    },
    address_english: 'Mirkheda, Vihamandwa, Paithan, Chhatrapati Sambhajinagar - 431137',
    address_marathi: 'मु. मिरखेडा, पो. विहामांडवा, ता. पैठण, जि. छत्रपती संभाजीनगर - ४३११३७',
    village: 'Mirkheda',
    taluka: 'Paithan',
    district: 'Chhatrapati Sambhajinagar',
    pincode: '431137',
    land_records: [
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Mirkheda',
        survey_no: '9',
        area: '1.2500 Ha',
        owner_share: 'Single'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Mirkheda',
        survey_no: '130/3',
        area: '1.2400 Ha',
        owner_share: 'Joint'
      }
    ]
  },
  {
    id: 'farmer-005',
    farmer_id: '8220502510',
    farmer_enrollment_number: '27_469_4141_549554_008912',
    name_english: 'Bapurao Namdeo Deshmukh',
    name_marathi: 'बापुराव नामदेव देशमुख',
    dob: '12/04/1972',
    gender: 'Male / पुरुष',
    mobile: '9822456789',
    uid: 'XXXX XXXX 4512',
    photo: '/sample_farmer_photo.jpg',
    address_english: 'Vihamandwa, Paithan, Chhatrapati Sambhajinagar - 431137',
    address_marathi: 'विहामांडवा, पैठण, छत्रपती संभाजीनगर - ४३११३७',
    village: 'Vihamandwa',
    taluka: 'Paithan',
    district: 'Chhatrapati Sambhajinagar',
    pincode: '431137',
    land_records: [
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Vihamandwa',
        survey_no: '79',
        area: '0.0400 Ha',
        owner_share: 'Joint'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Vihamandwa',
        survey_no: '426',
        area: '0.8800 Ha',
        owner_share: 'Single'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Vihamandwa',
        survey_no: '512',
        area: '0.3200 Ha',
        owner_share: 'Joint'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Vihamandwa',
        survey_no: '604/A',
        area: '0.6400 Ha',
        owner_share: 'Single'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Vihamandwa',
        survey_no: '715',
        area: '1.1500 Ha',
        owner_share: 'Joint'
      }
    ]
  },
  {
    id: 'farmer-006',
    farmer_id: '38533701108',
    farmer_enrollment_number: '27_469_4141_549554_001108',
    name_english: 'Anand Shrirang Jadhav',
    name_marathi: 'आनंद श्रीरंग जाधव',
    dob: '05/08/1985',
    gender: 'Male / पुरुष',
    mobile: '9765123456',
    uid: 'XXXX XXXX 8891',
    photo: '',
    address_english: 'Georai, Paithan, Chhatrapati Sambhajinagar - 431148',
    address_marathi: 'गेवराई, पैठण, छत्रपती संभाजीनगर - ४३११४८',
    village: 'Georai',
    taluka: 'Paithan',
    district: 'Chhatrapati Sambhajinagar',
    pincode: '431148',
    land_records: [
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Georai',
        survey_no: '108',
        area: '0.7500 Ha',
        owner_share: 'Single'
      }
    ]
  },
  {
    id: 'farmer-007',
    farmer_id: '38533703345',
    farmer_enrollment_number: '27_469_4141_549554_003345',
    name_english: 'Sanjay Pandurang Shinde',
    name_marathi: 'संजय पांडुरंग शिंदे',
    dob: '22/11/1979',
    gender: 'Male / पुरुष',
    mobile: '9921789456',
    uid: 'XXXX XXXX 3345',
    photo: '',
    address_english: 'Bidkin, Paithan, Chhatrapati Sambhajinagar - 431105',
    address_marathi: 'बिडकीन, पैठण, छत्रपती संभाजीनगर - ४३११०५',
    village: 'Bidkin',
    taluka: 'Paithan',
    district: 'Chhatrapati Sambhajinagar',
    pincode: '431105',
    land_records: [
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Bidkin',
        survey_no: '45/1',
        area: '0.4500 Ha',
        owner_share: 'Single'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Bidkin',
        survey_no: '89',
        area: '0.6200 Ha',
        owner_share: 'Joint'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Bidkin',
        survey_no: '112/B',
        area: '0.2800 Ha',
        owner_share: 'Single'
      }
    ]
  },
  {
    id: 'farmer-008',
    farmer_id: '38533704456',
    farmer_enrollment_number: '27_469_4141_549554_004456',
    name_english: 'Rameshwar Uttamrao More',
    name_marathi: 'रामेश्वर उत्तमराव मोरे',
    dob: '18/03/1983',
    gender: 'Male / पुरुष',
    mobile: '9421567890',
    uid: 'XXXX XXXX 4456',
    photo: '',
    address_english: 'Pachod, Paithan, Chhatrapati Sambhajinagar - 431121',
    address_marathi: 'पाचोड, पैठण, छत्रपती संभाजीनगर - ४३११२१',
    village: 'Pachod',
    taluka: 'Paithan',
    district: 'Chhatrapati Sambhajinagar',
    pincode: '431121',
    land_records: [
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Pachod',
        survey_no: '14',
        area: '0.3500 Ha',
        owner_share: 'Single'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Pachod',
        survey_no: '28/1',
        area: '0.5000 Ha',
        owner_share: 'Joint'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Pachod',
        survey_no: '56',
        area: '0.9000 Ha',
        owner_share: 'Single'
      },
      {
        district: 'Chhatrapati Sambhajinagar',
        taluka: 'Paithan',
        village: 'Pachod',
        survey_no: '70/A',
        area: '0.4200 Ha',
        owner_share: 'Joint'
      }
    ]
  },
  {
    id: 'farmer-002',
    farmer_id: '8220 5020 510',
    farmer_enrollment_number: '27_469_4141_549554_009842',
    name_english: 'Kesarsing Sabarsing Patil',
    name_marathi: 'केसरसिंग सबनसिंग पाटील',
    dob: '01/06/1960',
    gender: 'Male / पुरुष',
    mobile: '9869873435',
    uid: '9869 8734 3542',
    photo: '/extracted_kesarsing_photo.jpg',
    address_english: 'Pimprala, Jalgaon - 425002',
    address_marathi: 'पिंप्राळा, जळगाव - ४२५००२',
    village: 'Pimprala',
    taluka: 'Jalgaon',
    district: 'Jalgaon',
    pincode: '425002',
    land_records: [
      {
        district: 'Jalgaon',
        taluka: 'Jalgaon',
        village: 'Pimprala',
        survey_no: '26 (Khasra)',
        area: '1.0500 Ha',
        owner_share: 'Single'
      },
      {
        district: 'Jalgaon',
        taluka: 'Jalgaon',
        village: 'Pimprala',
        survey_no: '42',
        area: '0.4500 Ha',
        owner_share: 'Joint'
      }
    ]
  }
];
