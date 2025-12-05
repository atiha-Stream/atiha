import { Country } from '@/types/phone'

// Base de données des pays africains et internationaux
export const COUNTRIES: Country[] = [
  // Pays africains - Afrique du Nord
  {
    code: 'DZ',
    name: 'Algérie',
    phoneCode: '+213',
    flag: '🇩🇿',
    phonePattern: /^([5-7][0-9]{8})$/,
    example: '551234567'
  },
  {
    code: 'EG',
    name: 'Égypte',
    phoneCode: '+20',
    flag: '🇪🇬',
    phonePattern: /^([1][0-9]{9})$/,
    example: '1012345678'
  },
  {
    code: 'LY',
    name: 'Libye',
    phoneCode: '+218',
    flag: '🇱🇾',
    phonePattern: /^([9][0-9]{8})$/,
    example: '912345678'
  },
  {
    code: 'MA',
    name: 'Maroc',
    phoneCode: '+212',
    flag: '🇲🇦',
    phonePattern: /^([6-7][0-9]{8})$/,
    example: '600691801'
  },
  {
    code: 'SS',
    name: 'Soudan du Sud',
    phoneCode: '+211',
    flag: '🇸🇸',
    phonePattern: /^([9][0-9]{8})$/,
    example: '912345678'
  },
  {
    code: 'SD',
    name: 'Soudan',
    phoneCode: '+249',
    flag: '🇸🇩',
    phonePattern: /^([9][0-9]{8})$/,
    example: '912345678'
  },
  {
    code: 'TN',
    name: 'Tunisie',
    phoneCode: '+216',
    flag: '🇹🇳',
    phonePattern: /^([2-5][0-9]{7})$/,
    example: '20123456'
  },

  // Pays africains - Afrique de l'Ouest
  {
    code: 'BJ',
    name: 'Bénin',
    phoneCode: '+229',
    flag: '🇧🇯',
    phonePattern: /^([6-7][0-9]{7})$/,
    example: '61234567'
  },
  {
    code: 'BF',
    name: 'Burkina Faso',
    phoneCode: '+226',
    flag: '🇧🇫',
    phonePattern: /^([6-7][0-9]{7})$/,
    example: '61234567'
  },
  {
    code: 'CV',
    name: 'Cap-Vert',
    phoneCode: '+238',
    flag: '🇨🇻',
    phonePattern: /^([9][0-9]{6})$/,
    example: '9123456'
  },
  {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    phoneCode: '+225',
    flag: '🇨🇮',
    phonePattern: /^([0-9][0-9]{7})$/,
    example: '01234567'
  },
  {
    code: 'GM',
    name: 'Gambie',
    phoneCode: '+220',
    flag: '🇬🇲',
    phonePattern: /^([3-7][0-9]{6})$/,
    example: '3123456'
  },
  {
    code: 'GH',
    name: 'Ghana',
    phoneCode: '+233',
    flag: '🇬🇭',
    phonePattern: /^([2-5][0-9]{8})$/,
    example: '201234567'
  },
  {
    code: 'GN',
    name: 'Guinée',
    phoneCode: '+224',
    flag: '🇬🇳',
    phonePattern: /^([6-7][0-9]{7})$/,
    example: '61234567'
  },
  {
    code: 'GW',
    name: 'Guinée-Bissau',
    phoneCode: '+245',
    flag: '🇬🇼',
    phonePattern: /^([9][0-9]{7})$/,
    example: '91234567'
  },
  {
    code: 'LR',
    name: 'Liberia',
    phoneCode: '+231',
    flag: '🇱🇷',
    phonePattern: /^([4-7][0-9]{7})$/,
    example: '41234567'
  },
  {
    code: 'ML',
    name: 'Mali',
    phoneCode: '+223',
    flag: '🇲🇱',
    phonePattern: /^([6-7][0-9]{7})$/,
    example: '61234567'
  },
  {
    code: 'MR',
    name: 'Mauritanie',
    phoneCode: '+222',
    flag: '🇲🇷',
    phonePattern: /^([2-4][0-9]{7})$/,
    example: '21234567'
  },
  {
    code: 'NE',
    name: 'Niger',
    phoneCode: '+227',
    flag: '🇳🇪',
    phonePattern: /^([9][0-9]{7})$/,
    example: '91234567'
  },
  {
    code: 'NG',
    name: 'Nigeria',
    phoneCode: '+234',
    flag: '🇳🇬',
    phonePattern: /^([8][0-1][0-9]{8})$/,
    example: '8012345678'
  },
  {
    code: 'SN',
    name: 'Sénégal',
    phoneCode: '+221',
    flag: '🇸🇳',
    phonePattern: /^([7][0-9]{8})$/,
    example: '712345678'
  },
  {
    code: 'SL',
    name: 'Sierra Leone',
    phoneCode: '+232',
    flag: '🇸🇱',
    phonePattern: /^([2-3][0-9]{7})$/,
    example: '21234567'
  },
  {
    code: 'TG',
    name: 'Togo',
    phoneCode: '+228',
    flag: '🇹🇬',
    phonePattern: /^([9][0-9]{7})$/,
    example: '91234567'
  },

  // Pays africains - Afrique centrale
  {
    code: 'AO',
    name: 'Angola',
    phoneCode: '+244',
    flag: '🇦🇴',
    phonePattern: /^([9][0-9]{8})$/,
    example: '912345678'
  },
  {
    code: 'CM',
    name: 'Cameroun',
    phoneCode: '+237',
    flag: '🇨🇲',
    phonePattern: /^([6-7][0-9]{8})$/,
    example: '612345678'
  },
  {
    code: 'CF',
    name: 'République centrafricaine',
    phoneCode: '+236',
    flag: '🇨🇫',
    phonePattern: /^([7][0-9]{7})$/,
    example: '71234567'
  },
  {
    code: 'CG',
    name: 'République du Congo',
    phoneCode: '+242',
    flag: '🇨🇬',
    phonePattern: /^([0][0-9]{8})$/,
    example: '012345678'
  },
  {
    code: 'CD',
    name: 'République démocratique du Congo',
    phoneCode: '+243',
    flag: '🇨🇩',
    phonePattern: /^([8-9][0-9]{8})$/,
    example: '812345678'
  },
  {
    code: 'GQ',
    name: 'Guinée équatoriale',
    phoneCode: '+240',
    flag: '🇬🇶',
    phonePattern: /^([2][0-9]{7})$/,
    example: '21234567'
  },
  {
    code: 'GA',
    name: 'Gabon',
    phoneCode: '+241',
    flag: '🇬🇦',
    phonePattern: /^([0][0-9]{7})$/,
    example: '01234567'
  },
  {
    code: 'ST',
    name: 'Sao Tomé-et-Principe',
    phoneCode: '+239',
    flag: '🇸🇹',
    phonePattern: /^([9][0-9]{6})$/,
    example: '9123456'
  },
  {
    code: 'TD',
    name: 'Tchad',
    phoneCode: '+235',
    flag: '🇹🇩',
    phonePattern: /^([6-7][0-9]{7})$/,
    example: '61234567'
  },

  // Pays africains - Afrique de l'Est
  {
    code: 'BI',
    name: 'Burundi',
    phoneCode: '+257',
    flag: '🇧🇮',
    phonePattern: /^([6-9][0-9]{7})$/,
    example: '61234567'
  },
  {
    code: 'KM',
    name: 'Comores',
    phoneCode: '+269',
    flag: '🇰🇲',
    phonePattern: /^([3][0-9]{6})$/,
    example: '3123456'
  },
  {
    code: 'DJ',
    name: 'Djibouti',
    phoneCode: '+253',
    flag: '🇩🇯',
    phonePattern: /^([7][0-9]{7})$/,
    example: '71234567'
  },
  {
    code: 'ER',
    name: 'Érythrée',
    phoneCode: '+291',
    flag: '🇪🇷',
    phonePattern: /^([1][0-9]{6})$/,
    example: '1123456'
  },
  {
    code: 'ET',
    name: 'Éthiopie',
    phoneCode: '+251',
    flag: '🇪🇹',
    phonePattern: /^([9][0-9]{8})$/,
    example: '912345678'
  },
  {
    code: 'KE',
    name: 'Kenya',
    phoneCode: '+254',
    flag: '🇰🇪',
    phonePattern: /^([7][0-9]{8})$/,
    example: '712345678'
  },
  {
    code: 'MG',
    name: 'Madagascar',
    phoneCode: '+261',
    flag: '🇲🇬',
    phonePattern: /^([3][0-9]{8})$/,
    example: '312345678'
  },
  {
    code: 'MW',
    name: 'Malawi',
    phoneCode: '+265',
    flag: '🇲🇼',
    phonePattern: /^([9][0-9]{8})$/,
    example: '912345678'
  },
  {
    code: 'MU',
    name: 'Maurice',
    phoneCode: '+230',
    flag: '🇲🇺',
    phonePattern: /^([5][0-9]{7})$/,
    example: '51234567'
  },
  {
    code: 'MZ',
    name: 'Mozambique',
    phoneCode: '+258',
    flag: '🇲🇿',
    phonePattern: /^([8][0-9]{8})$/,
    example: '812345678'
  },
  {
    code: 'RW',
    name: 'Rwanda',
    phoneCode: '+250',
    flag: '🇷🇼',
    phonePattern: /^([7][0-9]{8})$/,
    example: '712345678'
  },
  {
    code: 'SC',
    name: 'Seychelles',
    phoneCode: '+248',
    flag: '🇸🇨',
    phonePattern: /^([2][0-9]{6})$/,
    example: '2123456'
  },
  {
    code: 'SO',
    name: 'Somalie',
    phoneCode: '+252',
    flag: '🇸🇴',
    phonePattern: /^([6-7][0-9]{7})$/,
    example: '61234567'
  },
  {
    code: 'TZ',
    name: 'Tanzanie',
    phoneCode: '+255',
    flag: '🇹🇿',
    phonePattern: /^([6-7][0-9]{8})$/,
    example: '612345678'
  },
  {
    code: 'UG',
    name: 'Ouganda',
    phoneCode: '+256',
    flag: '🇺🇬',
    phonePattern: /^([7][0-9]{8})$/,
    example: '712345678'
  },

  // Pays africains - Afrique australe
  {
    code: 'BW',
    name: 'Botswana',
    phoneCode: '+267',
    flag: '🇧🇼',
    phonePattern: /^([7][0-9]{7})$/,
    example: '71234567'
  },
  {
    code: 'LS',
    name: 'Lesotho',
    phoneCode: '+266',
    flag: '🇱🇸',
    phonePattern: /^([5-6][0-9]{7})$/,
    example: '51234567'
  },
  {
    code: 'NA',
    name: 'Namibie',
    phoneCode: '+264',
    flag: '🇳🇦',
    phonePattern: /^([8][0-9]{7})$/,
    example: '81234567'
  },
  {
    code: 'ZA',
    name: 'Afrique du Sud',
    phoneCode: '+27',
    flag: '🇿🇦',
    phonePattern: /^([6-8][0-9]{8})$/,
    example: '712345678'
  },
  {
    code: 'SZ',
    name: 'Eswatini',
    phoneCode: '+268',
    flag: '🇸🇿',
    phonePattern: /^([7][0-9]{7})$/,
    example: '71234567'
  },
  {
    code: 'ZW',
    name: 'Zimbabwe',
    phoneCode: '+263',
    flag: '🇿🇼',
    phonePattern: /^([7][0-9]{8})$/,
    example: '712345678'
  },
  {
    code: 'ZM',
    name: 'Zambie',
    phoneCode: '+260',
    flag: '🇿🇲',
    phonePattern: /^([9][0-9]{8})$/,
    example: '912345678'
  },

  // Territoires et régions spéciales
  {
    code: 'SH',
    name: 'Sainte-Hélène (Royaume-Uni)',
    phoneCode: '+290',
    flag: '🇸🇭',
    phonePattern: /^([2-4][0-9]{3})$/,
    example: '2123'
  },
  {
    code: 'AC',
    name: 'Ascension',
    phoneCode: '+247',
    flag: '🇦🇨',
    phonePattern: /^([2-4][0-9]{3})$/,
    example: '2123'
  },
  {
    code: 'TA',
    name: 'Tristan da Cunha (Royaume-Uni)',
    phoneCode: '+290',
    flag: '🇹🇦',
    phonePattern: /^([2-4][0-9]{3})$/,
    example: '2123'
  },
  {
    code: 'YT',
    name: 'Mayotte (France)',
    phoneCode: '+262',
    flag: '🇾🇹',
    phonePattern: /^([6-7][0-9]{8})$/,
    example: '612345678'
  },
  {
    code: 'RE',
    name: 'La Réunion (France)',
    phoneCode: '+262',
    flag: '🇷🇪',
    phonePattern: /^([6-7][0-9]{8})$/,
    example: '612345678'
  },
  {
    code: 'IC',
    name: 'Îles Canaries (Espagne)',
    phoneCode: '+34',
    flag: '🇮🇨',
    phonePattern: /^([6-9][0-9]{8})$/,
    example: '612345678'
  },
  {
    code: 'CE',
    name: 'Ceuta (Espagne)',
    phoneCode: '+34',
    flag: '🇨🇪',
    phonePattern: /^([6-9][0-9]{8})$/,
    example: '612345678'
  },
  {
    code: 'PT-MA',
    name: 'Madère (Portugal)',
    phoneCode: '+351',
    flag: '🇵🇹',
    phonePattern: /^([9][0-9]{8})$/,
    example: '912345678'
  },
  {
    code: 'ME',
    name: 'Melilla (Espagne)',
    phoneCode: '+34',
    flag: '🇪🇸',
    phonePattern: /^([6-9][0-9]{8})$/,
    example: '612345678'
  },
  {
    code: 'PS',
    name: 'Plazas de soberanía (Espagne)',
    phoneCode: '+34',
    flag: '🇪🇸',
    phonePattern: /^([6-9][0-9]{8})$/,
    example: '612345678'
  },
  {
    code: 'EH',
    name: 'Sahara occidental',
    phoneCode: '+212',
    flag: '🇪🇭',
    phonePattern: /^([6-7][0-9]{8})$/,
    example: '60069180'
  },
  {
    code: 'SO-SL',
    name: 'Somaliland (Somalie)',
    phoneCode: '+252',
    flag: '🇸🇴',
    phonePattern: /^([6-7][0-9]{7})$/,
    example: '61234567'
  },

  // Pays internationaux (pour référence)
  {
    code: 'FR',
    name: 'France',
    phoneCode: '+33',
    flag: '🇫🇷',
    phonePattern: /^(0[1-9]|[1-9][0-9])([0-9]{8})$/,
    example: '0612345678'
  },
  {
    code: 'US',
    name: 'États-Unis',
    phoneCode: '+1',
    flag: '🇺🇸',
    phonePattern: /^([2-9][0-9]{9})$/,
    example: '2015551234'
  },
  {
    code: 'GB',
    name: 'Royaume-Uni',
    phoneCode: '+44',
    flag: '🇬🇧',
    phonePattern: /^([1-9][0-9]{9,10})$/,
    example: '2012345678'
  },
  {
    code: 'DE',
    name: 'Allemagne',
    phoneCode: '+49',
    flag: '🇩🇪',
    phonePattern: /^([1-9][0-9]{8,11})$/,
    example: '15123456789'
  },
  {
    code: 'ES',
    name: 'Espagne',
    phoneCode: '+34',
    flag: '🇪🇸',
    phonePattern: /^([6-9][0-9]{8})$/,
    example: '612345678'
  },
  {
    code: 'IT',
    name: 'Italie',
    phoneCode: '+39',
    flag: '🇮🇹',
    phonePattern: /^([3][0-9]{8,9})$/,
    example: '3123456789'
  }
]

// Fonction pour trouver un pays par son code
export const findCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find(country => country.code === code)
}

// Fonction pour trouver un pays par son code téléphonique
export const findCountryByPhoneCode = (phoneCode: string): Country | undefined => {
  return COUNTRIES.find(country => country.phoneCode === phoneCode)
}

// Fonction pour obtenir les pays triés par nom
export const getSortedCountries = (): Country[] => {
  return [...COUNTRIES].sort((a, b) => a.name.localeCompare(b.name))
}

// Fonction pour ajouter des pays (pour votre liste personnalisée)
export const addCountries = (newCountries: Country[]): void => {
  COUNTRIES.push(...newCountries)
}

// Fonction pour remplacer complètement la liste des pays
export const setCountries = (countries: Country[]): void => {
  COUNTRIES.length = 0
  COUNTRIES.push(...countries)
}