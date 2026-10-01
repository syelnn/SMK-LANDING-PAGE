// src/theme/themePalettes.js

export const THEME_PALETTES = {
  // ==========================================
  // REGULER
  // ==========================================
  compreng_default: {
    label: 'Original SMK Compreng', category: 'reguler',
    bg: '#F7F9F8', surface: '#FFFFFF', surfaceSoft: '#F1F6F3',
    textMain: '#1B2521', textMuted: '#607069',
    primary: '#168A4A', primaryDark: '#10683A',
    accent: '#F4C84A', navBg: '#172A3A', border: '#E2EAE5',
  },
  emerald_gold: {
    label: 'Emerald Gold', category: 'reguler',
    bg: '#F8FAFC', surface: '#FFFFFF', surfaceSoft: '#ECFDF5',
    textMain: '#064E3B', textMuted: '#475569',
    primary: '#0A7E2E', primaryDark: '#065F35',
    accent: '#EAB308', navBg: '#022C22', border: '#DCFCE7',
  },
  golden_nature: {
    label: 'Golden Nature', category: 'reguler',
    bg: '#FDFDFA', surface: '#FFFFFF', surfaceSoft: '#FFF7D9',
    textMain: '#0F172A', textMuted: '#64748B',
    primary: '#FFC107', primaryDark: '#E0A800',
    accent: '#0A7E2E', navBg: '#0A7E2E', border: '#FEF08A',
  },
  fresh_compreng: {
    label: 'Fresh Compreng', category: 'reguler',
    bg: '#F0FDF4', surface: '#FFFFFF', surfaceSoft: '#DCFCE7',
    textMain: '#1E293B', textMuted: '#475569',
    primary: '#15803D', primaryDark: '#116932',
    accent: '#22C55E', navBg: '#FFFFFF', border: '#BBF7D0',
  },
  soft_beige: {
    label: 'Soft Beige (Nude)', category: 'reguler',
    bg: '#EDEEE9', surface: '#F5EBE1', surfaceSoft: '#E3D5CA',
    textMain: '#5C4D44', textMuted: '#7A6A61',
    primary: '#D7BDB0', primaryDark: '#C1A395',
    accent: '#B08968', navBg: '#D6CCC2', border: '#E3D5CA',
  },
  earthy_green: {
    label: 'Earthy Green', category: 'reguler',
    bg: '#FEF9E1', surface: '#FAEDCD', surfaceSoft: '#E9EDCA',
    textMain: '#3E5C14', textMuted: '#6B8E23',
    primary: '#CDD5AE', primaryDark: '#A9B389',
    accent: '#D3A373', navBg: '#D3A373', border: '#E9EDCA',
  },
  peach_sunset: {
    label: 'Peach Sunset', category: 'reguler',
    bg: '#F6EBED', surface: '#FFDFC3', surfaceSoft: '#FBA2AB',
    textMain: '#8A1C11', textMuted: '#B24D3E',
    primary: '#FEA38E', primaryDark: '#E5836C',
    accent: '#FBA2AB', navBg: '#FBA2AB', border: '#FFDFC3',
  },
  orange_sunset: {
    label: 'Orange Sunset', category: 'reguler',
    bg: '#E7C9C0', surface: '#F3CDBF', surfaceSoft: '#E89A4E',
    textMain: '#5C1A11', textMuted: '#8A2D22',
    primary: '#FE8863', primaryDark: '#E56C46',
    accent: '#D93B2C', navBg: '#D93B2C', border: '#E89A4E',
  },
  lavender_olive: {
    label: 'Lavender Olive', category: 'reguler',
    bg: '#EDDED2', surface: '#ADB5D6', surfaceSoft: '#C7D86F',
    textMain: '#2B124C', textMuted: '#4B3F6E',
    primary: '#692E82', primaryDark: '#551F6B',
    accent: '#C7D86F', navBg: '#97A1CC', border: '#C7D86F',
  },
  purple_lavender: {
    label: 'Purple Lavender', category: 'reguler',
    bg: '#DCD7D5', surface: '#BA96C1', surfaceSoft: '#9C8CB9',
    textMain: '#190019', textMuted: '#2B124C',
    primary: '#4B3F6E', primaryDark: '#382F54',
    accent: '#6C5F8D', navBg: '#6C5F8D', border: '#9C8CB9',
  },

  // ==========================================
  // SPESIAL — HARI BESAR
  // ==========================================
  hari_santri: {
    label: 'Maulid / Hari Santri (Hijau-Emas Islami)', category: 'spesial',
    bg: '#FBF8F1', surface: '#FFFFFF', surfaceSoft: '#F0F5EE',
    textMain: '#1B3B2F', textMuted: '#5C6F63',
    primary: '#0B6E4F', primaryDark: '#054A34',
    accent: '#D4AF37', navBg: '#0B3D2E', border: '#DCE8DE',
  },
  hari_kemerdekaan: {
    label: 'Hari Kemerdekaan (Merah-Putih)', category: 'spesial',
    bg: '#FFFFFF', surface: '#FFFFFF', surfaceSoft: '#FEF2F2',
    textMain: '#1F1F1F', textMuted: '#5B5B5B',
    primary: '#CE1126', primaryDark: '#A30E1F',
    accent: '#B8860B', navBg: '#7A0C1E', border: '#F4C7CC',
  },
  hari_batik: {
    label: 'Hari Batik Nasional (Sogan-Indigo)', category: 'spesial',
    bg: '#FBF5EC', surface: '#FFFFFF', surfaceSoft: '#F3E8D7',
    textMain: '#3B2417', textMuted: '#7A5C42',
    primary: '#8B4513', primaryDark: '#5E2F0D',
    accent: '#2E4374', navBg: '#3B2417', border: '#E4D3B8',
  },
  hari_pendidikan: {
    label: 'Hari Pendidikan Nasional (Biru-Emas)', category: 'spesial',
    bg: '#F5F9FF', surface: '#FFFFFF', surfaceSoft: '#E8F1FC',
    textMain: '#0B2545', textMuted: '#4A5D75',
    primary: '#1E5AA8', primaryDark: '#123E77',
    accent: '#F2A93B', navBg: '#0B2545', border: '#D6E4F5',
  },

  // ==========================================
  // GELAP & MODERN (lebih nyaman di mata)
  // ==========================================
  modern_slate_dark: {
    label: 'Slate Dark (Modern)', category: 'gelap',
    bg: '#12151A', surface: '#1B1F27', surfaceSoft: '#232833',
    textMain: '#E7EAEE', textMuted: '#9AA3B2',
    primary: '#4C8BF5', primaryDark: '#3568C4',
    accent: '#5EEAD4', navBg: '#0B0D11', border: '#2A2F3A',
  },
  midnight_forest: {
    label: 'Midnight Forest (Hijau Gelap)', category: 'gelap',
    bg: '#0E1512', surface: '#16201B', surfaceSoft: '#1E2A23',
    textMain: '#E4EDE8', textMuted: '#96A79D',
    primary: '#3FA772', primaryDark: '#2C7A52',
    accent: '#D9B44A', navBg: '#0A100D', border: '#243229',
  },
  graphite_gold: {
    label: 'Graphite Gold (Elegan Gelap)', category: 'gelap',
    bg: '#15161A', surface: '#1E2025', surfaceSoft: '#26282E',
    textMain: '#EDEDED', textMuted: '#A3A3AA',
    primary: '#C9A227', primaryDark: '#9C7D1B',
    accent: '#6D9DC5', navBg: '#0D0E10', border: '#2E3036',
  },
  dark_olive: {
    label: 'Dark Olive (Klasik)', category: 'gelap',
    bg: '#101511', surface: '#222922', surfaceSoft: '#1A1F1A',
    textMain: '#FFFFFF', textMuted: '#A3AFA3',
    primary: '#717476', primaryDark: '#5A5D5F',
    accent: '#C7D86F', navBg: '#101916', border: '#3D4633',
  },
  purple_dark: {
    label: 'Purple Dark', category: 'gelap',
    bg: '#190019', surface: '#2B124C', surfaceSoft: '#33165A',
    textMain: '#FBE4D8', textMuted: '#DFB6B2',
    primary: '#854F6C', primaryDark: '#6E3F58',
    accent: '#DFB6B2', navBg: '#522B5B', border: '#522B5B',
  },
};

export const buildCustomPalette = (data) => ({
  label: 'Kustomisasi Bebas', category: 'custom',
  bg: data.custom_bg || '#F7F9F8',
  surface: data.custom_card || '#FFFFFF',
  surfaceSoft: data.custom_card || '#F1F6F3',
  textMain: data.custom_text_main || '#1B2521',
  textMuted: data.custom_text_muted || '#607069',
  primary: data.custom_accent || '#168A4A',
  primaryDark: data.custom_accent || '#10683A',
  accent: data.custom_accent || '#F4C84A',
  navBg: data.custom_nav_bg || '#172A3A',
  border: data.custom_border || '#E2EAE5',
});

export const getPaletteByMode = (mode, data = {}) => {
  if (mode === 'custom') return buildCustomPalette(data);
  return THEME_PALETTES[mode] || THEME_PALETTES.compreng_default;
};

// Dikelompokkan per kategori untuk render <optgroup> di dropdown
export const THEME_GROUPS = [
  {
    label: 'Reguler',
    options: Object.entries(THEME_PALETTES)
      .filter(([, p]) => p.category === 'reguler')
      .map(([value, p]) => ({ value, label: p.label })),
  },
  {
    label: 'Spesial — Hari Besar',
    options: Object.entries(THEME_PALETTES)
      .filter(([, p]) => p.category === 'spesial')
      .map(([value, p]) => ({ value, label: p.label })),
  },
  {
    label: 'Gelap & Modern',
    options: Object.entries(THEME_PALETTES)
      .filter(([, p]) => p.category === 'gelap')
      .map(([value, p]) => ({ value, label: p.label })),
  },
  {
    label: 'Lainnya',
    options: [{ value: 'custom', label: 'Kustomisasi Bebas' }],
  },
];